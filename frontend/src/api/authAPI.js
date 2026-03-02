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
