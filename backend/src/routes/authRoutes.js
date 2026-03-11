const express = require('express');
const router = express.Router();
const authController = require("../controllers/authController");
const { googleAuth, googleAuthCallback } = require('../controllers/googleAuthController');
const { protect } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validation');
const { signupValidation, loginValidation } = require('../validators/authValidator');



router.post('/signup', signupValidation, validate, authController.signup);
router.post('/login', loginValidation, validate, authController.login);
router.post('/logout', protect, authController.logout);
router.get('/me', protect, authController.getCurrentUser);

router.post('/verify-otp', authController.verifyEmailOTP);
router.post('/resend-otp', authController.resendOTP);

router.post('/forgot-password', authController.forgotPassword);
router.post('/verify-reset-otp', authController.verifyResetOTP);
router.post('/reset-password', authController.resetPassword);

// Upgrade student to tutor
router.post('/upgrade-to-tutor', protect, authController.upgradeToTutor);

// Google OAuth routes
router.get('/google', googleAuth);
router.get('/google/callback', googleAuthCallback);

module.exports = router;