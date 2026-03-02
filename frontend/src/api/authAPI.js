import api from './axios';
import { ENDPOINTS } from '../utils/constants';

/**
 * Authentication API Service
 * All auth-related API calls
 */

/**
 * User Signup
 * @param {Object} userData - { name, email, password, phone, role }
 * @returns {Promise} - { success, message, token, user }
 */
export const signup = async (userData) => {
  try {
    const response = await api.post(ENDPOINTS.SIGNUP, userData);
    return response;
  } catch (error) {
    throw error;
  }
};

/**
 * User Login
 * @param {Object} credentials - { email, password }
 * @returns {Promise} - { success, message, token, user }
 */
export const login = async (credentials) => {
  try {
    const response = await api.post(ENDPOINTS.LOGIN, credentials);
    return response;
  } catch (error) {
    throw error;
  }
};

/**
 * User Logout
 * @returns {Promise} - { success, message }
 */
export const logout = async () => {
  try {
    const response = await api.post(ENDPOINTS.LOGOUT);
    return response;
  } catch (error) {
    throw error;
  }
};

/**
 * Get Current User
 * @returns {Promise} - { success, user }
 */
export const getCurrentUser = async () => {
  try {
    const response = await api.get(ENDPOINTS.GET_CURRENT_USER);
    return response;
  } catch (error) {
    throw error;
  }
};

/**
 * Check if token is valid
 * @returns {Promise<boolean>}
 */
export const validateToken = async () => {
  try {
    await getCurrentUser();
    return true;
  } catch (error) {
    return false;
  }
};
