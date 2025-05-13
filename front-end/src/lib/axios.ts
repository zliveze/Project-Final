import axios from 'axios';

// You can set up a base URL and other default settings for your Axios instance here.
// For example, if your API is at http://localhost:5000/api
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    // You can add other headers here, like authorization tokens
  },
});

// You can also add interceptors for requests or responses if needed
// For example, to automatically add an auth token to requests:
/*
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken'); // Or however you store your token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
*/

// Example for response interceptor to handle errors globally or refresh tokens:
/*
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    // Example: if (error.response.status === 401 && !originalRequest._retry) { ... }
    return Promise.reject(error);
  }
);
*/

export default axiosInstance;
