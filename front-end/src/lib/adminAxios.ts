import axios, { AxiosError } from 'axios';
import Cookies from 'js-cookie';

// Hàm xóa admin token và user data
const clearAdminAuthData = () => {
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminRefreshToken');
  localStorage.removeItem('adminUser');
  Cookies.remove('adminToken', { path: '/' });
  Cookies.remove('adminRefreshToken', { path: '/' });
  sessionStorage.setItem('adminLoggedOut', 'true');
};

// Lấy API URL từ biến môi trường
const API_URL = process.env.NEXT_PUBLIC_API_URL;

console.log('Using Admin API URL:', API_URL); // Log để debug

// Tạo một instance Axios dành riêng cho admin
const adminAxios = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Tự động thêm admin token vào header Authorization
adminAxios.interceptors.request.use(
  (config) => {
    // Kiểm tra nếu đã đăng xuất
    if (sessionStorage.getItem('adminLoggedOut') === 'true') {
      console.log('Admin đã đăng xuất, không thực hiện yêu cầu API');
      return Promise.reject(new Error('Admin đã đăng xuất'));
    }

    // Lấy admin token từ localStorage hoặc cookie
    const token = localStorage.getItem('adminToken') || Cookies.get('adminToken');
    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Xử lý lỗi, đặc biệt là 401 Unauthorized cho admin
adminAxios.interceptors.response.use(
  (response) => {
    // Nếu request thành công, trả về response
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as any;
    
    // Kiểm tra nếu lỗi là do response và có mã trạng thái 401
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Kiểm tra xem đã đăng xuất hay chưa
      if (sessionStorage.getItem('adminLoggedOut') === 'true') {
        console.log('Admin đã đăng xuất, không thử làm mới token');
        return Promise.reject(error);
      }

      // Thử làm mới token
      try {
        const refreshToken = localStorage.getItem('adminRefreshToken') || Cookies.get('adminRefreshToken');
        if (!refreshToken) {
          throw new Error('Không có refresh token');
        }

        // Gọi API làm mới token
        const response = await axios.post(`${API_URL}/admin/auth/refresh`, {
          refreshToken,
        });

        if (response.data.accessToken) {
          // Lưu token mới
          const newToken = response.data.accessToken;
          localStorage.setItem('adminToken', newToken);
          Cookies.set('adminToken', newToken, { expires: 0.042 }); // 60 phút

          // Cập nhật token trong request gốc và thử lại
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
          return adminAxios(originalRequest);
        }
      } catch (refreshError) {
        console.error('Làm mới admin token thất bại:', refreshError);
        
        // Xóa dữ liệu xác thực
        clearAdminAuthData();

        // Chuyển hướng đến trang đăng nhập admin
        if (typeof window !== 'undefined') {
          window.location.href = '/admin/auth/login?error=session_expired';
        }

        return Promise.reject(new Error('Phiên đăng nhập admin đã hết hạn.'));
      }
    }

    // Đối với các lỗi khác, chỉ cần reject promise
    return Promise.reject(error);
  }
);

export default adminAxios;
