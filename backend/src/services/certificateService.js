const path = require('path');
const PDFDocument = require('pdfkit');
const Certificate = require('../models/Certificate');
const { HTTP_STATUS } = require('../config/constants');

const FONT_REGULAR = path.join(__dirname, '../../assets/fonts/Roboto-Regular.ttf');
const FONT_BOLD    = path.join(__dirname, '../../assets/fonts/Roboto-Bold.ttf');

const certificateService = {
    
    async getCertificateById(certificateId, studentId) {
        const certificate = await Certificate.findOne({
            _id: certificateId,
            student: studentId
        }).populate({
            path: 'student',
            select: 'name',
        }).populate({
            path: 'course',
            select: 'title tutor',
            populate: {
                path: 'tutor',
                select: 'name'
            }
        });

        if (!certificate) {
            const error = new Error('Certificate not found or unauthorized');
            error.statusCode = HTTP_STATUS.NOT_FOUND;
            throw error;
        }

        return certificate;
    },

    async getUserCertificates(studentId, page = 1, limit = 10) {
        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 10;
        const skip = (pageNum - 1) * limitNum;

        const certificates = await Certificate.find({ student: studentId })
            .populate({
                path: 'course',
                select: 'title tutor',
                populate: { path: 'tutor', select: 'name' }
            })
            .sort({ issuedAt: -1 }) 
            .skip(skip)
            .limit(limitNum);

        const total = await Certificate.countDocuments({ student: studentId });

        return {
            certificates,
            pagination: {
                currentPage: pageNum,
                totalPages: Math.ceil(total / limitNum),
                totalCertificates: total,
                hasNext: pageNum < Math.ceil(total / limitNum),
                hasPrev: pageNum > 1
            }
        };
    },

    // Public — verification
    async verifyCertificate(certificateNumber) {
        const certificate = await Certificate.findOne({ certificateNumber })
            .populate({ path: 'student', select: 'name' })
            .populate({
                path: 'course',
                select: 'title tutor',
                populate: { path: 'tutor', select: 'name' }
            });

        if (!certificate) {
            const error = new Error('Certificate not found');
            error.statusCode = HTTP_STATUS.NOT_FOUND;
            throw error;
        }

        return {
            valid: true,
            certificateNumber: certificate.certificateNumber,
            studentName:       certificate.student?.name,
            courseName:        certificate.course?.title,
            instructorName:    certificate.course?.tutor?.name,
            score:             certificate.score,
            issuedAt:          certificate.issuedAt,
        };
    },

    async generateCertificatePdf(certificateId, studentId) {
        const certificate = await this.getCertificateById(certificateId, studentId);

        const studentName = certificate.student.name;
        const courseName  = certificate.course.title;
        const tutorName   = certificate.course.tutor?.name || 'Cognon Instructor';
        const certNumber  = certificate.certificateNumber;
        const issuedDate  = new Date(certificate.issuedAt).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
        const score       = certificate.score;

        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({
                size: 'A4',
                layout: 'landscape',
                margins: { top: 40, bottom: 40, left: 60, right: 60 }
            });

            const buffers = [];
            doc.on('data', chunk => buffers.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', reject);

            const W = doc.page.width;   // 841.89
            const H = doc.page.height;  // 595.28

            // ── Background ──────────────────────────────────────────────
            doc.rect(0, 0, W, H).fill('#0f172a');

            // Outer decorative border
            doc.rect(20, 20, W - 40, H - 40)
               .lineWidth(2)
               .stroke('#f59e0b');

            // Inner border
            doc.rect(28, 28, W - 56, H - 56)
               .lineWidth(0.5)
               .stroke('#f59e0b');

            // ── Header band ─────────────────────────────────────────────
            doc.rect(20, 20, W - 40, 70).fill('#1e293b');

            // Platform name
            doc.font(FONT_BOLD)
               .fontSize(28)
               .fillColor('#f59e0b')
               .text('COGNON', 0, 32, { align: 'center' });

            doc.font(FONT_REGULAR)
               .fontSize(10)
               .fillColor('#94a3b8')
               .text('E-LEARNING PLATFORM', 0, 64, { align: 'center' });

            // ── Certificate of Completion heading ───────────────────────
            doc.font(FONT_REGULAR)
               .fontSize(13)
               .fillColor('#94a3b8')
               .text('CERTIFICATE OF COMPLETION', 0, 115, { align: 'center', characterSpacing: 4 });

            // Decorative line under heading
            const lineY = 135;
            doc.moveTo(W / 2 - 120, lineY).lineTo(W / 2 + 120, lineY)
               .lineWidth(1).stroke('#f59e0b');

            // ── "This certifies that" ────────────────────────────────────
            doc.font(FONT_REGULAR)
               .fontSize(12)
               .fillColor('#cbd5e1')
               .text('This certifies that', 0, 155, { align: 'center' });

            // ── Student name ─────────────────────────────────────────────
            doc.font(FONT_BOLD)
               .fontSize(36)
               .fillColor('#ffffff')
               .text(studentName, 0, 175, { align: 'center' });

            // Underline the name
            const nameWidth = doc.widthOfString(studentName, { fontSize: 36 });
            const nameX = (W - nameWidth) / 2;
            const nameUnderlineY = 175 + 36 + 4;
            doc.moveTo(nameX, nameUnderlineY)
               .lineTo(nameX + nameWidth, nameUnderlineY)
               .lineWidth(1)
               .stroke('#f59e0b');

            // ── Body text ────────────────────────────────────────────────
            doc.font(FONT_REGULAR)
               .fontSize(12)
               .fillColor('#cbd5e1')
               .text('has successfully completed the course', 0, nameUnderlineY + 14, { align: 'center' });

            // ── Course name ──────────────────────────────────────────────
            doc.font(FONT_BOLD)
               .fontSize(22)
               .fillColor('#f59e0b')
               .text(courseName, 60, nameUnderlineY + 38, { align: 'center', width: W - 120 });

            // ── Score pill ───────────────────────────────────────────────
            const scoreText = `Score: ${score}`;
            const pillW = 120, pillH = 26, pillX = (W - pillW) / 2, pillY = nameUnderlineY + 80;
            doc.roundedRect(pillX, pillY, pillW, pillH, 13)
               .fill('#1e293b');
            doc.font(FONT_BOLD)
               .fontSize(11)
               .fillColor('#f59e0b')
               .text(scoreText, pillX, pillY + 7, { width: pillW, align: 'center' });

            // ── Footer section ───────────────────────────────────────────
            const footerY = H - 110;
            doc.moveTo(60, footerY).lineTo(W - 60, footerY)
               .lineWidth(0.5).stroke('#334155');

            // Left: tutor signature block
            doc.font(FONT_BOLD)
               .fontSize(11)
               .fillColor('#ffffff')
               .text(tutorName, 60, footerY + 14, { width: 200, align: 'center' });
            doc.font(FONT_REGULAR)
               .fontSize(9)
               .fillColor('#94a3b8')
               .text('Course Instructor', 60, footerY + 30, { width: 200, align: 'center' });
            doc.moveTo(60, footerY + 12).lineTo(260, footerY + 12)
               .lineWidth(0.5).stroke('#475569');

            // Center: Cognon seal text
            doc.font(FONT_BOLD)
               .fontSize(11)
               .fillColor('#f59e0b')
               .text('COGNON', (W / 2) - 40, footerY + 14, { width: 80, align: 'center' });
            doc.font(FONT_REGULAR)
               .fontSize(8)
               .fillColor('#94a3b8')
               .text('Authorized Seal', (W / 2) - 40, footerY + 30, { width: 80, align: 'center' });

            // Right: date block
            doc.font(FONT_BOLD)
               .fontSize(11)
               .fillColor('#ffffff')
               .text(issuedDate, W - 260, footerY + 14, { width: 200, align: 'center' });
            doc.font(FONT_REGULAR)
               .fontSize(9)
               .fillColor('#94a3b8')
               .text('Date of Issue', W - 260, footerY + 30, { width: 200, align: 'center' });
            doc.moveTo(W - 260, footerY + 12).lineTo(W - 60, footerY + 12)
               .lineWidth(0.5).stroke('#475569');

            // ── Certificate number (bottom) ──────────────────────────────
            doc.font(FONT_REGULAR)
               .fontSize(8)
               .fillColor('#475569')
               .text(`Certificate No: ${certNumber}`, 0, H - 36, { align: 'center' });

            doc.end();
        });
    }
}

module.exports = certificateService;
