const asyncHandler = require('../middleware/asyncHandler');
const reviewService = require('../services/reviewService');
const { HTTP_STATUS } = require('../config/constants');

exports.submitReview = asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const { rating, comment } = req.body;

    const review = await reviewService.submitReview(courseId, req.user.id, {
        rating: rating ? Number(rating) : undefined,
        comment,
    });

    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Review submitted successfully',
        data: review,
    });
});

exports.deleteReview = asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const result = await reviewService.deleteReview(courseId, req.user.id);

    res.status(HTTP_STATUS.OK).json({ success: true, message: result.message });
});

exports.getMyReview = asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const review = await reviewService.getStudentReview(courseId, req.user.id);

    res.status(HTTP_STATUS.OK).json({ success: true, data: review });
});

exports.getCourseReviews = asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const data = await reviewService.getCourseReviews(courseId, {
        page: Number(page),
        limit: Number(limit),
    });

    res.status(HTTP_STATUS.OK).json({ success: true, data });
});

exports.getCourseReviewSummary = asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const data = await reviewService.getCourseReviewSummary(courseId);

    res.status(HTTP_STATUS.OK).json({ success: true, data });
});

exports.getTutorCourseReviews = asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const data = await reviewService.getTutorCourseReviews(courseId, req.user.id, {
        page: Number(page),
        limit: Number(limit),
    });

    res.status(HTTP_STATUS.OK).json({ success: true, data });
});
