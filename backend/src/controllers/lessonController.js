const asyncHandler = require('../middleware/asyncHandler');
const lessonService = require('../services/lessonService');
const { HTTP_STATUS } = require('../config/constants');

exports.createLesson = asyncHandler(async (req, res) => {
    const data = await lessonService.createLesson(req.params.courseId, req.user.id, req.body, req.files || {});
    res.status(HTTP_STATUS.CREATED).json({ success: true, message: 'Lesson created successfully', data });
});

exports.updateLesson = asyncHandler(async (req, res) => {
    const data = await lessonService.updateLesson(req.params.id, req.user.id, req.body, req.files || {});
    res.status(HTTP_STATUS.OK).json({ success: true, message: 'Lesson updated successfully', data });
});

exports.deleteLesson = asyncHandler(async (req, res) => {
    const data = await lessonService.deleteLesson(req.params.id, req.user.id);
    res.status(HTTP_STATUS.OK).json({ success: true, message: data.message });
});

exports.getLessonsByCourse = asyncHandler(async (req, res) => {
    const userId = req.user ? req.user.id : null;
    const userRole = req.user ? req.user.role : null;
    const result = await lessonService.getLessonsByCourse(req.params.courseId, userId, userRole);
    res.status(HTTP_STATUS.OK).json({ success: true, ...result });
});

exports.getLessonById = asyncHandler(async (req, res) => {
    const userId = req.user ? req.user.id : null;
    const userRole = req.user ? req.user.role : null;
    const data = await lessonService.getLessonById(req.params.id, userId, userRole);
    res.status(HTTP_STATUS.OK).json({ success: true, data });
});

exports.reorderLessons = asyncHandler(async (req, res) => {
    const data = await lessonService.reorderLessons(req.params.courseId, req.user.id, req.body.lessons);
    res.status(HTTP_STATUS.OK).json({ success: true, message: 'Lessons reordered successfully', data });
});
