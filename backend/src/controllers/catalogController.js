const asyncHandler = require('../middleware/asyncHandler');
const courseService = require('../services/courseService');
const Category = require('../models/Category');
const { HTTP_STATUS } = require('../config/constants');

exports.getCourses = asyncHandler(async (req, res) => {
    const { category, search, page, limit } = req.query;
    const data = await courseService.getAllPublishedCourses(
        { category, search },
        Number(page) || 1,
        Number(limit) || 10
    );
    res.status(HTTP_STATUS.OK).json({ success: true, data });
});

exports.getFilterOptions = asyncHandler(async (req, res) => {
    const categories = await Category.find({ isActive: true }).select('name').sort('name');
    res.status(HTTP_STATUS.OK).json({
        success: true,
        data: { categories: categories.map(c => c.name) }
    });
});

exports.getCourseDetails = asyncHandler(async (req, res) => {
    const userId = req.user ? req.user.id : null;
    const userRole = req.user ? req.user.role : null;
    const data = await courseService.getCourseById(req.params.id, userId, userRole);
    res.status(HTTP_STATUS.OK).json({ success: true, data });
});
