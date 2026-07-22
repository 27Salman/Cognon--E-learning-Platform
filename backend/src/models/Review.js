const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: [true, "Review must belong to a course"],
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Review must belong to a student"],
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [1000, "Review comment cannot exceed 1000 characters"],
    },
  },
  {
    timestamps: true,
  },
);

reviewSchema.index({ course: 1, student: 1 }, { unique: true });

reviewSchema.index({ course: 1, createdAt: -1 });

reviewSchema.methods.toJSON = function () {
  const review = this.toObject();
  delete review.__v;
  return review;
};

module.exports = mongoose.model("Review", reviewSchema);
