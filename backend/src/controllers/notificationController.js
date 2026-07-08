const { HTTP_STATUS } = require("../config/constants");
const asyncHandler = require("../middleware/asyncHandler");
const notificationService = require("../services/notificationService");

exports.getNotifications = asyncHandler( async(req, res) => {
    const { page, limit, unreadOnly } = req.query;
    const result = await notificationService.getNotifications(req.user.id, {
        page,
        limit,
        unreadOnly: unreadOnly === 'true'
    });
    res.status(HTTP_STATUS.OK).json({ success: true, data: result });
});

exports.getUnreadCount = asyncHandler(async (req, res) => {
    const count = await notificationService.getUnreadCount(req.user.id);
    res.status(HTTP_STATUS.OK).json({ success: true, data: { count } });
});

exports.markAsRead = asyncHandler(async (req, res) => {
    const notification = await notificationService.markAsRead(req.user.id, req.params.id);
    res.status(HTTP_STATUS.OK).json({ success: true, data: notification });
});

exports.markAllAsRead = asyncHandler(async (req, res) => {
    const result = await notificationService.markAllAsRead(req.user.id);
    res.status(HTTP_STATUS.OK).json({ success: true, data: result });
});

exports.deleteOne = asyncHandler(async (req, res) => {
    const result = await notificationService.deleteOne(req.user.id, req.params.id);
    res.status(HTTP_STATUS.OK).json({ success: true, data: result });
});

exports.deleteAll = asyncHandler(async (req, res) => {
    const result = await notificationService.deleteAll(req.user.id);
    res.status(HTTP_STATUS.OK).json({ success: true, data: result });
});

