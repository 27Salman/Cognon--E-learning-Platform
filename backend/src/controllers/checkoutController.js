const asyncHandler = require("../middleware/asyncHandler");
const checkoutService = require("../services/checkoutService");
const Order = require("../models/Order");
const { HTTP_STATUS } = require("../config/constants");

exports.calculatePrice = asyncHandler(async (req, res) => {
  const { couponCode } = req.body;
  const result = await checkoutService.calculatePrice(req.user.id, couponCode);
  res.status(HTTP_STATUS.OK).json({ success: true, data: result });
});

exports.createRazorpayOrder = asyncHandler(async (req, res) => {
  const { couponCode } = req.body;
  const result = await checkoutService.createRazorpayOrder(
    req.user.id,
    couponCode,
  );
  res.status(HTTP_STATUS.OK).json({ success: true, data: result });
});

exports.verifyPayment = asyncHandler(async (req, res) => {
  const order = await checkoutService.verifyPaymentAndCreateOrder(
    req.user.id,
    req.body,
  );
  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: "Payment verified and enrollment successful",
    data: order,
  });
});

exports.retryPayment = asyncHandler(async (req, res) => {
  const result = await checkoutService.retryPayment(
    req.user.id,
    req.params.orderId,
  );
  res.status(HTTP_STATUS.OK).json({ success: true, data: result });
});

exports.markOrderFailed = asyncHandler(async (req, res) => {
  const { razorpayOrderId } = req.body;
  if (razorpayOrderId) {
    await Order.findOneAndUpdate(
      { razorpayOrderId, user: req.user.id, paymentStatus: "pending" },
      { paymentStatus: "failed" },
    );
  }
  res.status(HTTP_STATUS.OK).json({ success: true });
});

exports.handleWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers["x-razorpay-signature"];
  const result = await checkoutService.handleWebhook(req.body, signature);
  res.status(HTTP_STATUS.OK).json(result);
});
