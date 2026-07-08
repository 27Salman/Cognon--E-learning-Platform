const { Server } = require('socket.io');

let io = null;

const onlineUsers = new Map();

const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin:[
                process.env.CLIENT_URL, 'http://localhost:3000'
            ].filter(Boolean),
            credentials: true
        },
        transports: ['websocket', 'polling']  // ✅ websocket first, polling as fallback
    });

    io.on('connection', (socket) => {
        console.log(`[Socket] Connected: ${socket.id}`);

        socket.on('join', (userId) => {
            if(!userId) return;
            const uid = userId.toString();
            socket.join(`user:${uid}`);

            if(!onlineUsers.has(uid)) onlineUsers.set(uid, new Set());
            onlineUsers.get(uid).add(socket.id);

            console.log(`[Socket] User ${uid} joined. Online: ${onlineUsers.size}`);

        });

        socket.on('disconnect', () => {
            console.log(`[Socket] Disconnected: ${socket.id}`);
            for( const [uid, sockets] of onlineUsers){
                sockets.delete(socket.id);
                if(sockets.size === 0) onlineUsers.delete(uid);
            }
        });
    });

    return io;
};

const getIO = () => {
    if(!io) throw new Error('Socket.IO not initialized');
    return io;
};

const isUserOnline = (userId) => {
    return onlineUsers.has(userId.toString());
};

const emitToUser = (userId, event, data) => {
    if (!io) return;
    io.to(`user:${userId.toString()}`).emit(event, data);
};

module.exports = { initSocket, getIO, isUserOnline, emitToUser};


