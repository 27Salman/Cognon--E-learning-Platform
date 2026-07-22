const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  createOrGetChat,
  getUserChats,
  getChatMessages,
  getEligibleContacts,
  getVideoToken,
} = require("../controllers/chatController");

router.use(protect);

router.get("/contacts", getEligibleContacts);

router.get("/", getUserChats);
router.post("/", createOrGetChat);

router.get("/:chatId/messages", getChatMessages);

router.post("/:chatId/video-token", getVideoToken);

module.exports = { chatRoutes: router };
