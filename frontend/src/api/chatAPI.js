import api from "./axios";

export const chatAPI = {
  getEligibleContacts: () => api.get("/chat/contacts"),

  getUserChats: () => api.get("/chat"),

  createOrGetChat: (participantId) => api.post("/chat", { participantId }),

  getChatMessages: (chatId, page = 1) =>
    api.get(`/chat/${chatId}/messages?page=${page}`),

  getVideoToken: (chatId, roomId = null) =>
    api.post(`/chat/${chatId}/video-token`, { roomId }),
};
