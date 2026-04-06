const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');
const {
    createLesson,
    updateLesson,
    deleteLesson,
    getLessonsByCourse,
    getLessonById,
    reorderLessons,
} = require('../controllers/lessonController');

router.get('/course/:courseId', protect, getLessonsByCourse);

router.post('/course/:courseId', protect, restrictTo('tutor'), createLesson);
router.put('/reorder/:courseId', protect, restrictTo('tutor'), reorderLessons);
router.put('/:id', protect, restrictTo('tutor'), updateLesson);
router.delete('/:id', protect, restrictTo('tutor'), deleteLesson);

router.get('/:id', protect, getLessonById);

module.exports = { lessonRoutes: router };
