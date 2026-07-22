import api from './axios';
import { ENDPOINTS } from '../utils/constants';

export const signup = async (userData) => {
  try {
    const response = await api.post(ENDPOINTS.SIGNUP, userData);
    return response;
  } catch (error) {
    throw error;
  }
};


export const login = async (credentials) => {
  try {
    const response = await api.post(ENDPOINTS.LOGIN, credentials);
    return response;
  } catch (error) {
    throw error;
  }
};


export const logout = async () => {
  try {
    const response = await api.post(ENDPOINTS.LOGOUT);
    return response;
  } catch (error) {
    throw error;
  }
};


export const getCurrentUser = async () => {
  try {
    const response = await api.get(ENDPOINTS.GET_CURRENT_USER);
    return response;
  } catch (error) {
    throw error;
  }
};


export const validateToken = async () => {
  try {
    await getCurrentUser();
    return true;
  } catch (error) {
    return false;
  }
};

export const refreshToken = async () => {
  const response = await api.post('/auth/refresh', {}, { withCredentials: true, _isRefresh: true });
  return response;
};

export const verifyOTP = async (email, otp) => {
  try {
    const response = await api.post('/auth/verify-otp', { email, otp });
    return response;
  } catch (error) {
    throw error;
  }
};

export const resendOTP = async (email) => {
  try {
    const response = await api.post('/auth/resend-otp', { email });
    return response;
  } catch (error) {
    throw error;
  }
};

export const forgotPassword = async (email) => {
  try {
    const response = await api.post('/auth/forgot-password', { email });
    return response;
  } catch (error) {
    throw error;
  }
};

export const verifyResetOTP = async (email, otp) => {
  try {
    const response = await api.post('/auth/verify-reset-otp', { email, otp });
    return response;
  } catch (error) {
    throw error;
  }
};

export const resetPassword = async (email, resetToken, newPassword) => {
  try {
    const response = await api.post('/auth/reset-password', { email, resetToken, newPassword });
    return response;
  } catch (error) {
    throw error;
  }
};
