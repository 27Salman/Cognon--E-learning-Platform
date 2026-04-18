const asyncHandler = require('../middleware/asyncHandler');
const couponService = require('../services/couponService');
const { HTTP_STATUS } = require('../config/constants');
 
exports.createCoupon = asyncHandler(async (req, res) => {
    const coupon = await couponService.createCoupon(req.user.id, req.body);
    res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: 'Coupon created successfully',
        data: coupon
    });
});

exports.getCoupons = asyncHandler(async (req, res) => {
    const { search, isActive, applicableTo, page, limit } = req.query;
    const createdBy = req.user.role === 'tutor' ? req.user.id : undefined;
    const result = await couponService.getCoupons({ search, isActive, applicableTo, page, limit, createdBy });
    res.status(HTTP_STATUS.OK).json({ success: true, data: result });
});

exports.updateCoupon = asyncHandler(async (req, res) => {
    const coupon = await couponService.updateCoupon(req.params.id, req.body);
    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Coupon updated successfully',
        data: coupon
    });
});

exports.deleteCoupon = asyncHandler(async (req, res) => {
    const result = await couponService.deleteCoupon(req.params.id);
    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: result.message
    });
});

exports.toggleCouponStatus = asyncHandler(async (req, res) => {
    const coupon = await couponService.toggleCouponStatus(req.params.id);
    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: `Coupon ${coupon.isActive ? 'activated' : 'deactivated'} successfully`,
        data: coupon
    });
});

// Student 
exports.validateCoupon = asyncHandler(async (req, res) => {
    const { code, cartTotal, courseIds } = req.body;
    const result = await couponService.validateCoupon(code, req.user.id, cartTotal, courseIds);
    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Coupon is valid',
        data: result
    });
});

exports.getAvailableCoupons = asyncHandler(async (req, res) => {
    const coupons = await couponService.getAvailableCoupons(req.user.id);
    res.status(HTTP_STATUS.OK).json({ success: true, data: coupons });
});
