const Notification = require("../models/Notification");
const { isUserOnline, emitToUser } = require("../socket/socketManager");


const notificationService = {

    async create({ recipient, type, title, message, data = {}, priority = 'medium', actionUrl = null }) {
        const notification = await Notification.create({
            recipient,
            type,
            title,
            message,
            data,
            priority,
            actionUrl
        });

        if (isUserOnline(recipient.toString())) {
            const unreadCount = await notificationService.getUnreadCount(recipient);
            emitToUser(recipient.toString(), 'notification:new', {
                notification,
                unreadCount
            });
        }

        return notification;
    },

    async createBulk(recipientIds, { type, title, message, data = {}, priority = 'medium', actionUrl = null }) {
        if (!recipientIds || recipientIds.length === 0) return;

        const notifications = recipientIds.map(recipient => ({
            recipient,
            type,
            title,
            message,
            data,
            priority,
            actionUrl,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }));

        const saved = await Notification.insertMany(notifications, { ordered: false });

        for (const notify of saved) {
            if (isUserOnline(notify.recipient.toString())) {
                const unreadCount = await notificationService.getUnreadCount(notify.recipient);
                emitToUser(notify.recipient.toString(), 'notification:new', {
                    notification: notify,
                    unreadCount
                });
            }
        }

        return saved;
    },

    async getNotifications(userId, { page = 1, limit = 10, unreadOnly = false } = {} ){
        const query = { recipient: userId };
        if(unreadOnly) query.isRead = false;

        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 10 ));
        const skip = (pageNum - 1) * limitNum;

        const [notifications, total] = await Promise.all([
            Notification.find(query)
                .sort({createdAt: -1})
                .skip(skip)
                .limit(limitNum),
            Notification.countDocuments(query)
        ]);

        return {
            notifications,
            pagination: {
                currentPage: pageNum,
                totalPages: Math.ceil(total / limitNum),
                totalFiltered: total,
                limit: limitNum
            }
        };
    },

    async getUnreadCount(userId) {
        return await Notification.countDocuments({ recipient: userId, isRead: false });
    },

    async markAsRead(userId, notificationId){
        const notification = await Notification.findOneAndUpdate(
            { _id: notificationId, recipient: userId },
            { isRead: true },
            { new: true }
        );
        if (!notification) throw new Error('Notification not found');
        return notification;
    },

    async markAllAsRead(userId) {
        await Notification.updateMany(
            { recipient: userId, isRead: false },
            { isRead: true }
        );
        return { message: 'All notifications marked as read' };
    },

    async deleteOne(userId, notificationId) {
        const result = await Notification.findOneAndDelete({
            _id: notificationId,
            recipient: userId
        });
        if (!result) throw new Error('Notification not found');
        return { message: 'Notification deleted' };
    },

    async deleteAll(userId) {
        await Notification.deleteMany({ recipient: userId });
        return { message: 'All notifications cleared' };
    },
};

module.exports = notificationService;



