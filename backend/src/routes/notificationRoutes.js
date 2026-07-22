const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");

const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteOne,
  deleteAll,
} = require("../controllers/notificationController");

router.use(protect);

router.get("/", getNotifications);
router.get("/unread-count", getUnreadCount);
router.patch("/read-all", markAllAsRead);
router.patch("/:id/read", markAsRead);
router.delete("/", deleteAll);
router.delete("/:id", deleteOne);

module.exports = { notificationRoutes: router };
