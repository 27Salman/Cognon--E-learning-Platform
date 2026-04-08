const asyncHandler = require('../middleware/asyncHandler');
const chatService = require('../services/chatService');
const { HTTP_STATUS } = require('../config/constants');

exports.createOrGetChat = asyncHandler(async (req, res) => {
    const data = await chatService.createOrGetChat(req.user.id, req.body.participantId);
    res.status(HTTP_STATUS.OK).json({ success: true, data });
});

exports.sendMessage = asyncHandler(async (req, res) => {
    const data = await chatService.sendMessage(req.params.chatId, req.user.id, req.body.text);
    res.status(HTTP_STATUS.CREATED).json({ success: true, message: 'Message sent', data });
});

exports.getUserChats = asyncHandler(async (req, res) => {
    const data = await chatService.getUserChats(req.user.id);
    res.status(HTTP_STATUS.OK).json({ success: true, data });
});

exports.getChatMessages = asyncHandler(async (req, res) => {
    const { page, limit } = req.query;
    const data = await chatService.getChatMessages(
        req.params.chatId,
        req.user.id,
        Number(page) || 1,
        Number(limit) || 50
    );
    res.status(HTTP_STATUS.OK).json({ success: true, data });
});
