const asyncHandler = require('../middleware/asyncHandler');
const catalogService = require('../services/catalogService');
const { HTTP_STATUS } = require('../config/constants');

exports.getCourses = asyncHandler(async (req, res) => {
    const { search, category, minPrice, maxPrice, level, language, rating, sort, page, limit } = req.query;
    const result = await catalogService.getCourses({
        search, category, minPrice, maxPrice, level, language, rating, sort, page, limit
    });
    res.status(HTTP_STATUS.OK).json({ success: true, data: result });
});

exports.getCourseDetails = asyncHandler(async (req, res) => {
    const userId = req.user ? req.user.id : null;
    const course = await catalogService.getCourseDetails(req.params.id, userId);
    res.status(HTTP_STATUS.OK).json({ success: true, data: course });
});

exports.getFilterOptions = asyncHandler(async (req, res) => {
    const options = await catalogService.getFilterOptions();
    res.status(HTTP_STATUS.OK).json({ success: true, data: options });
});


