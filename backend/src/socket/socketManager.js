const { Server } = require('socket.io');
const { SOCKET_EVENTS } = require('../config/constants');

let io = null;

const onlineUsers = new Map();

const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: [
                process.env.CLIENT_URL,
                'http://localhost:3000'
            ].filter(Boolean),
            credentials: true
        },
        transports: ['websocket', 'polling']
    });

    io.on('connection', (socket) => {
        console.log(`[Socket] Connected: ${socket.id}`);

        socket.on(SOCKET_EVENTS.JOIN, (userId) => {
            if (!userId) return;
            const uid = userId.toString();
            socket.join(`user:${uid}`);

            if (!onlineUsers.has(uid)) onlineUsers.set(uid, new Set());
            onlineUsers.get(uid).add(socket.id);

            socket.userId = uid;

            console.log(`[Socket] User ${uid} joined. Online users: ${onlineUsers.size}`);

            socket.broadcast.emit(SOCKET_EVENTS.USER_ONLINE, { userId: uid });
        });

        socket.on(SOCKET_EVENTS.DISCONNECT, () => {
            console.log(`[Socket] Disconnected: ${socket.id}`);
            const uid = socket.userId;
            if (uid) {
                const sockets = onlineUsers.get(uid);
                if (sockets) {
                    sockets.delete(socket.id);
                    if (sockets.size === 0) {
                        onlineUsers.delete(uid);
                        io.emit(SOCKET_EVENTS.USER_OFFLINE, { userId: uid, lastSeen: new Date() });
                    }
                }
            }
        });

        socket.on(SOCKET_EVENTS.SEND_MESSAGE, async ({ chatId, text, recipientId, tempId }) => {
            try {
                const senderId = socket.userId;
                if (!senderId) return;

                const chatService = require('../services/chatService');

                const message = await chatService.saveMessage(chatId, senderId, text);

                socket.emit(SOCKET_EVENTS.MESSAGE_SAVED, { chatId, message, tempId });

                io.to(`user:${recipientId}`).emit(SOCKET_EVENTS.NEW_MESSAGE, { chatId, message });

                const chat = await require('../models/Chat').findById(chatId)
                    .populate('participants', 'name email profileImage role');
                const recipients = chat.participants.filter(
                    p => p._id.toString() !== senderId.toString()
                );
                console.log('Sending notification to:', recipients.map(r => r._id)); await chatService.notifyNewMessage(chatId, senderId, text, recipients); console.log('Notification sent successfully');

            } catch (err) {
                console.error('[Socket] send-message error:', err.message);
                socket.emit(SOCKET_EVENTS.MESSAGE_ERROR, { error: err.message });
            }
        });

        socket.on(SOCKET_EVENTS.MESSAGE_DELIVERED, async ({ chatId, messageId, senderId }) => {
            try {
                const recipientId = socket.userId;
                if (!recipientId) return;

                const message = await chatService.markDelivered(chatId, messageId, recipientId);
                if (!message) return;

                io.to(`user:${senderId}`).emit(SOCKET_EVENTS.MESSAGE_STATUS_UPDATE, {
                    chatId,
                    messageId,
                    status: message.status 
                });
            } catch (err) {
                console.error('[Socket] message-delivered error:', err.message);
            }
        });

        socket.on(SOCKET_EVENTS.MESSAGES_READ, async ({ chatId, senderId }) => {
            try {
                const readerId = socket.userId;
                if (!readerId) return;

                const chatService = require('../services/chatService');
                const updatedIds = await chatService.markMessagesRead(chatId, readerId);
                if (updatedIds.length === 0) return;

                io.to(`user:${senderId}`).emit(SOCKET_EVENTS.MESSAGES_READ_ACK, {
                    chatId,
                    messageIds: updatedIds
                });
            } catch (err) {
                console.error('[Socket] messages-read error:', err.message);
            }
        });

        socket.on(SOCKET_EVENTS.TYPING_START, ({ chatId, recipientId }) => {
            const senderId = socket.userId;
            if (!senderId || !recipientId) return;
            io.to(`user:${recipientId}`).emit(SOCKET_EVENTS.USER_TYPING, { chatId, userId: senderId });
        });

        socket.on(SOCKET_EVENTS.TYPING_STOP, ({ chatId, recipientId }) => {
            const senderId = socket.userId;
            if (!senderId || !recipientId) return;
            io.to(`user:${recipientId}`).emit(SOCKET_EVENTS.USER_STOPPED_TYPING, { chatId, userId: senderId });
        });

        socket.on(SOCKET_EVENTS.INITIATE_CALL, ({ targetUserId, roomId, callerName, callerAvatar }) => {
            const callerId = socket.userId;
            if (!callerId || !targetUserId) return;

            console.log(`[Socket] Call initiated by ${callerId} to ${targetUserId}, room: ${roomId}`);

            io.to(`user:${targetUserId}`).emit(SOCKET_EVENTS.INCOMING_CALL, {
                roomId,
                callerId,
                callerName,
                callerAvatar
            });
        });


        socket.on(SOCKET_EVENTS.REQUEST_CALL, ({ targetUserId, requesterName, chatId }) => {
            const requesterId = socket.userId;
            if (!requesterId || !targetUserId) return;

            console.log(`[Socket] Call requested by student ${requesterId} to tutor ${targetUserId}`);

            io.to(`user:${targetUserId}`).emit(SOCKET_EVENTS.CALL_REQUESTED, {
                requesterId,
                requesterName,
                chatId
            });
        });

        socket.on(SOCKET_EVENTS.REJECT_CALL, ({ callerId }) => {
            if (!callerId) return;
            io.to(`user:${callerId}`).emit(SOCKET_EVENTS.CALL_REJECTED, {
                rejectedBy: socket.userId
            });
        });

   
        socket.on(SOCKET_EVENTS.END_CALL, ({ targetUserId }) => {
            if (!targetUserId) return;
            io.to(`user:${targetUserId}`).emit(SOCKET_EVENTS.CALL_ENDED, {
                endedBy: socket.userId
            });
        });
    });

    return io;
};


const getIO = () => {
    if (!io) throw new Error('Socket.IO not initialized');
    return io;
};

const isUserOnline = (userId) => {
    return onlineUsers.has(userId.toString());
};

const emitToUser = (userId, event, data) => {
    if (!io) return;
    io.to(`user:${userId.toString()}`).emit(event, data);
};

module.exports = { initSocket, getIO, isUserOnline, emitToUser };
