const mongoose = require("mongoose");
const Review = require("../models/Review");
const Course = require("../models/Course");
const { HTTP_STATUS } = require("../config/constants");

async function recallCourseRating(courseId) {
  const id =
    courseId instanceof mongoose.Types.ObjectId
      ? courseId
      : new mongoose.Types.ObjectId(courseId);

  const result = await Review.aggregate([
    { $match: { course: id } },
    {
      $group: {
        _id: "$course",
        avgRating: { $avg: "$rating" },
        count: { $sum: 1 },
      },
    },
  ]);

  const avgRating =
    result.length > 0 ? parseFloat(result[0].avgRating.toFixed(1)) : 0;
  const reviewCount = result.length > 0 ? result[0].count : 0;

  await Course.findByIdAndUpdate(courseId, { rating: avgRating, reviewCount });
}

async function checkEnrolled(courseId, studentId) {
  const course = await Course.findById(courseId).select("studentsEnrolled");
  if (!course) {
    const err = new Error("Course not found");
    err.statusCode = HTTP_STATUS.NOT_FOUND;
    throw err;
  }

  const isEnrolled = course.studentsEnrolled.some(
    (id) => id.toString() === studentId.toString(),
  );

  if (!isEnrolled) {
    const err = new Error(
      "You must be enrolled in this course to leave a review",
    );
    err.statusCode = HTTP_STATUS.FORBIDDEN;
    throw err;
  }
}

const reviewService = {
  async submitReview(courseId, studentId, { rating, comment }) {
    if (
      !rating ||
      !Number.isInteger(Number(rating)) ||
      rating < 1 ||
      rating > 5
    ) {
      const err = new Error("Rating must be a whole number between 1 and 5");
      err.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw err;
    }

    await checkEnrolled(courseId, studentId);

    const existing = await Review.findOne({
      course: courseId,
      student: studentId,
    });

    let review;
    if (existing) {
      existing.rating = rating;
      existing.comment = comment !== undefined ? comment : existing.comment;
      review = await existing.save();
    } else {
      review = await Review.create({
        course: courseId,
        student: studentId,
        rating,
        comment: comment || "",
      });
    }

    await recallCourseRating(review.course);
    return review;
  },

  async deleteReview(courseId, studentId) {
    const review = await Review.findOneAndDelete({
      course: courseId,
      student: studentId,
    });

    if (!review) {
      const err = new Error("Review not found");
      err.statusCode = HTTP_STATUS.NOT_FOUND;
      throw err;
    }

    await recallCourseRating(courseId);
    return { message: "Review deleted successfully" };
  },

  async getStudentReview(courseId, studentId) {
    const review = await Review.findOne({
      course: courseId,
      student: studentId,
    });
    return review;
  },

  async getCourseReviews(courseId, { page = 1, limit = 10 } = {}) {
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      Review.find({ course: courseId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate("student", "name profileImage profileImageURL"),
      Review.countDocuments({ course: courseId }),
    ]);

    return {
      reviews,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async getCourseReviewSummary(courseId) {
    const course = await Course.findById(courseId).select("rating reviewCount");
    if (!course) {
      const err = new Error("Course not found");
      err.statusCode = HTTP_STATUS.NOT_FOUND;
      throw err;
    }

    const distribution = await Review.aggregate([
      { $match: { course: course._id } },
      {
        $group: {
          _id: "$rating",
          count: { $sum: 1 },
        },
      },
    ]);

    const starMap = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    distribution.forEach(({ _id, count }) => {
      starMap[_id] = count;
    });

    return {
      averageRating: course.rating,
      totalReviews: course.reviewCount,
      distribution: starMap,
    };
  },

  async getTutorCourseReviews(
    courseId,
    tutorId,
    { page = 1, limit = 10 } = {},
  ) {
    const course = await Course.findOne({
      _id: courseId,
      tutor: tutorId,
    }).select("_id");
    if (!course) {
      const err = new Error(
        "Course not found or you are not authorised to view these reviews",
      );
      err.statusCode = HTTP_STATUS.FORBIDDEN;
      throw err;
    }

    return this.getCourseReviews(courseId, { page, limit });
  },
};

module.exports = reviewService;
