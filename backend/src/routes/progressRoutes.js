const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');
const { markLessonComplete, getCourseProgress } = require('../controllers/progressController');

router.post('/:courseId/lessons/:lessonId/complete', protect, restrictTo('student'), markLessonComplete);
router.get('/:courseId/progress', protect, restrictTo('student'), getCourseProgress);

module.exports = { progressRoutes: router }