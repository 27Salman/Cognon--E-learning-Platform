const asyncHandler = require('../middleware/asyncHandler');
const adminService = require('../services/adminService');
const { HTTP_STATUS } = require('../config/constants');

exports.getProfile = asyncHandler(async (req, res) => {
    const data = await adminService.getProfile(req.user.id);
    res.status(HTTP_STATUS.OK).json({ success: true, data });
});

exports.updateProfile = asyncHandler(async (req, res) => {
    const data = await adminService.updateProfile(req.user.id, req.body, req.file);
    res.status(HTTP_STATUS.OK).json({ success: true, message: 'Profile updated successfully', data });
});

exports.requestPasswordChange = asyncHandler(async (req, res) => {
    const message = await adminService.requestPasswordChange(req.user.email);
    res.status(HTTP_STATUS.OK).json({ success: true, message });
});

exports.verifyPasswordChange = asyncHandler(async (req, res) => {
    const { newPassword, otp } = req.body;
    await adminService.verifyPasswordChange(req.user.id, req.user.email, newPassword, otp);
    res.status(HTTP_STATUS.OK).json({ success: true, message: 'Password changed successfully. Please login again.' });
});

exports.getTutors = asyncHandler(async (req, res) => {
    const { status, search, page, limit } = req.query;
    const result = await adminService.getTutors({ status, search, page, limit });
    res.status(HTTP_STATUS.OK).json({ success: true, data: result });
});

exports.getStudents = asyncHandler(async (req, res) => {
    const { status, search, page, limit } = req.query;
    const result = await adminService.getStudents({ status, search, page, limit });
    res.status(HTTP_STATUS.OK).json({ success: true, data: result });
});

exports.blockUser = asyncHandler(async (req, res) => {
    const user = await adminService.blockUser(req.params.id);
    res.status(HTTP_STATUS.OK).json({ success: true, message: 'User blocked successfully', data: user });
});

exports.unblockUser = asyncHandler(async (req, res) => {
    const user = await adminService.unblockUser(req.params.id);
    res.status(HTTP_STATUS.OK).json({ success: true, message: 'User unblocked successfully', data: user });
});
