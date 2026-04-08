import api from './axios';

export const studentAPI = {
    getProfile: () => 
        api.get('/student/profile'),

    updateProfile: (formData) =>
        api.put('/student/profile', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),

    requestPasswordChange: () =>
        api.post('/student/change-password/request'),

    verifyPasswordChange: (newPassword, otp) =>
        api.post('/student/change-password/verify', { newPassword, otp }),

    //Courses
    fetchPublishedCourses: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return api.get(`/courses?${query}`);
    },

    fetchCourseDetails: (courseId) => 
        api.get(`/courses/${courseId}`),

    //Emrollment
    enrollInCourse: (courseId) => 
        api.post(`/courses/${courseId}/enroll`),

    fetchEnrolledCourses: (page = 1, limit = 5) =>
        api.get(`/courses/student/enrolled?page=${page}&limit=${limit}`),

    fetchCourseLessons: (courseId) => 
        api.get(`/lessons/course/${courseId}`),

    //Progress
    markLessonComplete: (courseId, lessonId) =>
        api.post(`/courses/${courseId}/lessons/${lessonId}/complete`),

    fetchCourseProgress: (courseId) => 
        api.get(`/courses/${courseId}/progress`),

};
