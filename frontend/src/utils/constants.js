// API Base URL
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// User Roles (must match backend)
export const ROLES = {
  ADMIN: 'admin',
  TUTOR: 'tutor',
  STUDENT: 'student',
};

// User Status
export const USER_STATUS = {
  ACTIVE: 'active',
  BLOCKED: 'blocked',
  PENDING: 'pending',
  INACTIVE: 'inactive',
};

// API Endpoints
export const ENDPOINTS = {
  // Auth
  SIGNUP: '/auth/signup',
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  GET_CURRENT_USER: '/auth/me',
  
  // Future endpoints (to be implemented)
  // Courses
  GET_COURSES: '/courses',
  GET_COURSE: '/courses/:id',
  CREATE_COURSE: '/courses',
  UPDATE_COURSE: '/courses/:id',
  DELETE_COURSE: '/courses/:id',
  
  // Categories
  GET_CATEGORIES: '/categories',
  CREATE_CATEGORY: '/categories',
  
  // Enrollments
  ENROLL_COURSE: '/enrollments',
  GET_MY_COURSES: '/enrollments/my-courses',
};

// Route Paths
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  LOGIN_STUDENT: '/login/student',
  LOGIN_TUTOR: '/login/tutor',
  LOGIN_ADMIN: '/login/admin',
  SIGNUP: '/signup',
  
  // Student Routes
  STUDENT_DASHBOARD: '/student/dashboard',
  STUDENT_COURSES: '/student/courses',
  STUDENT_PROFILE: '/student/profile',
  
  // Tutor Routes
  TUTOR_DASHBOARD: '/tutor/dashboard',
  TUTOR_COURSES: '/tutor/courses',
  TUTOR_PROFILE: '/tutor/profile',
  TUTOR_REVENUES: '/tutor/revenues',
  
  // Admin Routes
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_USERS: '/admin/users',
  ADMIN_COURSES: '/admin/courses',
  ADMIN_CATEGORIES: '/admin/categories',
  ADMIN_TUTORS: '/admin/tutors',
};

// Local Storage Keys
export const STORAGE_KEYS = {
  TOKEN: 'cognon_token',
  USER: 'cognon_user',
};

// App Name
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'Cognon';
