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
} = require('../controllers/tutorController');
const couponController = require('../controllers/couponController');

router.use(protect);
router.use(restrictTo('tutor'));

router.get('/coupons', couponController.getCoupons);
router.post('/coupons', couponController.createCoupon);
router.put('/coupons/:id', couponController.updateCoupon);
router.delete('/coupons/:id', couponController.deleteCoupon);
router.patch('/coupons/:id/toggle', couponController.toggleCouponStatus);

router.get('/profile', getProfile);
router.put('/profile', uploadProfile.single('profileImage'), updateProfile);

router.post('/change-email/request', requestEmailChange);
router.post('/change-email/verify', verifyEmailChange);

router.post('/change-password/request', requestPasswordChange);
router.post('/change-password/verify', verifyPasswordChange);

router.get('/dashboard', getDashboard);
router.get('/revenue', getRevenueDashboard);
router.get('/revenue/:courseId', getCourseRevenueDetails);

module.exports = { tutorRoutes: router };