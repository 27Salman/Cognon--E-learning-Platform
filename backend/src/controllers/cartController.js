const asyncHandler = require("../middleware/asyncHandler");
const cartService = require("../services/cartService");
const { HTTP_STATUS } = require("../config/constants");

exports.addToCart = asyncHandler(async (req, res) => {
  const { courseId } = req.body;
  const cart = await cartService.addToCart(req.user.id, courseId);
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: "Course added to cart",
    data: cart,
  });
});

exports.removeFromCart = asyncHandler(async (req, res) => {
  const cart = await cartService.removeFromCart(
    req.user.id,
    req.params.courseId,
  );
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: "Course removed from cart",
    data: cart,
  });
});

exports.getCart = asyncHandler(async (req, res) => {
  const cart = await cartService.getCart(req.user.id);
  res.status(HTTP_STATUS.OK).json({ success: true, data: cart });
});

exports.clearCart = asyncHandler(async (req, res) => {
  const result = await cartService.clearCart(req.user.id);
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: result.message,
  });
});
