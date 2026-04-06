const asyncHandler = require('../middleware/asyncHandler');
const userService = require('../services/userService');
const { HTTP_STATUS } = require('../config/constants');

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
