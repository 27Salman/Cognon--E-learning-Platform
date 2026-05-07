import axios from 'axios';
import toast from 'react-hot-toast';
import { API_URL } from '../utils/constants';
import { getToken, clearAuthData } from '../utils/helpers';

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

let isLoggingOut = false;

api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
    if (response.config?.responseType === 'blob') {
      toast.success('Downloaded successfully!', { id: 'download-success' });
      return response;
    }
    return response.data;
  },
  (error) => {
    const isLogoutRequest = error.config?.url?.includes('/auth/logout');

    if (error.response?.config?.responseType === 'blob' && error.response?.data instanceof Blob) {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const json = JSON.parse(reader.result);
          console.error('Blob request error:', json?.message || 'Unknown error');
        } catch {
          console.error('Blob request failed with non-JSON error');
        }
      };
      reader.readAsText(error.response.data);
    }

    if (error.response?.status === 401 && !isLoggingOut && !isLogoutRequest) {
      isLoggingOut = true;
      clearAuthData();

      import('../store/store').then(({ default: store }) => {
        import('../store/slices/authSlice').then(({ clearAuth }) => {
          store.dispatch(clearAuth());
          isLoggingOut = false;
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
