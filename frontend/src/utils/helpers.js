import { STORAGE_KEYS } from './constants';

/**
 * Token Management
 */
export const setToken = (token) => {
  localStorage.setItem(STORAGE_KEYS.TOKEN, token);
};

export const getToken = () => {
  return localStorage.getItem(STORAGE_KEYS.TOKEN);
};

export const removeToken = () => {
  localStorage.removeItem(STORAGE_KEYS.TOKEN);
};

/**
 * User Data Management
 */
export const setUser = (user) => {
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
};

export const getUser = () => {
  const user = localStorage.getItem(STORAGE_KEYS.USER);
  return user ? JSON.parse(user) : null;
};

export const removeUser = () => {
  localStorage.removeItem(STORAGE_KEYS.USER);
};

/**
 * Clear all auth data
 */
export const clearAuthData = () => {
  removeToken();
  removeUser();
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = () => {
  return !!getToken();
};

/**
 * Get auth header for API requests
 */
export const getAuthHeader = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Validation Helpers
 */
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone) => {
  // Indian phone format: 10 digits starting with 6-9
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone);
};

export const validatePassword = (password) => {
  // Minimum 6 characters
  return password.length >= 6;
};

/**
 * Format helpers
 */
export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount);
};

/**
 * Error message handler
 */
export const getErrorMessage = (error) => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return 'Something went wrong. Please try again.';
};
