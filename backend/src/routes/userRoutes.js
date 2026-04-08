const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');
const { uploadProfile } = require('../config/multer');
const {
    getProfile,
    updateProfile,
    requestPasswordChange,
    verifyPasswordChange,
} = require('../controllers/userController');

router.use(protect);
router.use(restrictTo('student'));

router.get('/profile', getProfile);
router.put('/profile', uploadProfile.single('profileImage'), updateProfile);

router.post('/change-password/request', requestPasswordChange);
router.post('/change-password/verify', verifyPasswordChange);

module.exports = { userRoutes: router };
