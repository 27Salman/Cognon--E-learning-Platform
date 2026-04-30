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

exports.getRevenueDashboard = asyncHandler(async (req, res) => {
    const data = await tutorService.getRevenueDashboard(req.user.id);
    res.status(HTTP_STATUS.OK).json({ success: true, data });
});

exports.getCourseRevenueDetails = asyncHandler(async (req, res) => {
    const { search, page, limit } = req.query;
    const data = await tutorService.getCourseRevenueDetails(
        req.user.id,
        req.params.courseId,
        { search, page, limit }
    );
    res.status(HTTP_STATUS.OK).json({ success: true, data });
});

exports.downloadDashboardPDF = asyncHandler(async (req, res) => {
    const data = await tutorService.getTutorDashboard(req.user.id);
    const tutorRevenueData = await tutorService.getRevenueDashboard(req.user.id);
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=tutor-dashboard-${Date.now()}.pdf`);
    doc.pipe(res);

    const purple = '#7c3aed';
    const dark = '#111827';
    const gray = '#6b7280';

    // Header
    doc.rect(0, 0, 595, 75).fill(purple);
    doc.fontSize(22).font('Helvetica-Bold').fillColor('#ffffff').text('Tutor Dashboard Report', 50, 22);
    doc.fontSize(9).font('Helvetica').fillColor('#e9d5ff')
        .text(`Generated: ${new Date().toLocaleString('en-IN')}`, 50, 52);

    // Summary
    let y = 95;
    const boxes = [
        { label: 'Total Students',  value: String(data.totalStudents) },
        { label: 'Total Courses',   value: String(data.totalCourses) },
        { label: 'Active Courses',  value: String(data.activeCourses) },
        { label: 'Total Revenue',   value: `Rs.${data.totalRevenue.toLocaleString('en-IN')}` },
    ];
    const bw = 115, bh = 50, gap = 10;
    boxes.forEach((b, i) => {
        const bx = 50 + i * (bw + gap);
        doc.rect(bx, y, bw, bh).fill('#f5f3ff');
        doc.fontSize(8).font('Helvetica').fillColor(gray).text(b.label, bx + 8, y + 8, { width: bw - 16 });
        doc.fontSize(12).font('Helvetica-Bold').fillColor(dark).text(b.value, bx + 8, y + 24, { width: bw - 16 });
    });

    // Course table
    y += 70;
    doc.fontSize(12).font('Helvetica-Bold').fillColor(dark).text('Course Overview', 50, y);
    y += 18;

    const cols = [50, 200, 290, 370, 450];
    const heads = ['Course Name', 'Students', 'Revenue', 'Status'];
    doc.rect(50, y, 495, 16).fill('#ede9fe');
    doc.fontSize(8).font('Helvetica-Bold').fillColor(dark);
    heads.forEach((h, i) => doc.text(h, cols[i], y + 4, { width: 140 }));
    y += 18;

    doc.fontSize(8).font('Helvetica').fillColor(dark);
    (tutorRevenueData.courses || []).forEach((course, idx) => {
        if (y > 730) { doc.addPage(); y = 50; }
        if (idx % 2 === 0) doc.rect(50, y - 2, 495, 14).fill('#fafafa');
        doc.fillColor(dark);
        doc.text(course.title, cols[0], y, { width: 145 });
        doc.text(String(course.enrolledCount), cols[1], y, { width: 85 });
        doc.text(`Rs.${course.totalRevenue.toLocaleString('en-IN')}`, cols[2], y, { width: 75 });
        doc.text(course.status, cols[3], y, { width: 90 });
        y += 14;
    });

    doc.fontSize(8).font('Helvetica').fillColor(gray)
        .text('Cognon Learning Platform', 50, 800, { align: 'center', width: 495 });
    doc.end();
});

exports.downloadDashboardExcel = asyncHandler(async (req, res) => {
    const data = await tutorService.getTutorDashboard(req.user.id);
    const tutorRevenueData = await tutorService.getRevenueDashboard(req.user.id);
    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Cognon Tutor';
    workbook.created = new Date();

    const purpleFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEDE9FE' } };
    const headerFont = { bold: true, color: { argb: 'FF7C3AED' } };

    // Summary sheet
    const summarySheet = workbook.addWorksheet('Summary');
    summarySheet.columns = [
        { header: 'Metric', key: 'metric', width: 25 },
        { header: 'Value',  key: 'value',  width: 20 },
    ];
    summarySheet.getRow(1).font = headerFont;
    summarySheet.getRow(1).fill = purpleFill;
    summarySheet.addRows([
        { metric: 'Total Students',  value: data.totalStudents },
        { metric: 'Total Courses',   value: data.totalCourses },
        { metric: 'Active Courses',  value: data.activeCourses },
        { metric: 'Total Revenue (Rs.)', value: data.totalRevenue },
    ]);

    // Courses sheet
    const coursesSheet = workbook.addWorksheet('Courses');
    coursesSheet.columns = [
        { header: 'Course Name',       key: 'title',         width: 35 },
        { header: 'Students',          key: 'students',      width: 12 },
        { header: 'Rate (Rs.)',         key: 'price',         width: 14 },
        { header: 'Category',          key: 'category',      width: 18 },
        { header: 'Total Revenue (Rs.)', key: 'totalRevenue', width: 20 },
        { header: 'Your Earnings (Rs.)', key: 'tutorEarning', width: 20 },
        { header: 'Status',            key: 'status',        width: 14 },
        { header: 'Created Date',      key: 'createdAt',     width: 16 },
    ];
    coursesSheet.getRow(1).font = headerFont;
    coursesSheet.getRow(1).fill = purpleFill;
    (tutorRevenueData.courses || []).forEach(c => {
        coursesSheet.addRow({
            title:        c.title,
            students:     c.enrolledCount,
            price:        c.price,
            category:     c.category || '-',
            totalRevenue: c.totalRevenue,
            tutorEarning: c.tutorEarning,
            status:       c.status,
            createdAt:    new Date(c.createdAt).toLocaleDateString('en-IN'),
        });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=tutor-dashboard-${Date.now()}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
});





