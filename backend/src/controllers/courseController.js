const asyncHandler = require('../middleware/asyncHandler');
const courseService = require('../services/courseService');
const { HTTP_STATUS } = require('../config/constants');

//Tutor Actions

exports.createCourse = asyncHandler(async (req, res) => {
    const data = await courseService.createCourse(req.user.id, req.body, req.file);
    res.status(HTTP_STATUS.CREATED).json({ success: true, message: 'Course created successfully', data });
});

exports.updateCourse = asyncHandler(async (req, res) => {
    const data = await courseService.updateCourse(req.params.id, req.user.id, req.body, req.file);
    res.status(HTTP_STATUS.OK).json({ success: true, message: 'Course updated successfully', data });
});

exports.deleteCourse = asyncHandler(async (req, res) => {
    const data = await courseService.deleteCourse(req.params.id, req.user.id);
    res.status(HTTP_STATUS.OK).json({ success: true, message: data.message });
});

exports.getTutorCourses = asyncHandler(async (req, res) => {
    const { page, limit } = req.query;
    const data = await courseService.getTutorCourses(req.user.id, Number(page) || 1, Number(limit) || 10);
    res.status(HTTP_STATUS.OK).json({ success: true, data });
});

//Student Actions

exports.getAllPublishedCourses = asyncHandler(async (req, res) => {
    const { category, page, limit } = req.query;
    const data = await courseService.getAllPublishedCourses(
        { category },
        Number(page) || 1,
        Number(limit) || 10
    );
    res.status(HTTP_STATUS.OK).json({ success: true, data });
});

exports.getCourseById = asyncHandler(async (req, res) => {
    const userId = req.user ? req.user.id : null;
    const userRole = req.user ? req.user.role : null;
    const data = await courseService.getCourseById(req.params.id, userId, userRole);
    res.status(HTTP_STATUS.OK).json({ success: true, data });
});

exports.enrollStudent = asyncHandler(async (req, res) => {
    const data = await courseService.enrollStudent(req.params.id, req.user.id);
    res.status(HTTP_STATUS.OK).json({ success: true, message: 'Enrolled successfully', data });
});

exports.getEnrolledCourses = asyncHandler(async (req, res) => {
    const { page, limit } = req.query;
    const data = await courseService.getEnrolledCourses(req.user.id, Number(page) || 1, Number(limit) || 10);
    res.status(HTTP_STATUS.OK).json({ success: true, data });
});
