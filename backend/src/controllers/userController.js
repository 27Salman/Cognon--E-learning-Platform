const asyncHandler = require('../middleware/asyncHandler');
const userService = require('../services/userService');
const { HTTP_STATUS } = require('../config/constants');
const walletService = require('../services/walletService');
const orderService = require('../services/orderService');
const checkoutService = require('../services/checkoutService');

exports.getProfile = asyncHandler(async (req, res) => {
    const data = await userService.getProfile(req.user.id);
    res.status(HTTP_STATUS.OK).json({ success: true, data });
});

exports.updateProfile = asyncHandler(async (req, res) => {
    const data = await userService.updateProfile(req.user.id, req.body, req.file);
    res.status(HTTP_STATUS.OK).json({ success: true, message: 'Profile updated successfully', data });
});

exports.requestPasswordChange = asyncHandler(async (req, res) => {
    const message = await userService.requestPasswordChange(req.user.email);
    res.status(HTTP_STATUS.OK).json({ success: true, message });
});

exports.verifyPasswordChange = asyncHandler(async (req, res) => {
    const { newPassword, otp } = req.body;
    await userService.verifyPasswordChange(req.user.id, req.user.email, newPassword, otp);
    res.status(HTTP_STATUS.OK).json({ success: true, message: 'Password changed successfully. Please login again.' });
});

exports.getMyWallet = asyncHandler( async (req, res) => {
    const wallet = await walletService.getStudentWallet(req.user.id);
    res.status(HTTP_STATUS.OK).json({ success: true, data: wallet });
});

exports.cancelOrder = asyncHandler( async (req, res) =>{
    const result = await orderService.cancelCourse(req.user.id, req.params.orderId);
    res.status(HTTP_STATUS.OK).json({ success: true, ...result});
});

exports.payWithWallet = asyncHandler(async (req, res) => {
    const { couponCode } = req.body;
    const order = await checkoutService.payWithWallet(req.user.id, couponCode || null);
    res.status(HTTP_STATUS.OK).json({ success: true, data: order });
});




