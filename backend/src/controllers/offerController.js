const asyncHandler = require('../middleware/asyncHandler');
const offerService = require('../services/offerService');
const { HTTP_STATUS } = require('../config/constants');

// Admin 
exports.createOffer = asyncHandler(async (req, res) => {
    const offer = await offerService.createOffer(req.user.id, req.body);
    res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: 'Offer created successfully',
        data: offer
    });
});

exports.getOffers = asyncHandler(async (req, res) => {
    const { offerType, isActive, page, limit } = req.query;
    const result = await offerService.getOffers({ offerType, isActive, page, limit });
    res.status(HTTP_STATUS.OK).json({ success: true, data: result });
});

exports.getOfferById = asyncHandler(async (req, res) => {
    const offer = await offerService.getOfferById(req.params.id);
    res.status(HTTP_STATUS.OK).json({ success: true, data: offer });
});

exports.updateOffer = asyncHandler(async (req, res) => {
    const offer = await offerService.updateOffer(req.params.id, req.body);
    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Offer updated successfully',
        data: offer
    });
});

exports.deleteOffer = asyncHandler(async (req, res) => {
    const result = await offerService.deleteOffer(req.params.id);
    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: result.message
    });
});

exports.toggleOfferStatus = asyncHandler(async (req, res) => {
    const offer = await offerService.toggleOfferStatus(req.params.id);
    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: `Offer ${offer.isActive ? 'activated' : 'deactivated'} successfully`,
        data: offer
    });
});

// Student 
exports.getActiveOffers = asyncHandler(async (req, res) => {
    const offers = await offerService.getActiveOffers();
    res.status(HTTP_STATUS.OK).json({ success: true, data: offers });
});

exports.getBestOfferForCourse = asyncHandler(async (req, res) => {
    const offer = await offerService.getBestOfferForCourse(req.params.courseId);
    res.status(HTTP_STATUS.OK).json({ success: true, data: offer });
});


