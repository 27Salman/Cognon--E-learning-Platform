const asyncHandler = require('../middleware/asyncHandler');
const chatService = require('../services/chatService');
const zegoService = require('../services/zegoService');
const { HTTP_STATUS } = require('../config/constants');

exports.createOrGetChat = asyncHandler(async (req, res) => {
    const data = await chatService.createOrGetChat(req.user.id, req.body.participantId);
    res.status(HTTP_STATUS.OK).json({ success: true, data });
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

exports.getEligibleContacts = asyncHandler(async (req, res) => {
    const data = await chatService.getEligibleContacts(req.user.id);
    res.status(HTTP_STATUS.OK).json({ success: true, data });
});

exports.getVideoToken = asyncHandler(async (req, res) => {
    const { chatId } = req.params;
    const userId = req.user.id;
    const roomId = req.query.roomId || req.body.roomId;
    const tokenData = await zegoService.generateCallToken(chatId, userId, roomId);

    res.status(HTTP_STATUS.OK).json({
        success: true,
        data: tokenData
    });
});
