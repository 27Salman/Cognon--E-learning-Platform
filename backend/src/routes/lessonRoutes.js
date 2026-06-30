const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { tutorOnly } = require('../middleware/roleMiddleware');
const { uploadLessonFields } = require('../config/multer');
const { lessonValidation } = require('../validators/lessonValidator');
const { validate } = require('../middleware/validation');
const {
    createLesson,
    updateLesson,
    deleteLesson,
    getLessonsByCourse,
    getLessonById,
    reorderLessons,
    getLessonPdf,
} = require('../controllers/lessonController');

const lessonFields = uploadLessonFields.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'pdfNotes', maxCount: 1 },
]);

router.get('/course/:courseId', protect, getLessonsByCourse);

router.post('/course/:courseId', protect, tutorOnly, lessonFields, lessonValidation, validate, createLesson);

router.put('/reorder/:courseId', protect, tutorOnly, reorderLessons);

router.put('/:id', protect, tutorOnly, lessonFields, lessonValidation, validate, updateLesson);

router.delete('/:id', protect, tutorOnly, deleteLesson);

router.get('/:id/pdf', protect, getLessonPdf);

router.get('/:id', protect, getLessonById);

module.exports = { lessonRoutes: router };
