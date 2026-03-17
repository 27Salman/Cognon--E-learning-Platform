import { STORAGE_KEYS } from './constants';

// ─── Token ────────────────────────────────────────────────────────────────────
export const setToken = (token) => {
  localStorage.setItem(STORAGE_KEYS.TOKEN, token);
};

export const getToken = () => {
  return localStorage.getItem(STORAGE_KEYS.TOKEN);
};

export const removeToken = () => {
  localStorage.removeItem(STORAGE_KEYS.TOKEN);
};

// ─── User ─────────────────────────────────────────────────────────────────────
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

// ─── Clear all auth data ──────────────────────────────────────────────────────
export const clearAuthData = () => {
  removeToken();
  removeUser();
  localStorage.removeItem('adminInfo');
  localStorage.removeItem('tutorInfo');
  localStorage.removeItem('studentInfo');
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
export const isAuthenticated = () => !!getToken();

export const getAuthHeader = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone) => {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone);
};

export const validatePassword = (password) => {
  if (password.length < 8) return false;
  if (/\s/.test(password)) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/\d/.test(password)) return false;
  if (!/[@$!%*?&]/.test(password)) return false;
  return true;
};

export const getPasswordStrength = (password) => {
  if (password.length === 0) return { strength: 0, text: '', color: '#6b7280' };
  let strength = 0;
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[@$!%*?&]/.test(password),
  };
  strength = Object.values(checks).filter(Boolean).length;
  const strengthMap = {
    0: { strength: 0,   text: 'Very Weak',   color: '#ef4444' },
    1: { strength: 20,  text: 'Weak',         color: '#ef4444' },
    2: { strength: 40,  text: 'Fair',         color: '#eab308' },
    3: { strength: 60,  text: 'Good',         color: '#3b82f6' },
    4: { strength: 80,  text: 'Strong',       color: '#22c55e' },
    5: { strength: 100, text: 'Very Strong',  color: '#22c55e' },
  };
  return strengthMap[strength];
};

export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
};

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
};

export const getErrorMessage = (error) => {
  if (error.response?.data?.message) return error.response.data.message;
  if (error.message) return error.message;
  return 'Something went wrong. Please try again.';
};
