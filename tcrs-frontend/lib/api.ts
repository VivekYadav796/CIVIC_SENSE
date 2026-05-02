import axios from 'axios';

const API = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ||
    (process.env.NODE_ENV === 'production'
      ? 'https://civic-sense-lwzb.onrender.com/api'
      : 'http://localhost:8080/api'),
  // 30s timeout — Render free tier cold-starts can take ~15-20s
  timeout: 30000,
});

API.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token && token !== 'null' && token !== 'undefined') {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

API.interceptors.response.use(
  res => res,
  err => {
    if (typeof window !== 'undefined') {
      const status = err.response?.status;
      const token = localStorage.getItem('token');
      const isOnLoginPage = window.location.pathname === '/login' ||
                            window.location.pathname === '/register' ||
                            window.location.pathname === '/forgot-password';

      // Only auto-redirect for 401/403 when NOT on auth pages, and token is corrupt
      if ((status === 401 || status === 403) && !isOnLoginPage) {
        localStorage.clear();
        window.location.href = '/login';
      }

      // If token is literally the string 'undefined', clear it — but don't
      // redirect if the user is actively trying to log in
      if (token === 'undefined' && !isOnLoginPage) {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default API;

/*  very imp file
This sets the base address of your backend once. So instead of writing http://localhost:8080/api/complaints every time, you just write /complaints — axios adds the base URL automatically.
*/