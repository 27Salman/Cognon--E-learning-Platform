const Chat = require('../models/Chat');

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

        return savedChat.messages[savedChat.messages.length - 1];
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
