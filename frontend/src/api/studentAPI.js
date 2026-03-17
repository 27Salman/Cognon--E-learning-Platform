import api from './axios';

export const studentAPI = {
    getProfile: () => api.get('/student/profile'),

    updateProfile: (formData) =>
        api.put('/student/profile', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),

    requestPasswordChange: () =>
        api.post('/student/change-password/request'),

    verifyPasswordChange: (newPassword, otp) =>
        api.post('/student/change-password/verify', { newPassword, otp }),
};
