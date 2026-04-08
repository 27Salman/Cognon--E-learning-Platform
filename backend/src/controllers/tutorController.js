const asyncHandler = require('../middleware/asyncHandler');
const tutorService = require('../services/tutorService');
const { HTTP_STATUS } = require('../config/constants');

exports.getProfile = asyncHandler(async (req, res) => {
    const data = await tutorService.getProfile(req.user.id);
    res.status(HTTP_STATUS.OK).json({ success: true, data });
});

exports.updateProfile = asyncHandler(async (req, res) => {
    const data = await tutorService.updateProfile(req.user.id, req.body, req.file);
    res.status(HTTP_STATUS.OK).json({ success: true, message: 'Profile updated successfully', data });
});

exports.requestEmailChange = asyncHandler(async (req, res) => {
    const message = await tutorService.requestEmailChange(
        req.user.id,
        req.user.role,
        req.user.email,
        req.body.newEmail
    );
    res.status(HTTP_STATUS.OK).json({ success: true, message });
});

exports.verifyEmailChange = asyncHandler(async (req, res) => {
    const { newEmail, otp } = req.body;
    const tutor = await tutorService.verifyEmailChange(req.user.id, req.user.email, newEmail, otp);
    res.status(HTTP_STATUS.OK).json({ success: true, message: 'Email updated successfully', data: tutor });
});

exports.requestPasswordChange = asyncHandler(async (req, res) => {
    const message = await tutorService.requestPasswordChange(req.user.email);
    res.status(HTTP_STATUS.OK).json({ success: true, message });
});

exports.verifyPasswordChange = asyncHandler(async (req, res) => {
    const { newPassword, otp } = req.body;
    await tutorService.verifyPasswordChange(req.user.id, req.user.email, newPassword, otp);
    res.status(HTTP_STATUS.OK).json({ success: true, message: 'Password changed successfully. Please login again.' });
});

exports.getDashboard = asyncHandler(async (req, res) => {
    const data = await tutorService.getTutorDashboard(req.user.id);
    res.status(HTTP_STATUS.OK).json({ success: true, data });
});
