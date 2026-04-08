const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    createOrGetChat,
    sendMessage,
    getUserChats,
    getChatMessages,
} = require('../controllers/chatController');

router.use(protect);

router.get('/', getUserChats);
router.post('/', createOrGetChat);
router.get('/:chatId/messages', getChatMessages);
router.post('/:chatId/messages', sendMessage);

module.exports = { chatRoutes: router };
