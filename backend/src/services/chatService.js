const Chat = require('../models/Chat');
const notificationService = require('./notificationService');
const { NOTIFICATION_TYPES } = require('../config/constants');

const chatService = {
    async createOrGetChat(userId1, userId2) {
        let chat = await Chat.findOne({
            participants: { $all: [userId1, userId2] }
        }).populate('participants', 'name email profileImage role');

        if (chat) return chat;

        chat = new Chat({
            participants: [userId1, userId2],
            messages: []
        });

        await chat.save();
        return await Chat.findById(chat._id)
            .populate('participants', 'name email profileImage role');
    },

    async sendMessage(chatId, senderId, text) {
        const chat = await Chat.findOne({
            _id: chatId,
            participants: senderId
        });

        if (!chat) throw new Error('Chat not found or unauthorized');

        const message = {
            sender: senderId,
            text,
            readBy: [senderId]
        };

        chat.messages.push(message);
        chat.lastMessage = text;
        chat.lastMessageAt = new Date();

        await chat.save();

        const savedChat = await Chat.findById(chatId)
            .populate('participants', 'name email profileImage')
            .populate('messages.sender', 'name email profileImage');

        const newMessage = savedChat.messages[savedChat.messages.length - 1];

        // Notify the other participant(s) — not the sender
        const recipients = savedChat.participants.filter(
            p => p._id.toString() !== senderId.toString()
        );
        for (const recipient of recipients) {
            await notificationService.create({
                recipient: recipient._id,
                type: NOTIFICATION_TYPES.NEW_CHAT_MESSAGE,
                title: 'New message',
                message: text.length > 60 ? `${text.slice(0, 60)}...` : text,
                priority: 'medium',
                data: { chatId, senderId }
            });
        }

        return newMessage;
    },

    async getUserChats(userId) {
        const chats = await Chat.find({ participants: userId })
            .populate('participants', 'name email profileImage role')
            .sort({ lastMessageAt: -1 });

        return chats.map(chat => ({
            _id: chat._id,
            participants: chat.participants,
            lastMessage: chat.lastMessage,
            lastMessageAt: chat.lastMessageAt,
            unreadCount: chat.messages.filter(
                m => !m.readBy.includes(userId)
            ).length
        }));
    },

    async getChatMessages(chatId, userId, page = 1, limit = 50) {
        const chat = await Chat.findOne({
            _id: chatId,
            participants: userId
        }).populate('messages.sender', 'name email profileImage');

        if (!chat) throw new Error('Chat not found or unauthorized');

        const total = chat.messages.length;
        const skip = (page - 1) * limit;
        const messages = chat.messages
            .slice()
            .reverse()
            .slice(skip, skip + limit)
            .reverse();

        return {
            messages,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalMessages: total
            }
        };
    }
};

module.exports = chatService;
