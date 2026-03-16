import api from './axios';

export const tutorAPI = {
    getProfile: () => api.get('/tutor/profile'),
    
    updateProfile: (formData) => {
        const config = { headers: { 'Content-Type': 'multipart/form-data' } };
        return api.put('/tutor/profile', formData, config);
    },
    
    requestEmailChange: (newEmail) => 
        api.post('/tutor/change-email/request', { newEmail }),
    
    verifyEmailChange: (newEmail, otp) => 
        api.post('/tutor/change-email/verify', { newEmail, otp }),
    
    requestPasswordChange: () => 
        api.post('/tutor/change-password/request'),
    
    verifyPasswordChange: (newPassword, otp) => 
        api.post('/tutor/change-password/verify', { newPassword, otp })
};