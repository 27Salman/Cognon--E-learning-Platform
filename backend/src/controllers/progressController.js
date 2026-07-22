const asyncHandler = require("../middleware/asyncHandler");
const progressService = require("../services/progressService");
const { HTTP_STATUS } = require("../config/constants");

exports.markLessonComplete = asyncHandler(async (req, res) => {
  const { courseId, lessonId } = req.params;
  const data = await progressService.markLessonComplete(
    req.user.id,
    courseId,
    lessonId,
  );
  res
    .status(HTTP_STATUS.OK)
    .json({ success: true, message: "Lesson marked as complete", data });
});

exports.getCourseProgress = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const data = await progressService.getCourseProgress(req.user.id, courseId);
  res.status(HTTP_STATUS.OK).json({ success: true, data });
});
