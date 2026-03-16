import axios from 'axios';
import { API_URL } from '../utils/constants';
import { getToken, clearAuthData } from '../utils/helpers';

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});


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

api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Clear all auth data from localStorage
      clearAuthData();
      localStorage.removeItem('cognon_token');
      localStorage.removeItem('cognon_user');
      localStorage.removeItem('adminInfo');
      localStorage.removeItem('tutorInfo');

      // Dispatch Redux logout to clear store state
      import('../store/store').then(({ default: store }) => {
        import('../store/slices/authSlice').then(({ logoutUser }) => {
          store.dispatch(logoutUser());
        });
      });

      // Redirect based on current path
      const path = window.location.pathname;
      if (path.startsWith('/admin')) {
        window.location.href = '/admin/login';
      } else {
        window.location.href = '/login';
      }
    }

    if (error.response?.status === 403) {
      console.error('Access forbidden:', error.response?.data?.message);
    }

    if (error.response?.status === 500) {
      console.error('Server error:', error.response?.data?.message);
    }

    return Promise.reject(error);
  }
);

export default api;
