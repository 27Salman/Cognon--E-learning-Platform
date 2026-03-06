const express = require('express');
const router = express.Router();
const authController = require("../controllers/authController");
const { protect } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validation');
const { signupValidation, loginValidation } = require('../validators/authValidator');



router.post('/signup', signupValidation, validate, authController.signup);
router.post('/login', loginValidation, validate, authController.login);
router.post('/logout', protect, authController.logout);
router.get('/me', protect, authController.getCurrentUser);

router.get('/verify-otp', authController.verifyEmailOTP);
router.post('/resend-otp', authController.resendOTP);

router.post('/forgot-password', authController.forgotPassword);
router.post('/verify-reset-otp', authController.verifyResetOTP);
router.post('/reset-password', authController.resetPassword);

module.exports = router;