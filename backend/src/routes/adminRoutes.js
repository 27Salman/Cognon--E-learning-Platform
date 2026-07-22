const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { restrictTo } = require("../middleware/roleMiddleware");
const { uploadProfile } = require("../config/multer");
const {
  getProfile,
  updateProfile,
  requestPasswordChange,
  verifyPasswordChange,
  getTutors,
  getStudents,
  blockUser,
  unblockUser,
  approveTutor,
  rejectTutor,
  getCourses,
  getCourseById,
  updateCourseStatus,
  deleteCourse,
  getDashboardStats,
  getSalesReport,
  downloadSalesReportPDF,
  downloadSalesReportExcel,
} = require("../controllers/adminController");
const orderController = require("../controllers/orderController");
const couponController = require("../controllers/couponController");

router.use(protect);
router.use(restrictTo("admin"));

router.get("/dashboard", getDashboardStats);

router.get("/profile", getProfile);
router.put("/profile", uploadProfile.single("profileImage"), updateProfile);

router.post("/change-password/request", requestPasswordChange);
router.post("/change-password/verify", verifyPasswordChange);

router.get("/tutors", getTutors);
router.get("/students", getStudents);

router.patch("/tutors/:id/approve", approveTutor);
router.patch("/tutors/:id/reject", rejectTutor);

router.patch("/users/:id/block", blockUser);
router.patch("/users/:id/unblock", unblockUser);

router.get("/courses", getCourses);
router.get("/courses/:id", getCourseById);
router.patch("/courses/:id/status", updateCourseStatus);
router.delete("/courses/:id", deleteCourse);

router.get("/orders", orderController.getAllOrders);
router.get("/orders/:id", orderController.getOrderById);

router.get("/sales-report", getSalesReport);
router.get("/sales-report/download/pdf", downloadSalesReportPDF);
router.get("/sales-report/download/excel", downloadSalesReportExcel);

// Coupon management — admin only
router.get("/coupons", couponController.getCoupons);
router.post("/coupons", couponController.createCoupon);
router.put("/coupons/:id", couponController.updateCoupon);
router.delete("/coupons/:id", couponController.deleteCoupon);
router.patch("/coupons/:id/toggle", couponController.toggleCouponStatus);

// Admin wallet
const walletController = require("../controllers/walletController");
router.get("/wallet", walletController.getMyWallet);
router.get("/wallet/withdrawals", walletController.getWithdrawalRequests);
router.patch(
  "/wallet/withdrawals/:id/approve",
  walletController.approveWithdrawal,
);
router.patch(
  "/wallet/withdrawals/:id/reject",
  walletController.rejectWithdrawal,
);

module.exports = { adminRoutes: router };
