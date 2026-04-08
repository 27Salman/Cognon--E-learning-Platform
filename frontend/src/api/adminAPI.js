import api from './axios';

export const adminAPI = {

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

    // User Management
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
};
