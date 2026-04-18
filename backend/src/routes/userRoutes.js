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
const wishlistController = require('../controllers/wishlistController');
const cartController = require('../controllers/cartController');
const checkoutController = require('../controllers/checkoutController');
const orderController = require('../controllers/orderController');
const couponController = require('../controllers/couponController');
const catalogController = require('../controllers/catalogController');
const { optionalAuth } = require('../middleware/authMiddleware');


const publicRouter = express.Router();
publicRouter.get('/courses', catalogController.getCourses);
publicRouter.get('/courses/filters', catalogController.getFilterOptions);
publicRouter.get('/courses/:id', optionalAuth, catalogController.getCourseDetails);

router.use(protect);
router.use(restrictTo('student'));

router.get('/profile', getProfile);
router.put('/profile', uploadProfile.single('profileImage'), updateProfile);

router.post('/change-password/request', requestPasswordChange);
router.post('/change-password/verify', verifyPasswordChange);

router.post('/wishlist', wishlistController.addToWishlist);
router.get('/wishlist', wishlistController.getWishlist);
router.delete('/wishlist/:courseId', wishlistController.removeFromWishlist);

router.post('/cart', cartController.addToCart);
router.get('/cart', cartController.getCart);
router.delete('/cart/:courseId', cartController.removeFromCart);
router.delete('/cart', cartController.clearCart);

router.post('/coupons/validate', couponController.validateCoupon);
router.get('/coupons/available', couponController.getAvailableCoupons);

router.post('/checkout/calculate', checkoutController.calculatePrice);
router.post('/checkout/create-order', checkoutController.createRazorpayOrder);
router.post('/checkout/verify-payment', checkoutController.verifyPayment);

router.get('/orders', orderController.getMyOrders);
router.get('/orders/:id', orderController.getMyOrderById);

module.exports = { userRoutes: router, publicCatalogRoutes: publicRouter };



