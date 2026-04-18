const express = require('express');
const router = express.Router();
const couponController = require('../controllers/couponController');
const { protect } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');
const { USER_ROLES } = require('../config/constants');

// Admin routes
router.post(
    '/',
    protect,
    restrictTo(USER_ROLES.ADMIN),
    couponController.createCoupon
);

router.get(
    '/',
    protect,
    restrictTo(USER_ROLES.ADMIN),
    couponController.getCoupons
);

router.get(
    '/:id',
    protect,
    restrictTo(USER_ROLES.ADMIN),
    couponController.getCouponById
);

router.put(
    '/:id',
    protect,
    restrictTo(USER_ROLES.ADMIN),
    couponController.updateCoupon
);

router.delete(
    '/:id',
    protect,
    restrictTo(USER_ROLES.ADMIN),
    couponController.deleteCoupon
);

router.patch(
    '/:id/toggle',
    protect,
    restrictTo(USER_ROLES.ADMIN),
    couponController.toggleCouponStatus
);

// Student route
router.post(
    '/validate',
    protect,
    restrictTo(USER_ROLES.STUDENT),
    couponController.validateCoupon
);

module.exports = { couponRoutes: router };



