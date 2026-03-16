import api from './axios';

export const adminAPI = {
    getProfile: () => api.get('/admin/profile'),
  
    updateProfile: (formData) => {
        const config = { headers: { 'Content-Type': 'multipart/form-data' } };
        return api.put('/admin/profile', formData, config);
    },
  
    requestEmailChange: (newEmail) => 
        api.post('/admin/change-email/request', { newEmail }),
    
    verifyEmailChange: (newEmail, otp) => 
        api.post('/admin/change-email/verify', { newEmail, otp }),
    
    requestPasswordChange: () => 
        api.post('/admin/change-password/request'),
    
    verifyPasswordChange: (newPassword, otp) => 
        api.post('/admin/change-password/verify', { newPassword, otp })
};