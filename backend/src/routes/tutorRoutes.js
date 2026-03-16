const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');
const upload = require('../config/multer');
const {
    getProfile,
    updateProfile,
    requestEmailChange,
    verifyEmailChange,
    requestPasswordChange,
    verifyPasswordChange
} = require('../controllers/tutorController');

router.use(protect);
router.use(restrictTo('tutor'));

router.get('/profile', getProfile);
router.put('/profile', upload.single('profileImage'), updateProfile);

router.post('/change-email/request', requestEmailChange);
router.post('/change-email/verify', verifyEmailChange);

router.post('/change-password/request', requestPasswordChange);
router.post('/change-password/verify', verifyPasswordChange);

module.exports = { tutorRoutes: router };