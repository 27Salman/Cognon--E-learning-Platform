import api from './axios';

export const quizAPI = {

    //Tutor
    createQuiz: (data) => api.post('/quizzes', data),

    updateQuiz: (quizId, data) => api.put(`/quizzes/${quizId}`, data),

    getQuizForTutor: (courseId) => api.get(`/quizzes/course/${courseId}`),

    //Student
    getStudentQuizStatus: (courseId) => api.get(`/quizzes/course/${courseId}/student`),

    startAttempt: (quizId) => api.post(`/quizzes/${quizId}/attempts`),

    autosaveAttempt: (attemptId, answers) => api.put(`/quizzes/attempts/${attemptId}`, { answers }),

    submitAttempt: (attemptId, reason = 'submitted') => api.post(`/quizzes/attempts/${attemptId}/submit`, { reason })
};
