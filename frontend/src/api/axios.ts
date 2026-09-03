import axios from 'axios';

const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host.includes('vercel.app') || host.includes('duckdns.org')) {
      return 'https://jy-school-production-f159.up.railway.app';
    }
    if (host !== 'localhost' && host !== '127.0.0.1') {
      return `http://${host}:5000`;
    }
  }
  return 'https://jy-school-production-f159.up.railway.app';
};

const API_URL = getApiUrl();

export const api = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30 seconds for mobile network reliability
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': '69420',
  },
});

const unwrapResponseData = (payload: any) => {
  if (payload && typeof payload === 'object' && 'data' in payload && payload.success !== undefined) {
    const data = payload.data;
    if (payload.pagination && Array.isArray(data)) {
      Object.defineProperty(data, 'meta', { value: payload.pagination, enumerable: false });
      Object.defineProperty(data, 'data', { value: data, enumerable: false });
    } else if (payload.pagination) {
      data.meta = payload.pagination;
      data.data = data;
    }
    return data;
  }
  return payload;
};

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Track if refresh is already in progress to avoid multiple calls
let isRefreshing = false;
let failedQueue: Array<{ resolve: (value: any) => void; reject: (reason?: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => {
    const unwrappedData = unwrapResponseData(response.data);
    return { ...response, data: unwrappedData };
  },
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      // If no token at all → go to login (fresh session)
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Queue this request until token is refreshed
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }).catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const res = await axios.post(`${API_URL}/api/auth/refresh`, { refreshToken });
        const { accessToken, refreshToken: newRefreshToken } = res.data.data;

        localStorage.setItem('accessToken', accessToken);
        if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken);

        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        processQueue(null, accessToken);
        return api(originalRequest);
      } catch (refreshError) {
        // ⚠️ Refresh failed — DO NOT auto-logout
        // User stays on page, they will logout manually
        processQueue(refreshError, null);
        // Only clear tokens if server explicitly says token is invalid (not network errors)
        const status = (refreshError as any)?.response?.status;
        if (status === 401 || status === 403) {
          // Token is truly invalid/expired — must re-login
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    const errorPayload = unwrapResponseData(error.response?.data);
    return Promise.reject({ ...error, response: { ...error.response, data: errorPayload } });
  }
);
export default api;
