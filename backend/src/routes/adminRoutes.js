const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');
const upload = require('../config/multer');
const {
    getProfile,
    updateProfile,
    requestPasswordChange,
    verifyPasswordChange,
    getTutors,
    getStudents,
    blockUser,
    unblockUser
} = require('../controllers/adminController');

router.use(protect);
router.use(restrictTo('admin'));

router.get('/profile', getProfile);
router.put('/profile', upload.single('profileImage'), updateProfile);

router.post('/change-password/request', requestPasswordChange);
router.post('/change-password/verify', verifyPasswordChange);

router.get('/tutors', getTutors);
router.get('/students', getStudents);
router.patch('/users/:id/block', blockUser);
router.patch('/users/:id/unblock', unblockUser);

module.exports = { adminRoutes: router };