const express = require('express');
const router = express.Router();
const couponController = require('../controllers/couponController');
const { protect } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');
const { USER_ROLES } = require('../config/constants');

router.post(
    '/validate',
    protect,
    restrictTo(USER_ROLES.STUDENT),
    couponController.validateCoupon
);

router.get(
    '/available',
    protect,
    restrictTo(USER_ROLES.STUDENT),
    couponController.getAvailableCoupons
);

module.exports = { couponRoutes: router };
