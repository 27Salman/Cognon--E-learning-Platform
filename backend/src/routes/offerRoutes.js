const express = require('express');
const router = express.Router();
const offerController = require('../controllers/offerController');
const { protect } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');
const { USER_ROLES } = require('../config/constants');

router.use(protect);

// Admin 
router.post(
    '/',
    restrictTo(USER_ROLES.ADMIN),
    offerController.createOffer
);

router.get(
    '/',
    restrictTo(USER_ROLES.ADMIN),
    offerController.getOffers
);

router.get(
    '/:id',
    restrictTo(USER_ROLES.ADMIN),
    offerController.getOfferById
);

router.put(
    '/:id',
    restrictTo(USER_ROLES.ADMIN),
    offerController.updateOffer
);

router.delete(
    '/:id',
    restrictTo(USER_ROLES.ADMIN),
    offerController.deleteOffer
);

router.patch(
    '/:id/toggle',
    restrictTo(USER_ROLES.ADMIN),
    offerController.toggleOfferStatus
);

// Student routes
router.get(
    '/active/all',
    restrictTo(USER_ROLES.STUDENT),
    offerController.getActiveOffers
);

router.get(
    '/course/:courseId/best',
    restrictTo(USER_ROLES.STUDENT),
    offerController.getBestOfferForCourse
);

module.exports = { offerRoutes: router };



