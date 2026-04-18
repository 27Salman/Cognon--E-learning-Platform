const asyncHandler = require('../middleware/asyncHandler');
const wishlistService = require('../services/wishlistService');
const { HTTP_STATUS } = require('../config/constants');

exports.addToWishlist = asyncHandler(async (req, res) => {
    const { courseId } = req.body;
    const wishlist = await wishlistService.addToWishlist(req.user.id, courseId);
    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Course added to wishlist',
        data: wishlist
    });
});

exports.removeFromWishlist = asyncHandler(async (req, res) => {
    const result = await wishlistService.removeFromWishlist(req.user.id, req.params.courseId);
    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: result.message
    });
});

exports.getWishlist = asyncHandler(async (req, res) => {
    const wishlist = await wishlistService.getWishlist(req.user.id);
    res.status(HTTP_STATUS.OK).json({ success: true, data: wishlist });
});




