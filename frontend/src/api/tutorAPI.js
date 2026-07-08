import api from './axios';

export const tutorAPI = {
    getDashboard: () => 
        api.get('/tutor/dashboard'),

    getProfile: () => 
        api.get('/tutor/profile'),

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
        api.post('/tutor/change-password/verify', { newPassword, otp }),

    // Revenue
    getRevenueDashboard: () => 
        api.get('/tutor/revenue'),

    getCourseRevenueDetails: (courseId, params = {}) =>
        api.get(`/tutor/revenue/${courseId}`, { params }),

    downloadSalesReportPDF: (params = {}) =>
        api.get('/tutor/revenue/download/pdf', { params, responseType: 'blob' }),

    downloadSalesReportExcel: (params = {}) =>
        api.get('/tutor/revenue/download/excel', { params, responseType: 'blob' }),

    // Categories 
    getCategories: () => api.get('/categories/public', { params: { limit: 100, _t: Date.now() } }),

    // Wallet
    getWallet: (params = {}) =>
        api.get('/tutor/wallet', { params }),

    requestWithdrawal: (amount) =>
        api.post('/tutor/wallet/withdraw', { amount }),

    // Reviews
    getCourseReviews: (courseId, params = {}) =>
        api.get(`/tutor/courses/${courseId}/reviews`, { params }),
};
