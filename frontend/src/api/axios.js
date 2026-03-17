import axios from 'axios';
import { API_URL } from '../utils/constants';
import { getToken, clearAuthData } from '../utils/helpers';

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      clearAuthData();

      import('../store/store').then(({ default: store }) => {
        import('../store/slices/authSlice').then(({ logoutUser }) => {
          store.dispatch(logoutUser());
        });
      });

      const path = window.location.pathname;
      window.location.href = path.startsWith('/admin') ? '/admin/login' : '/login';
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
