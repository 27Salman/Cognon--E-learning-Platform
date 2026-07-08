export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const APP_NAME = import.meta.env.VITE_APP_NAME || 'Cognon';

export const STORAGE_KEYS = {
    TOKEN: 'cognon_token',
    USER: 'cognon_user',
};

export const ROLES = {
    ADMIN: 'admin',
    TUTOR: 'tutor',
    STUDENT: 'student',
};

export const USER_STATUS = {
    ACTIVE: 'active',
    BLOCKED: 'blocked',
    PENDING: 'pending',
    INACTIVE: 'inactive',
};

export const TUTOR_APPROVAL_STATUS = {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
};

export const COURSE_STATUS = {
    DRAFT: 'draft',
    PUBLISHED: 'published',
    ARCHIVED: 'archived',
    PENDING_REVIEW: 'pending_review',
};

export const ENROLLMENT_STATUS = {
    ENROLLED: 'enrolled',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    DROPPED: 'dropped',
};

export const PAYMENT_STATUS = {
    PENDING: 'pending',
    COMPLETED: 'completed',
    FAILED: 'failed',
    REFUNDED: 'refunded',
};

export const PAYMENT_METHOD = {
    RAZORPAY: 'razorpay',
    CARD: 'card',
    UPI: 'upi',
    NETBANKING: 'netbanking',
    WALLET: 'wallet',
};

export const DISCOUNT_TYPE = {
    PERCENTAGE: 'percentage',
    FIXED: 'fixed',
};

export const COUPON_APPLICABLE_TO = {
    ALL: 'all',
    CATEGORY: 'category',
    COURSE: 'course',
};

export const OFFER_TYPE = {
    COURSE: 'course',
    CATEGORY: 'category',
    PLATFORM: 'platform',
};

export const ENDPOINTS = {
    // Auth
    SIGNUP: '/auth/signup',
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    GET_CURRENT_USER: '/auth/me',

    VERIFY_OTP: '/auth/verify-otp',
    RESEND_OTP: '/auth/resend-otp',

    FORGOT_PASSWORD: '/auth/forgot-password',
    VERIFY_RESET_OTP: '/auth/verify-reset-otp',
    RESET_PASSWORD: '/auth/reset-password',

    GOOGLE_AUTH_SUCCESS: '/auth/google/success',

    // Admin Auth
    ADMIN_LOGIN: '/admin/login',
    ADMIN_FORGOT_PASSWORD: '/admin/forgot-password',
    ADMIN_RESET_PASSWORD: '/admin/reset-password',

    // Tutor Auth
    TUTOR_LOGIN: '/tutor/login',
    TUTOR_REGISTER: '/tutor/register',

    // Courses
    GET_COURSES: '/courses',
    GET_COURSE_BY_ID: '/courses/:courseId',
    CREATE_COURSE: '/courses',
    UPDATE_COURSE: '/courses/:courseId',
    DELETE_COURSE: '/courses/:courseId',

    // Categories
    GET_CATEGORIES: '/categories',
    CREATE_CATEGORY: '/categories',

    // Enrollment
    ENROLL_COURSE: '/enrollments',
    GET_MY_COURSES: '/enrollments/my-courses',
};

export const NOTIFICATION_TYPES = {
    PAYMENT_SUCCESS:        'payment_success',
    REFUND_COMPLETED:       'refund_completed',
    WALLET_UPDATED:         'wallet_updated',
    NEW_CHAT_MESSAGE:       'new_chat_message',
    TUTOR_APPROVED:         'tutor_approved',
    TUTOR_REJECTED:         'tutor_rejected',
    NEW_ENROLLMENT:         'new_enrollment',
    COURSE_CONTENT_UPDATED: 'course_content_updated',
    COURSE_UNAVAILABLE:     'course_unavailable',
    COURSE_STATUS_CHANGED:  'course_status_changed',
    COUPON_ADDED:           'coupon_added',
    NEW_TUTOR_REGISTERED:   'new_tutor_registered',
    NEW_COURSE_SUBMITTED:   'new_course_submitted',
    WITHDRAWAL_REQUEST:     'withdrawal_request',
    NEW_ORDER:              'new_order',
    QUIZ_AVAILABLE:         'quiz_available',
    QUIZ_RESULT:            'quiz_result',
    CERTIFICATE_GENERATED:  'certificate_generated',
};

export const ROUTES = {
    // Public
    HOME: '/',
    LOGIN: '/login',
    LOGIN_STUDENT: '/login/student',
    LOGIN_TUTOR: '/login/tutor',
    LOGIN_ADMIN: '/login/admin',
    SIGNUP: '/signup',
    TUTOR_SIGNUP: '/tutor/signup',

    FORGOT_PASSWORD: '/forgot-password',
    RESET_PASSWORD: '/reset-password',

    VERIFY_OTP: '/verify-otp',
    GOOGLE_AUTH_SUCCESS: '/auth/google/success',

    ADMIN_FORGOT_PASSWORD: '/admin/forgot-password',
    ADMIN_RESET_PASSWORD: '/admin/reset-password',

    UNAUTHORIZED: '/unauthorized',

    // Student
    STUDENT_DASHBOARD: '/student/dashboard',
    STUDENT_COURSE_CATALOG: '/student/courses',
    STUDENT_COURSE_DETAIL: '/student/courses/:courseId',
    STUDENT_LESSON_VIEWER: '/student/courses/:courseId/learn',

    STUDENT_CART: '/student/cart',
    STUDENT_CHECKOUT: '/student/checkout',
    STUDENT_CHAT: '/student/chat',

    STUDENT_MY_COURSES: '/student/my-courses',
    STUDENT_CATEGORIES: '/student/categories',

    STUDENT_PROFILE: '/student/profile',
    STUDENT_WALLET: '/student/wallet',
    STUDENT_WISHLIST: '/student/wishlist',

    STUDENT_ORDERS: '/student/orders',
    STUDENT_ORDER_DETAIL: '/student/orders/:orderId',
    STUDENT_ORDER_SUCCESS: '/student/order-success',
    STUDENT_CERTIFICATES: '/student/certificates',

    // Tutor
    TUTOR_DASHBOARD: '/tutor/dashboard',
    TUTOR_PROFILE: '/tutor/profile',
    TUTOR_COURSES: '/tutor/courses',
    TUTOR_CREATE_COURSE: '/tutor/courses/new',
    TUTOR_COURSE_DETAIL: '/tutor/courses/:courseId',
    TUTOR_EDIT_COURSE: '/tutor/courses/:courseId/edit',
    TUTOR_REVENUE: '/tutor/revenue',
    TUTOR_WALLET: '/tutor/wallet',
    TUTOR_CHAT: '/tutor/chat',

    // Admin
    ADMIN_DASHBOARD: '/admin/dashboard',
    ADMIN_PROFILE: '/admin/profile',
    ADMIN_USERS: '/admin/users',
    ADMIN_STUDENTS: '/admin/students',
    ADMIN_TUTORS: '/admin/tutors',
    ADMIN_COURSES: '/admin/courses',
    ADMIN_CATEGORIES: '/admin/categories',
    ADMIN_ORDERS: '/admin/orders',
    ADMIN_ORDER_DETAIL: '/admin/orders/:orderId',
    ADMIN_COUPONS: '/admin/coupons',
    ADMIN_WALLET: '/admin/wallet',
};