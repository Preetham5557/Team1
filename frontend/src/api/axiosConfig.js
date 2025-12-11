import axios from 'axios';

const api = axios.create({
  // This looks for the Vercel URL first, then falls back to localhost
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5001/api",
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;