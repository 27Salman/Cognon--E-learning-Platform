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

    fetchEnrolledCourses: (page = 1, limit = 100) =>
        api.get(`/courses/student/enrolled?page=${page}&limit=${limit}`),

    fetchCourseLessons: (courseId) => api.get(`/lessons/course/${courseId}`),

    // Progress
    markLessonComplete: (courseId, lessonId) =>
        api.post(`/courses/${courseId}/lessons/${lessonId}/complete`),

    fetchCourseProgress: (courseId) => 
        api.get(`/courses/${courseId}/progress`),

    // Wishlist
    getWishlist: (params = {}) => 
        api.get('/student/wishlist', { params }),

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

    getAvailableCoupons: (courseIds = []) =>
        api.get('/student/coupons/available', {
            params: courseIds.length > 0 ? { courseIds: courseIds.join(',') } : {}
        }),

    // Checkout
    calculatePrice: (couponCode) =>
        api.post('/student/checkout/calculate', { couponCode }),

    createRazorpayOrder: (couponCode) =>
        api.post('/student/checkout/create-order', { couponCode }),

    verifyPayment: (paymentData) =>
        api.post('/student/checkout/verify-payment', paymentData),

    retryPayment: (orderId) =>
        api.post(`/student/checkout/retry-payment/${orderId}`),

    markOrderFailed: (razorpayOrderId) =>
        api.post('/student/checkout/mark-failed', { razorpayOrderId }),


    // Orders
    getMyOrders: (params = {}) => 
        api.get('/student/orders', { params }),

    getMyOrderById: (id) => 
        api.get(`/student/orders/${id}`),

    downloadInvoice: (id) =>
        api.get(`/student/orders/${id}/invoice`, { responseType: 'blob' }),

    //wallet
    getMyWallet: () => 
        api.get('/student/wallet'),

    //refund
    cancelOrder: (orderId) => 
        api.post(`/student/orders/${orderId}/cancel`),

    // wallet payment
    payWithWallet: (couponCode) =>
        api.post('/student/checkout/wallet', { couponCode }),

    // Certificates
    getCertificates: (page = 1, limit = 10, search = '', sort = '') =>
        api.get(`/certificates`, { params: { page, limit, search, sort } }),

    getCertificateById: (id) =>
        api.get(`/certificates/${id}`),

    downloadCertificate: (id) =>
        api.get(`/certificates/${id}/download`, { responseType: 'blob' }),

    // Public 
    verifyCertificate: (certificateNumber) =>
        api.get(`/verify/${certificateNumber}`),

    // Reviews
    submitReview: (courseId, rating, comment) =>
        api.post(`/student/reviews/${courseId}`, { rating, comment }),

    deleteReview: (courseId) =>
        api.delete(`/student/reviews/${courseId}`),

    getMyReview: (courseId) =>
        api.get(`/student/reviews/${courseId}/mine`),

    // Tutors
    fetchTutors: (params = {}) =>
        api.get('/catalog/tutors', { params }),

    fetchTutorDetails: (tutorId) =>
        api.get(`/catalog/tutors/${tutorId}`),
};




