const express = require('express');
const router = express.Router();
const authController = require("../controllers/authController");
const { protect } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validation');
const { signupValidation, loginValidation } = require('../validators/authValidator')

router.post('/signup', signupValidation, validate, authController.signup);

router.post('/login', loginValidation, validate, authController.login);

router.get('/verify-email/:token', authController.verifyEmail);
router.post('/resend-verification', authController.resendVerification);

router.post('/logout', protect, authController.logout);

router.get('/me', protect, authController.getCurrentUser);

module.exports = router;