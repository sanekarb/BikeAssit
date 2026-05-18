import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Request interceptor — attach admin JWT token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('bikeassist_admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — redirect to login on 401 (skip for login endpoint itself)
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response &&
      error.response.status === 401 &&
      !error.config.url.includes('/auth/login')
    ) {
      localStorage.removeItem('bikeassist_admin_token');
      localStorage.removeItem('bikeassist_admin_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default API;
