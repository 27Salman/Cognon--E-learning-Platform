import { createContext, useContext, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useDispatch, useSelector } from 'react-redux';
import { addNotification, fetchUnreadCount } from '../store/slices/notificationSlice';
import toast from 'react-hot-toast';

const SOCKET_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
    const dispatch = useDispatch();
    const { user, isAuthenticated } = useSelector(state => state.auth);
    const socketRef = useRef(null);

    useEffect(() => {
        const userId = user?._id || user?.id;
        if (!isAuthenticated || !userId) return;

        socketRef.current = io(SOCKET_URL, {
            withCredentials: true,
            transports: ['websocket'],
            reconnectionAttempts: 5,
            reconnectionDelay: 2000
        });

        socketRef.current.on('connect', () => {
            console.log('[Socket] Connected:', socketRef.current.id);
            socketRef.current.emit('join', userId);
            dispatch(fetchUnreadCount());
        });

        socketRef.current.on('notification:new', (data) => {
            dispatch(addNotification(data));
            if (data.notification?.priority === 'high') {
                toast(data.notification.title, { icon: '🔔', duration: 4000 });
            }
        });

        socketRef.current.on('disconnect', (reason) => {
            console.log('[Socket] Disconnected:', reason);
        });

        socketRef.current.on('connect_error', (err) => {
            console.warn('[Socket] Connection error:', err.message);
        });

        return () => {
            socketRef.current?.disconnect();
            socketRef.current = null;
        };
    }, [isAuthenticated, user?._id, user?.id, dispatch]);

    return (
        <SocketContext.Provider value={socketRef.current}>
            {children}
        </SocketContext.Provider>
    );
}

export function useSocketContext() {
    return useContext(SocketContext);
}
