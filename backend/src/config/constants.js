const USER_ROLES = {
    ADMIN: 'admin',
    TUTOR: 'tutor',
    STUDENT: 'student'
};

const USER_STATUS = {
    ACTIVE: 'active',       
    PENDING: 'pending',         
    BLOCKED: 'blocked',         
    INACTIVE: 'inactive',
    APPROVAL : 'pending'       
};

const COURSE_STATUS = {
    DRAFT: 'draft',           
    PUBLISHED: 'published',   
    ARCHIVED: 'archived',      
    PENDING_REVIEW: 'pending_review'
};

const COURSE_DIFFICULTY = {
    BEGINNER: 'beginner',
    INTERMEDIATE: 'intermediate',
    ADVANCED: 'advanced',
    EXPERT: 'expert'
};

const ENROLLMENT_STATUS = {
    ENROLLED: 'enrolled',       
    IN_PROGRESS: 'in_progress', 
    COMPLETED: 'completed',      
    DROPPED: 'dropped'          
};

const PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
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

module.exports = {
    USER_ROLES,
    USER_STATUS,
    COURSE_STATUS,
    COURSE_DIFFICULTY,
    ENROLLMENT_STATUS,
    PAGINATION,
    HTTP_STATUS,
    MESSAGES,
    REGEX
};
