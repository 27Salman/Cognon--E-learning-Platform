import axios from 'axios';
import { API_URL } from '../utils/constants';
import { getToken, clearAuthData } from '../utils/helpers';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request Interceptor
 * Automatically attach JWT token to every request
 */
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 * Handle common errors (401, 403, 500)
 */
api.interceptors.response.use(
  (response) => {
    // Return only the data part of the response
    return response.data;
  },
  (error) => {
    // Handle 401 Unauthorized - Clear auth data and redirect to login
    if (error.response?.status === 401) {
      clearAuthData();
      window.location.href = '/login';
    }

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      console.error('Access forbidden:', error.response.data.message);
    }

    // Handle 500 Server Error
    if (error.response?.status === 500) {
      console.error('Server error:', error.response.data.message);
    }

    return Promise.reject(error);
  }
);

export default api;
