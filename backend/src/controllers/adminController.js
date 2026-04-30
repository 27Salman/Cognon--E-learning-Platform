const asyncHandler = require('../middleware/asyncHandler');
const adminService = require('../services/adminService');
const { HTTP_STATUS } = require('../config/constants');
const salesReportService = require('../services/salesReportService');


exports.getDashboardStats = asyncHandler(async (req, res) => {
    const data = await adminService.getDashboardStats();
    res.status(HTTP_STATUS.OK).json({ success: true, data });
});

// Profile
exports.getProfile = asyncHandler(async (req, res) => {
    const data = await adminService.getProfile(req.user.id);
    res.status(HTTP_STATUS.OK).json({ success: true, data });
});

exports.updateProfile = asyncHandler(async (req, res) => {
    const data = await adminService.updateProfile(req.user.id, req.body, req.file);
    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Profile updated successfully',
        data
    });
});

exports.requestPasswordChange = asyncHandler(async (req, res) => {
    const message = await adminService.requestPasswordChange(req.user.email);
    res.status(HTTP_STATUS.OK).json({ success: true, message });
});

exports.verifyPasswordChange = asyncHandler(async (req, res) => {
    const { newPassword, otp } = req.body;
    await adminService.verifyPasswordChange(req.user.id, req.user.email, newPassword, otp);
    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Password changed successfully. Please login again.'
    });
});

// User 
exports.approveTutor = asyncHandler( async (req, res) => {
    const tutor = await adminService.approveTutor(req.params.id);
    res.status(HTTP_STATUS.OK).json({ success: true, message: 'Tutor approved successful', data: tutor });
});
exports.rejectTutor = asyncHandler( async (req, res) => {
    const tutor = await adminService.rejectTutor(req.params.id);
    res.status(HTTP_STATUS.OK).json({ success: true, message: 'Tutor rejected', data: tutor });
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
    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'User blocked successfully',
        data: user
    });
});

exports.unblockUser = asyncHandler(async (req, res) => {
    const user = await adminService.unblockUser(req.params.id);
    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'User unblocked successfully',
        data: user
    });
});


// Course 
exports.getCourses = asyncHandler(async (req, res) => {
    const { category, status, tutor, search, sort, page, limit } = req.query;
    const result = await adminService.getCourses({ category, status, tutor, search, sort, page, limit });
    res.status(HTTP_STATUS.OK).json({ success: true, data: result });
});

exports.getCourseById = asyncHandler(async (req, res) => {
    const course = await adminService.getCourseById(req.params.id);
    res.status(HTTP_STATUS.OK).json({ success: true, data: course });
});

exports.updateCourseStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;
    const course = await adminService.updateCourseStatus(req.params.id, status);
    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Course status updated successfully',
        data: course
    });
});

exports.deleteCourse = asyncHandler(async (req, res) => {
    const result = await adminService.deleteCourse(req.params.id);
    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: result.message
    });
});

//Sales
exports.getSalesReport = asyncHandler(async (req, res) => {
    const { dateFrom, dateTo, groupBy } = req.query;
    const result = await adminService.getSalesReport({ dateFrom, dateTo, groupBy });
    res.status(HTTP_STATUS.OK).json({ success: true, data: result });
});

exports.downloadSalesReportPDF = asyncHandler(async (req, res) => {
    const { dateFrom, dateTo, groupBy } = req.query;
    const result = await adminService.getSalesReport({ dateFrom, dateTo, groupBy });
    salesReportService.generateSalesPDF({ ...result, dateFrom, dateTo }, res);
});

exports.downloadSalesReportExcel = asyncHandler(async (req, res) => {
    const { dateFrom, dateTo, groupBy } = req.query;
    const result = await adminService.getSalesReport({ dateFrom, dateTo, groupBy });
    await salesReportService.generateSalesExcel({ ...result, dateFrom, dateTo }, res);
});




