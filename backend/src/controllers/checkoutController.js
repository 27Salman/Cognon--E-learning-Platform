const asyncHandler = require('../middleware/asyncHandler');
const checkoutService = require('../services/checkoutService');
const { HTTP_STATUS } = require('../config/constants');

exports.calculatePrice = asyncHandler(async (req, res) => {
    const { couponCode } = req.body;
    const result = await checkoutService.calculatePrice(req.user.id, couponCode);
    res.status(HTTP_STATUS.OK).json({ success: true, data: result });
});

exports.createRazorpayOrder = asyncHandler(async (req, res) => {
    const { couponCode } = req.body;
    const result = await checkoutService.createRazorpayOrder(req.user.id, couponCode);
    res.status(HTTP_STATUS.OK).json({ success: true, data: result });
});

exports.verifyPayment = asyncHandler(async (req, res) => {
    const order = await checkoutService.verifyPaymentAndCreateOrder(req.user.id, req.body);
    res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: 'Payment verified and enrollment successful',
        data: order
    });
});

exports.handleWebhook = asyncHandler(async (req, res) => {
    const signature = req.headers['x-razorpay-signature'];
    const result = await checkoutService.handleWebhook(req.body, signature);
    res.status(HTTP_STATUS.OK).json(result);
});



