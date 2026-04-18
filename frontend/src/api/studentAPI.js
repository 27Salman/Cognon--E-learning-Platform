import api from './axios';

export const studentAPI = {
    // Profile
    getProfile: () => 
        api.get('/student/profile'),
    
    updateProfile: (formData) =>
        api.put('/student/profile', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    
    requestPasswordChange: () => 
        api.post('/student/change-password/request'),

    verifyPasswordChange: (newPassword, otp) =>
        api.post('/student/change-password/verify', { newPassword, otp }),

    // Catalog 
    fetchPublishedCourses: (params = {}) => 
        api.get('/catalog/courses', { params }),

    fetchCourseDetails: (courseId) => 
        api.get(`/catalog/courses/${courseId}`),

    getFilterOptions: () => 
        api.get('/catalog/courses/filters'),

    // Enrollment 
    enrollInCourse: (courseId) => 
        api.post(`/courses/${courseId}/enroll`),

    fetchEnrolledCourses: (page = 1, limit = 5) =>
        api.get(`/courses/student/enrolled?page=${page}&limit=${limit}`),

    fetchCourseLessons: (courseId) => api.get(`/lessons/course/${courseId}`),

    // Progress
    markLessonComplete: (courseId, lessonId) =>
        api.post(`/courses/${courseId}/lessons/${lessonId}/complete`),

    fetchCourseProgress: (courseId) => 
        api.get(`/courses/${courseId}/progress`),

    // Wishlist
    getWishlist: () => 
        api.get('/student/wishlist'),

    addToWishlist: (courseId) => 
        api.post('/student/wishlist', { courseId }),

    removeFromWishlist: (courseId) => 
        api.delete(`/student/wishlist/${courseId}`),

    // Cart
    getCart: () => 
        api.get('/student/cart'),
    addToCart: (courseId) => 
        api.post('/student/cart', { courseId }),

    removeFromCart: (courseId) => 
        api.delete(`/student/cart/${courseId}`),

    clearCart: () => 
        api.delete('/student/cart'),

    // Coupon
    validateCoupon: (code, cartTotal, courseIds) =>
        api.post('/student/coupons/validate', { code, cartTotal, courseIds }),

    getAvailableCoupons: () =>
        api.get('/student/coupons/available'),

    // Checkout
    calculatePrice: (couponCode) =>
        api.post('/student/checkout/calculate', { couponCode }),

    createRazorpayOrder: (couponCode) =>
        api.post('/student/checkout/create-order', { couponCode }),

    verifyPayment: (paymentData) =>
        api.post('/student/checkout/verify-payment', paymentData),

    // Orders
    getMyOrders: (params = {}) => 
        api.get('/student/orders', { params }),

    getMyOrderById: (id) => 
        api.get(`/student/orders/${id}`),
};




