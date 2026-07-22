import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useDispatch, useSelector } from 'react-redux';
import { addNotification, fetchUnreadCount } from '../store/slices/notificationSlice';
import toast from 'react-hot-toast';

const rawApiUrl = import.meta.env.VITE_API_URL || '';
const SOCKET_URL = rawApiUrl.startsWith('http')
    ? rawApiUrl.replace('/api', '')
    : window.location.origin;

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
    const dispatch = useDispatch();
    const { user, isAuthenticated } = useSelector(state => state.auth);
    const socketRef = useRef(null);
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        const userId = user?._id || user?.id;
        if (!isAuthenticated || !userId) return;

        const newSocket = io(SOCKET_URL, {
            withCredentials: true,
            transports: ['websocket', 'polling'],
            reconnectionAttempts: 5,
            reconnectionDelay: 2000
        });

        socketRef.current = newSocket;

        newSocket.on('connect', () => {
            console.log('[Socket] Connected:', newSocket.id);
            newSocket.emit('join', userId);
            dispatch(fetchUnreadCount());
            setSocket(newSocket);
        });

        newSocket.on('notification:new', (data) => {
            dispatch(addNotification(data));
            if (data.notification?.priority === 'high') {
                toast(data.notification.title, { icon: '🔔', duration: 4000 });
            }
        });

        newSocket.on('disconnect', (reason) => {
            console.log('[Socket] Disconnected:', reason);
            setSocket(null);
        });

        newSocket.on('connect_error', (err) => {
            console.warn('[Socket] Connection error:', err.message);
        });

        return () => {
            newSocket.disconnect();
            socketRef.current = null;
            setSocket(null);
        };
    }, [isAuthenticated, user?._id, user?.id, dispatch]);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
}

export function useSocketContext() {
    return useContext(SocketContext);
}
