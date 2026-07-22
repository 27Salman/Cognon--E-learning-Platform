const asyncHandler = require("../middleware/asyncHandler");
const orderService = require("../services/orderService");
const invoiceService = require("../services/invoiceService");
const { HTTP_STATUS } = require("../config/constants");

// Student
exports.getMyOrders = asyncHandler(async (req, res) => {
  const { search, status, page, limit } = req.query;
  const result = await orderService.getStudentOrders(req.user.id, {
    search,
    status,
    page,
    limit,
  });
  res.status(HTTP_STATUS.OK).json({ success: true, data: result });
});

exports.getMyOrderById = asyncHandler(async (req, res) => {
  const order = await orderService.getStudentOrderById(
    req.user.id,
    req.params.id,
  );
  res.status(HTTP_STATUS.OK).json({ success: true, data: order });
});

exports.downloadInvoice = asyncHandler(async (req, res) => {
  const order = await invoiceService.getOrderForInvoice(
    req.params.id,
    req.user.id,
  );
  invoiceService.generateInvoicePDF(order, res);
});

// Admin
exports.getAllOrders = asyncHandler(async (req, res) => {
  const {
    search,
    status,
    tutorId,
    studentId,
    dateFrom,
    dateTo,
    sort,
    page,
    limit,
  } = req.query;
  const result = await orderService.getAllOrders({
    search,
    status,
    tutorId,
    studentId,
    dateFrom,
    dateTo,
    sort,
    page,
    limit,
  });
  res.status(HTTP_STATUS.OK).json({ success: true, data: result });
});

exports.getOrderById = asyncHandler(async (req, res) => {
  const order = await orderService.getOrderById(req.params.id);
  res.status(HTTP_STATUS.OK).json({ success: true, data: order });
});
