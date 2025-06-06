import axios, { AxiosError } from 'axios';
import Cookies from 'js-cookie';

// Hàm xóa token và user data
const clearAuthData = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('user');
  Cookies.remove('accessToken', { path: '/' });
  Cookies.remove('refreshToken', { path: '/' }); // Cũng nên xóa refresh token nếu có
};

// Lấy API URL từ biến môi trường
const API_URL = process.env.NEXT_PUBLIC_API_URL;

console.log('Using API URL:', API_URL); // Log để debug

// Tạo một instance Axios dùng chung
const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Tự động thêm token vào header Authorization
axiosInstance.interceptors.request.use(
  (config) => {
    // Chỉ thêm token nếu không phải là request đến endpoint refresh token (nếu có)
    // Ví dụ: if (!config.url?.includes('/auth/refresh')) { ... }
    const token = localStorage.getItem('accessToken') || Cookies.get('accessToken');
    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Xử lý lỗi, đặc biệt là 401 Unauthorized
axiosInstance.interceptors.response.use(
  (response) => {
    // Nếu request thành công, trả về response
    return response;
  },
  (error: AxiosError) => {
    // Kiểm tra nếu lỗi là do response và có mã trạng thái 401
    if (error.response && error.response.status === 401) {
      // Chỉ log trong môi trường development
      if (process.env.NODE_ENV === 'development') {
        console.error('[Axios Interceptor] Received 401 Unauthorized. Logging out and redirecting.');
      }

      // Xóa dữ liệu xác thực
      clearAuthData();

      // Chuyển hướng đến trang đăng nhập
      // Đảm bảo chỉ chạy ở client-side
      if (typeof window !== 'undefined') {
        // Có thể thêm thông báo cho người dùng trước khi chuyển hướng
        // toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        window.location.href = 'auth/login'; // Hoặc trang đăng nhập của bạn
      }

      // Trả về một Promise bị reject để ngăn chặn xử lý tiếp theo
      // Quan trọng: Trả về lỗi để các .catch() khác không chạy logic không cần thiết
      return Promise.reject(new Error('Phiên đăng nhập đã hết hạn.'));
    }

    // Đối với các lỗi khác, chỉ cần reject promise
    return Promise.reject(error);
  }
);

export default axiosInstance;
