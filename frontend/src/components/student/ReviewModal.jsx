import React, { useState, useEffect } from "react";
import { X, Loader } from "lucide-react";
import StarRating from "../common/StarRating";
import { studentAPI } from "../../api/studentAPI";
import toast from "react-hot-toast";

const RATING_LABELS = {
  1: "Poor",
  2: "Fair",
  3: "Good",
  4: "Very Good",
  5: "Excellent",
};

export default function ReviewModal({
  isOpen,
  onClose,
  courseId,
  onReviewSubmitted,
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && courseId) {
      setLoading(true);
      studentAPI
        .getMyReview(courseId)
        .then((res) => {
          if (res?.data) {
            setRating(res.data.rating || 0);
            setComment(res.data.comment || "");
          } else {
            setRating(0);
            setComment("");
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [isOpen, courseId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error("Please select a star rating");
      return;
    }

    setSubmitting(true);
    try {
      await studentAPI.submitReview(courseId, rating, comment);
      toast.success("Thank you for your review!");
      if (onReviewSubmitted) onReviewSubmitted();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-gray-100 overflow-hidden transform transition-all duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-800">
            {rating ? "Edit Your Review" : "Rate this Course"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-12">
            <Loader className="w-8 h-8 animate-spin text-purple-600 mb-2" />
            <p className="text-sm text-gray-500">Loading your review...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Rating Selection */}
            <div className="flex flex-col items-center justify-center space-y-2 py-2">
              <StarRating
                rating={rating}
                interactive={true}
                onChange={setRating}
                size={36}
              />
              <span className="text-sm font-semibold text-purple-600 min-h-[20px] transition-all">
                {RATING_LABELS[rating] || "Select stars"}
              </span>
            </div>

            {/* Comment Input */}
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">
                Written Review (Optional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Describe your experience with this course, what you liked, what can be improved..."
                className="w-full h-32 p-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600 transition resize-none"
                maxLength={1000}
              />
              <div className="flex justify-end text-xs text-gray-400">
                {comment.length}/1000 characters
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 border border-gray-200 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-3 px-4 bg-purple-600 text-white rounded-xl font-semibold text-sm hover:bg-purple-700 transition disabled:opacity-60 flex items-center justify-center gap-1.5"
              >
                {submitting && <Loader className="w-4 h-4 animate-spin" />}
                Submit Review
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
