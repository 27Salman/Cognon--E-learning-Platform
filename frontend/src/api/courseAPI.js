import api from './axios';

export const courseAPI = {
    // Tutor
    createCourse: (formData) =>
        api.post('/courses', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),

    updateCourse: (id, formData) =>
        api.put(`/courses/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),

    deleteCourse: (id) => api.delete(`/courses/${id}`),

    getMyCourses: (page = 1, limit = 10) =>
        api.get(`/courses/tutor/my-courses?page=${page}&limit=${limit}`),

    toggleStatus: (id, status) =>
        api.put(`/courses/${id}`, JSON.stringify({ status }), { headers: { 'Content-Type': 'application/json' } }),

    // Lessons
    createLesson: (courseId, data, config = {}) => api.post(`/lessons/course/${courseId}`, data, { headers: { 'Content-Type': 'multipart/form-data' }, ...config }),
    updateLesson: (lessonId, data, config = {}) => api.put(`/lessons/${lessonId}`, data, { headers: { 'Content-Type': 'multipart/form-data' }, ...config }),
    deleteLesson: (lessonId) => api.delete(`/lessons/${lessonId}`),
    getLessons: (courseId) => api.get(`/lessons/course/${courseId}`),

    // Public
    getAllCourses: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return api.get(`/courses?${query}`);
    },

    getCourseById: (id) => api.get(`/courses/${id}`),

    // Student
    enrollCourse: (id) => api.post(`/courses/${id}/enroll`),
    getEnrolledCourses: () => api.get('/courses/student/enrolled'),

    // Reviews
    getCourseReviews: (courseId, params = {}) =>
        api.get(`/courses/${courseId}/reviews`, { params }),

    getCourseReviewSummary: (courseId) =>
        api.get(`/courses/${courseId}/reviews/summary`),
};
