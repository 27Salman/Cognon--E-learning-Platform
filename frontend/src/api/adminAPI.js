import api from './axios';

export const adminAPI = {

    // Dashboard
    getDashboardStats: () => api.get('/admin/dashboard'),


    // Profile
    getProfile: () =>
        api.get('/admin/profile'),

    updateProfile: (formData) =>
        api.put('/admin/profile', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        }),

    requestPasswordChange: () =>
        api.post('/admin/change-password/request'),

    verifyPasswordChange: (newPassword, otp) =>
        api.post('/admin/change-password/verify', { newPassword, otp }),


    // User 
    getTutors: (params = {}) =>
        api.get('/admin/tutors', { params }),

    getStudents: (params = {}) =>
        api.get('/admin/students', { params }),

    blockUser: (userId) =>
        api.patch(`/admin/users/${userId}/block`),

    unblockUser: (userId) =>
        api.patch(`/admin/users/${userId}/unblock`),

    approveTutor: (tutorId) =>
        api.patch(`/admin/tutors/${tutorId}/approve`),

    rejectTutor: (tutorId) =>
        api.patch(`/admin/tutors/${tutorId}/reject`),


    // Category Management
    getCategories: (params = {}) =>
        api.get('/categories', { params: { ...params, _t: Date.now() } }),

    getCategoryById: (id) => 
        api.get(`/categories/${id}`),

    createCategory: (formData) => 
        api.post('/categories', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),

    updateCategory: (id, formData) => 
        api.put(`/categories/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),

    deleteCategory: (id) => 
        api.delete(`/categories/${id}`),

    toggleCategoryStatus: (id) => 
        api.patch(`/categories/${id}/toggle-status`),


    // Course 
    getAdminCourses: (params = {}) => 
        api.get('/admin/courses', { params }),

    getAdminCourseById: (id) => 
        api.get(`/admin/courses/${id}`),

    updateCourseStatus: (id, status) => 
        api.patch(`/admin/courses/${id}/status`, { status }),

    deleteAdminCourse: (id) => 
        api.delete(`/admin/courses/${id}`),

    
    // Order 
    getOrders: (params = {}) => 
        api.get('/admin/orders', { params }),

    getOrderById: (id) => 
        api.get(`/admin/orders/${id}`),

    updatePaymentStatus: (id, paymentStatus) =>
        api.patch(`/admin/orders/${id}/payment-status`, { paymentStatus }),
};
