const asyncHandler = require("../middleware/asyncHandler");
const walletService = require("../services/walletService");
const { HTTP_STATUS } = require("../config/constants");

// Admin & Tutor
exports.getMyWallet = asyncHandler(async (req, res) => {
  const { page, limit, type } = req.query;
  const data = await walletService.getWallet(req.user.id, {
    page,
    limit,
    type,
  });
  res.status(HTTP_STATUS.OK).json({ success: true, data });
});

// Tutor
exports.requestWithdrawal = asyncHandler(async (req, res) => {
  const { amount } = req.body;
  if (!amount || isNaN(amount) || Number(amount) <= 0) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: "Valid withdrawal amount is required",
    });
  }
  const data = await walletService.requestWithdrawal(
    req.user.id,
    Number(amount),
  );
  res
    .status(HTTP_STATUS.CREATED)
    .json({ success: true, message: data.message, data: data.request });
});

// Admin
exports.getWithdrawalRequests = asyncHandler(async (req, res) => {
  const { page, limit, status } = req.query;
  const data = await walletService.getPendingWithdrawals({
    page,
    limit,
    status,
  });
  res.status(HTTP_STATUS.OK).json({ success: true, data });
});

exports.approveWithdrawal = asyncHandler(async (req, res) => {
  const { adminNote } = req.body;
  const data = await walletService.approveWithdrawal(
    req.params.id,
    req.user.id,
    adminNote,
  );
  res
    .status(HTTP_STATUS.OK)
    .json({ success: true, message: data.message, data: data.request });
});

exports.rejectWithdrawal = asyncHandler(async (req, res) => {
  const { adminNote } = req.body;
  if (!adminNote || !adminNote.trim()) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: "Please provide a reason for rejection",
    });
  }
  const data = await walletService.rejectWithdrawal(
    req.params.id,
    req.user.id,
    adminNote,
  );
  res
    .status(HTTP_STATUS.OK)
    .json({ success: true, message: data.message, data: data.request });
});
