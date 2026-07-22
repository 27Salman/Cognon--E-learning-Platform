import axios from 'axios';
import { API_URL } from '../utils/constants';
import { getToken, setToken, clearAuthData } from '../utils/helpers';

const api = axios.create({
  baseURL: API_URL,
  timeout: 300000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

let isRefreshing = false;
let refreshSubscribers = [];

const onRefreshed = (newToken) => {
  refreshSubscribers.forEach((cb) => cb(newToken));
  refreshSubscribers = [];
};

const addRefreshSubscriber = (cb) => {
  refreshSubscribers.push(cb);
};

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
      return response;
    }
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;

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

    const isRefreshCall = originalRequest?.url?.includes('/auth/refresh') || originalRequest?._isRefresh;
    const isLogoutCall = originalRequest?.url?.includes('/auth/logout');
    const isAlreadyRetried = originalRequest?._retry;

    if (error.response?.status === 401 && !isRefreshCall && !isLogoutCall && !isAlreadyRetried) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          addRefreshSubscriber((newToken) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const data = await api.post('/auth/refresh', {}, { withCredentials: true, _isRefresh: true });
        const newToken = data.token;

        setToken(newToken);
        api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        onRefreshed(newToken);

        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        refreshSubscribers = [];
        clearAuthData();

        import('../store/store').then(({ default: store }) => {
          import('../store/slices/authSlice').then(({ clearAuth }) => {
            store.dispatch(clearAuth());
          });
        }).catch(() => {});

        const path = window.location.pathname;
        window.location.href = path.startsWith('/admin') ? '/admin/login' : '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
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
