import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Bell, X, CheckCheck } from 'lucide-react';
import {
    markAsRead,
    markAllAsRead,
    closeDropdown
} from '../../store/slices/notificationSlice';

const formatTime = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins} minutes ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hour${hrs > 1 ? 's' : ''} ago`;
    const days = Math.floor(hrs / 24);
    if (days === 1) {
        const d = new Date(dateStr);
        return `Yesterday ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    }
    return new Date(dateStr).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
};

export default function NotificationDropdown() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { notifications, loading, unreadCount } = useSelector(state => state.notifications);
    const [activeTab, setActiveTab] = useState('unread'); // 'unread' | 'all'

    const displayed = activeTab === 'unread'
        ? notifications.filter(n => !n.isRead)
        : notifications;

    const handleMarkAsRead = (e, id) => {
        e.stopPropagation();
        dispatch(markAsRead(id));
    };

    const handleNotificationClick = (notification) => {
        if (!notification.isRead) {
            dispatch(markAsRead(notification._id));
        }
        if (notification.actionUrl) {
            navigate(notification.actionUrl);
            dispatch(closeDropdown());
        }
    };

    return (
        <div className="absolute right-0 top-full mt-2 w-[380px] bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">

            {/* ── Header ── */}
            <div className="flex items-start justify-between px-5 pt-4 pb-3">
                <div className="flex items-center gap-3">
                    {/* Bell icon with purple background — matches reference */}
                    <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                        <Bell className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 text-base leading-tight">Notification</h3>
                        <p className="text-xs text-gray-400 mt-0.5">
                            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up'}
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => dispatch(closeDropdown())}
                    className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors mt-0.5"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* ── Tabs + Mark All Read ── */}
            <div className="flex items-center justify-between px-5 pb-3">
                <div className="flex items-center gap-2">
                    {/* Unread tab */}
                    <button
                        onClick={() => setActiveTab('unread')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold transition-all ${
                            activeTab === 'unread'
                                ? 'bg-purple-600 text-white'
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                    >
                        Unread
                        {unreadCount > 0 && (
                            <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                                activeTab === 'unread' ? 'bg-white text-purple-600' : 'bg-gray-300 text-gray-600'
                            }`}>
                                {unreadCount}
                            </span>
                        )}
                    </button>

                    {/* All tab */}
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-all ${
                            activeTab === 'all'
                                ? 'bg-purple-600 text-white'
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                    >
                        All
                    </button>
                </div>

                {/* Mark all read — blue tick button like reference */}
                {unreadCount > 0 && (
                    <button
                        onClick={() => dispatch(markAllAsRead())}
                        title="Mark all as read"
                        className="w-9 h-9 rounded-xl bg-purple-600 hover:bg-purple-700 flex items-center justify-center transition-colors"
                    >
                        <CheckCheck className="w-4 h-4 text-white" />
                    </button>
                )}
            </div>

            {/* ── Divider ── */}
            <div className="border-t border-gray-100" />

            {/* ── Notification List ── */}
            <div className="max-h-[440px] overflow-y-auto">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : displayed.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
                        <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center mb-3">
                            <Bell className="w-6 h-6 text-purple-300" />
                        </div>
                        <p className="text-sm font-medium text-gray-500">
                            {activeTab === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                        </p>
                    </div>
                ) : (
                    <div className="px-3 py-2 space-y-2">
                        {displayed.map((notif) => (
                            <div
                                key={notif._id}
                                onClick={() => handleNotificationClick(notif)}
                                className={`rounded-xl p-4 border transition-all ${
                                    notif.actionUrl ? 'cursor-pointer' : 'cursor-default'
                                } ${
                                    !notif.isRead
                                        ? 'bg-white border-gray-200 shadow-sm hover:shadow-md'
                                        : 'bg-gray-50 border-gray-100 hover:bg-gray-100'
                                }`}
                            >
                                {/* Top row — title + unread dot + time */}
                                <div className="flex items-start justify-between gap-2">
                                    <p className={`text-sm leading-snug flex-1 ${
                                        !notif.isRead ? 'font-bold text-gray-900' : 'font-medium text-gray-600'
                                    }`}>
                                        {notif.title}
                                    </p>
                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                        {/* Unread blue dot — right side like reference */}
                                        {!notif.isRead && (
                                            <span className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0" />
                                        )}
                                        <span className="text-xs text-gray-400 whitespace-nowrap">
                                            {formatTime(notif.createdAt)}
                                        </span>
                                    </div>
                                </div>

                                {/* Message */}
                                <p className="text-xs text-gray-500 mt-1.5 leading-relaxed line-clamp-2">
                                    {notif.message}
                                </p>

                                {/* Mark as read button — only for unread, bottom right like reference */}
                                {!notif.isRead && (
                                    <div className="flex justify-end mt-3">
                                        <button
                                            onClick={(e) => handleMarkAsRead(e, notif._id)}
                                            className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-full transition-colors"
                                        >
                                            Mark as read
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Footer — auto-delete note ── */}
            <div className="border-t border-gray-100 px-5 py-2.5 bg-gray-50">
                <p className="text-xs text-gray-400 text-center">
                    Notifications are automatically removed after 30 days
                </p>
            </div>
        </div>
    );
}
