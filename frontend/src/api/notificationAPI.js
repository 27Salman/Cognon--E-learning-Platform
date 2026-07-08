import api from './axios';

export const notificationAPI = {

    getNotifications: (params) =>
        api.get('/notifications', {params}),

    getUnreadCount: () =>
        api.get('/notifications/unread-count'),

    markAsRead: (id) =>
        api.patch(`/notifications/${id}/read`),

    markAllAsRead: () =>
        api.patch('/notifications/read-all'),

    deleteOne: (id) =>
        api.delete(`/notifications/${id}`),

    deleteAll: () =>
        api.delete('/notifications')
    
}



