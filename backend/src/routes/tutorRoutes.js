const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');
const { uploadProfile } = require('../config/multer');
const {
    getProfile,
    updateProfile,
    requestEmailChange,
    verifyEmailChange,
    requestPasswordChange,
    verifyPasswordChange,
    getDashboard,
    getRevenueDashboard,
    getCourseRevenueDetails,
    downloadSalesReportPDF,
    downloadSalesReportExcel,
} = require('../controllers/tutorController');
const reviewController = require('../controllers/reviewController');

router.use(protect);
router.use(restrictTo('tutor'));

router.get('/profile', getProfile);
router.put('/profile', uploadProfile.single('profileImage'), updateProfile);

router.post('/change-email/request', requestEmailChange);
router.post('/change-email/verify', verifyEmailChange);

router.post('/change-password/request', requestPasswordChange);
router.post('/change-password/verify', verifyPasswordChange);

router.get('/dashboard', getDashboard);
router.get('/revenue/download/pdf',   downloadSalesReportPDF);
router.get('/revenue/download/excel', downloadSalesReportExcel);
router.get('/revenue', getRevenueDashboard);
router.get('/revenue/:courseId', getCourseRevenueDetails);

// Wallet
const walletController = require('../controllers/walletController');
router.get('/wallet', walletController.getMyWallet);
router.post('/wallet/withdraw', walletController.requestWithdrawal);

// Reviews 
router.get('/courses/:courseId/reviews', reviewController.getTutorCourseReviews);

module.exports = { tutorRoutes: router };