const USER_ROLES = {
    ADMIN: 'admin',
    TUTOR: 'tutor',
    STUDENT: 'student'
};

const TUTOR_APPROVAL_STATUS = {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
}

const USER_STATUS = {
    ACTIVE: 'active',
    BLOCKED: 'blocked',
    INACTIVE: 'inactive',
};

const COURSE_STATUS = {
    DRAFT: 'draft',
    PUBLISHED: 'published',
    ARCHIVED: 'archived',
    PENDING_REVIEW: 'pending_review'
};

const ENROLLMENT_STATUS = {
    ENROLLED: 'enrolled',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    DROPPED: 'dropped'
};

const PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 5,
    MAX_LIMIT: 100
};

const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503
};

const MESSAGES = {
    SUCCESS: {
        CREATED: 'Resource created successfully',
        UPDATED: 'Resource updated successfully',
        DELETED: 'Resource deleted successfully',
        FETCHED: 'Resource fetched successfully'
    },


    ERROR: {
        INVALID_CREDENTIALS: 'Invalid email or password',
        UNAUTHORIZED: 'Unauthorized access',
        FORBIDDEN: 'You do not have permission to perform this action',
        NOT_FOUND: 'Resource not found',
        ALREADY_EXISTS: 'Resource already exists',
        VALIDATION_ERROR: 'Validation failed',
        INTERNAL_ERROR: 'Internal server error',
        TOKEN_EXPIRED: 'Token has expired',
        TOKEN_INVALID: 'Invalid token'
    }
};

const REGEX = {
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PHONE: /^[6-9]\d{9}$/,
    PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    URL: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/
};

const PAYMENT_STATUS = {
    PENDING: 'pending',
    COMPLETED: 'completed',
    FAILED: 'failed',
    REFUNDED: 'refunded'
};

const PAYMENT_METHOD = {
    RAZORPAY: 'razorpay',
    CARD: 'card',
    UPI: 'upi',
    NETBANKING: 'netbanking',
    WALLET: 'wallet'
};

const DISCOUNT_TYPE = {
    PERCENTAGE: 'percentage',
    FIXED: 'fixed'
};

const COUPON_APPLICABLE_TO = {
    ALL: 'all',
    CATEGORY: 'category',
    COURSE: 'course'
};

const OFFER_TYPE = {
    COURSE: 'course',
    CATEGORY: 'category',
    PLATFORM: 'platform'
};

const PLATFORM_COMMISSION = {
    RATE: 0.10,
    TUTOR_SHARE: 0.90
};


const TUTOR_HOLD_DAYS = 3;

const NOTIFICATION_TYPES = {
    PAYMENT_SUCCESS: "payment_success",
    REFUND_COMPLETED: "refund_completed",
    WALLET_UPDATED: "wallet_updated",
    NEW_CHAT_MESSAGE: "new_chat_message",
    TUTOR_APPROVED: "tutor_approved",
    TUTOR_REJECTED: "tutor_rejected",
    NEW_ENROLLMENT: "new_enrollment",
    COURSE_CONTENT_UPDATED: "course_content_updated",
    COURSE_UNAVAILABLE: "course_unavailable",
    COURSE_STATUS_CHANGED: "course_status_changed",
    COUPON_ADDED: "coupon_added",
    NEW_TUTOR_REGISTERED: "new_tutor_registered",
    NEW_COURSE_SUBMITTED: "new_course_submitted",
    WITHDRAWAL_REQUEST: "withdrawal_request",
    NEW_ORDER: "new_order",
    QUIZ_AVAILABLE: "quiz_available",
    QUIZ_RESULT: "quiz_result",
    CERTIFICATE_GENERATED: "certificate_generated",
};

const NOTIFICATION_ACTIONS = {
    // Student
    PAYMENT_SUCCESS:    (orderId) => `/student/orders/${orderId}`,
    REFUND_COMPLETED:   (orderId) => `/student/orders/${orderId}`,
    WALLET_STUDENT:     () => '/student/wallet',
    STUDENT_MY_COURSES: () => '/student/my-courses',
    STUDENT_CART:       () => '/student/cart',

    // Tutor
    TUTOR_DASHBOARD:    () => '/tutor/dashboard',
    TUTOR_WALLET:       () => '/tutor/wallet',
    TUTOR_COURSE:       (courseId) => `/tutor/courses/${courseId}`,
    TUTOR_CHAT:         () => '/tutor/chat',

    // Admin
    ADMIN_TUTORS:       () => '/admin/tutors',
    ADMIN_WALLET:       () => '/admin/wallet',
    ADMIN_ORDER:        (orderId) => `/admin/orders/${orderId}`,
    ADMIN_ORDERS:       () => '/admin/orders',
    ADMIN_COURSES:      () => '/admin/courses',
};

const QUIZ_STATUS = {
    STARTED: 'started',
    SUBMITTED: 'submitted',
    TIMEOUT: 'time_out',
    AUTO_SUBMISSION_VIOLATION: 'auto_submitted_violation',
};

module.exports = {
    USER_ROLES,
    TUTOR_APPROVAL_STATUS,
    USER_STATUS,
    COURSE_STATUS,
    ENROLLMENT_STATUS,
    PAGINATION,
    HTTP_STATUS,
    MESSAGES,
    REGEX,
    PAYMENT_STATUS,
    PAYMENT_METHOD,
    DISCOUNT_TYPE,
    COUPON_APPLICABLE_TO,
    OFFER_TYPE,
    PLATFORM_COMMISSION,
    TUTOR_HOLD_DAYS,
    NOTIFICATION_TYPES,
    NOTIFICATION_ACTIONS,
    QUIZ_STATUS,
};
