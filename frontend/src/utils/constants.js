export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
  SIGNUP: '/auth/signup',
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  GET_CURRENT_USER: '/auth/me',
  
  GET_COURSES: '/courses',
  GET_COURSE: '/courses/:id',
  CREATE_COURSE: '/courses',
  UPDATE_COURSE: '/courses/:id',
  DELETE_COURSE: '/courses/:id',
  
  GET_CATEGORIES: '/categories',
  CREATE_CATEGORY: '/categories',
  
  ENROLL_COURSE: '/enrollments',
  GET_MY_COURSES: '/enrollments/my-courses',
};

// Route Paths
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  
  
  STUDENT_DASHBOARD: '/student/dashboard',
  STUDENT_COURSES: '/student/courses',
  STUDENT_PROFILE: '/student/profile',
  
  TUTOR_DASHBOARD: '/tutor/dashboard',
  TUTOR_COURSES: '/tutor/courses',
  TUTOR_PROFILE: '/tutor/profile',
  TUTOR_REVENUES: '/tutor/revenues',
  
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

export const APP_NAME = import.meta.env.VITE_APP_NAME || 'Cognon';