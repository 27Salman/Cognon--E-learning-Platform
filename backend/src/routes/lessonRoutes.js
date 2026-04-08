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

router.get('/:id', protect, getLessonById);

module.exports = { lessonRoutes: router };
