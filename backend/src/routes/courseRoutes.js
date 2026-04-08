const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { restrictTo, tutorOnly } = require('../middleware/roleMiddleware');
const { uploadCourse } = require('../config/multer');
const {
    createCourse,
    updateCourse,
    deleteCourse,
    getTutorCourses,
    getAllPublishedCourses,
    getCourseById,
    enrollStudent,
    getEnrolledCourses,
} = require('../controllers/courseController');

router.get('/', getAllPublishedCourses);
router.get('/tutor/my-courses', protect, tutorOnly, getTutorCourses);
router.get('/student/enrolled', protect, restrictTo('student'), getEnrolledCourses);
router.get('/:id', protect, getCourseById);

router.post('/', protect, tutorOnly, uploadCourse.single('thumbnail'), createCourse);
router.put('/:id', protect, tutorOnly, uploadCourse.single('thumbnail'), updateCourse);
router.delete('/:id', protect, tutorOnly, deleteCourse);

router.post('/:id/enroll', protect, restrictTo('student'), enrollStudent);

module.exports = { courseRoutes: router };
