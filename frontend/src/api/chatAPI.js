import api from './axios';

export const chatAPI = {
    getUserChats: () => api.get('/chat'),
    createOrGetChat: (participantId) => api.post('/chat', { participantId }),
    getChatMessages: (chatId, page = 1) => api.get(`/chat/${chatId}/messages?page=${page}`),
    sendMessage: (chatId, text) => api.post(`/chat/${chatId}/messages`, { text }),
};
