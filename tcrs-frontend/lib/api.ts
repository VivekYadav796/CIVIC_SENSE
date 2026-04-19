import axios from 'axios';

const API = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api',
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
    if ((err.response?.status === 401 || err.response?.status === 403 || err.response?.status === 500) && typeof window !== 'undefined') {
      // Sometimes malformed tokens (like "undefined") cause a 500 from the backend JWT parser instead of 401
      // If we see 500 and the user isn't able to fetch core data, we should probably clear out invalid tokens 
      // by forcing a re-login. 
      if (err.response?.status === 500 && !localStorage.getItem('token') || localStorage.getItem('token') === 'undefined') {
        localStorage.clear();
        window.location.href = '/login';
      } else if (err.response?.status === 401 || err.response?.status === 403) {
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