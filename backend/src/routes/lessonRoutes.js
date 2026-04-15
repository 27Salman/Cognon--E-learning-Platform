const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { tutorOnly } = require('../middleware/roleMiddleware');
const { uploadLesson, uploadPdf } = require('../config/multer');
const multer = require('multer');
const {
    createLesson,
    updateLesson,
    deleteLesson,
    getLessonsByCourse,
    getLessonById,
    reorderLessons,
} = require('../controllers/lessonController');

const lessonUpload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            const path = require('path');
            const fs = require('fs');
            const isImage = file.mimetype.startsWith('image/');
            const dest = path.join(__dirname, '../uploads', isImage ? 'lessons' : 'pdfs');
            if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
            cb(null, dest);
        },
        filename: (req, file, cb) => {
            const path = require('path');
            const ext = path.extname(file.originalname);
            const prefix = file.mimetype.startsWith('image/') ? 'lesson-thumb' : 'notes';
            cb(null, `${prefix}-${req.user._id}-${Date.now()}${ext}`);
        }
    }),
    limits: { fileSize: 20 * 1024 * 1024 }
});

router.get('/course/:courseId', protect, getLessonsByCourse);

router.post('/course/:courseId', protect, tutorOnly, lessonUpload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'pdfNotes', maxCount: 1 }
]), createLesson);

router.put('/reorder/:courseId', protect, tutorOnly, reorderLessons);

router.put('/:id', protect, tutorOnly, lessonUpload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'pdfNotes', maxCount: 1 }
]), updateLesson);

router.delete('/:id', protect, tutorOnly, deleteLesson);

// Protected PDF download — enrollment required
router.get('/:id/pdf', protect, async (req, res) => {
    const path = require('path');
    const Lesson = require('../models/Lesson');

    const lesson = await Lesson.findById(req.params.id).populate('course');
    if (!lesson || !lesson.pdfNotes) {
        return res.status(404).json({ success: false, message: 'PDF not found' });
    }

    const isOwner = lesson.course.tutor.toString() === req.user.id;
    const isEnrolled = lesson.course.studentsEnrolled.map(s => s.toString()).includes(req.user.id);

    if (!isOwner && !isEnrolled) {
        return res.status(403).json({ success: false, message: 'Enroll in this course to access the PDF' });
    }

    const filePath = path.join(__dirname, '../uploads/pdfs', lesson.pdfNotes);
    res.sendFile(filePath);
});

router.get('/:id', protect, getLessonById);

module.exports = { lessonRoutes: router };
