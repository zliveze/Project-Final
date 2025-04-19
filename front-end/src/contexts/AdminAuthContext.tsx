import React, { createContext, useState, useContext, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Cookies from 'js-cookie';

// Cấu hình API
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Biến môi trường kiểm soát logging
const enableDetailedLogs = process.env.NEXT_PUBLIC_ENABLE_DETAILED_LOGS === 'true' || process.env.NODE_ENV === 'development';

/**
 * Hàm logging an toàn - chỉ hiển thị trong môi trường development
 */
const safeLog = (message: string, data?: any, level: 'info' | 'warn' | 'error' = 'info') => {
  // Chỉ log khi được bật trong môi trường development hoặc cấu hình rõ ràng
  if (!enableDetailedLogs) return;
  
  const prefix = '[AdminAuthContext]';
  
  if (data) {
    // Loại bỏ thông tin nhạy cảm khi log
    const sanitizedData = typeof data === 'object' ? sanitizeData(data) : data;
    
    switch (level) {
      case 'warn':
        console.warn(`${prefix} ${message}`, sanitizedData);
        break;
      case 'error':
        console.error(`${prefix} ${message}`, sanitizedData);
        break;
      default:
        console.log(`${prefix} ${message}`, sanitizedData);
    }
  } else {
    switch (level) {
      case 'warn':
        console.warn(`${prefix} ${message}`);
        break;
      case 'error':
        console.error(`${prefix} ${message}`);
        break;
      default:
        console.log(`${prefix} ${message}`);
    }
  }
};

/**
 * Hàm xử lý dữ liệu để loại bỏ thông tin nhạy cảm
 */
const sanitizeData = (data: any): any => {
  if (!data) return data;
  
  // Clone để không làm thay đổi dữ liệu gốc
  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item));
  }
  
  if (typeof data === 'object') {
    const sanitized = { ...data };
    
    // Loại bỏ token và thông tin nhạy cảm
    const sensitiveFields = ['token', 'accessToken', 'refreshToken', 'password', 'Authorization', 'jwt'];
    
    sensitiveFields.forEach(field => {
      if (field.toLowerCase() in sanitized) sanitized[field.toLowerCase()] = '[REDACTED]';
      if (field in sanitized) sanitized[field] = '[REDACTED]';
    });
    
    // Xử lý đệ quy các đối tượng con
    Object.keys(sanitized).forEach(key => {
      if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = sanitizeData(sanitized[key]);
      }
    });
    
    return sanitized;
  }
  
  return data;
};

type AdminUser = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'superadmin';
};

type AdminAuthContextType = {
  admin: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  accessToken: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
  setAdmin: (adminData: AdminUser | null) => void;
};

const AdminAuthContext = createContext<AdminAuthContextType>({} as AdminAuthContextType);

export const useAdminAuth = () => useContext(AdminAuthContext);

// Hàm lưu token vào cả localStorage và cookie
const saveToken = (name: string, value: string, expires?: number) => {
  localStorage.setItem(name, value);
  Cookies.set(name, value, { expires: expires || 1, path: '/' }); // 1 ngày mặc định
};

// Hàm xóa token từ cả localStorage và cookie
const removeToken = (name: string) => {
  localStorage.removeItem(name);
  Cookies.remove(name, { path: '/' });
};

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const router = useRouter();

  // Khởi tạo axios với interceptor để tự động làm mới token
  useEffect(() => {
    // Tạo interceptor để bắt các lỗi 401 và tự động làm mới token
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        // Nếu lỗi là 401 và chưa thử làm mới token
        // Nếu lỗi là 401, chưa thử lại, và không phải từ các endpoint refresh, login, hoặc logout
        if (error.response?.status === 401 && !originalRequest._retry &&
            !originalRequest.url?.includes(`${API_URL}/admin/auth/refresh`) &&
            !originalRequest.url?.includes(`${API_URL}/admin/auth/login`) &&
            !originalRequest.url?.includes(`${API_URL}/admin/auth/logout`)) { // Thêm điều kiện này
          originalRequest._retry = true;

          try {
            // Kiểm tra xem đã đăng xuất hay chưa
            if (sessionStorage.getItem('adminLoggedOut') === 'true') {
              safeLog('Người dùng đã đăng xuất, không làm mới token', {}, 'warn');
              await logout();
              // Chỉ chuyển hướng nếu đang ở trang admin
              if (router.pathname.startsWith('/admin')) {
                router.push('/admin/auth/login?error=session_expired');
              }
              return Promise.reject(error);
            }
            
            const refreshToken = localStorage.getItem('adminRefreshToken') || Cookies.get('adminRefreshToken');
            if (!refreshToken) {
              // Không có refresh token, logout
              safeLog('Không tìm thấy refresh token', {}, 'warn');
              await logout();
              // Chỉ chuyển hướng nếu đang ở trang admin
              if (router.pathname.startsWith('/admin')) {
                router.push('/admin/auth/login?error=session_expired');
              }
              return Promise.reject(error);
            }
            
            // Gọi API làm mới token
            const response = await axios.post(`${API_URL}/admin/auth/refresh`, {
              refreshToken,
            });
            
            if (response.data.accessToken) {
              // Lưu token mới
              const newToken = response.data.accessToken;
              saveToken('adminToken', newToken, 0.042); // 60 phút (0.042 ngày)
              setAccessToken(newToken);
              
              // Cập nhật token trong request gốc và thử lại
              originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
              return axios(originalRequest);
            }
          } catch (refreshError) {
            // Nếu làm mới token thất bại, logout
            safeLog('Làm mới token thất bại', refreshError, 'error');
            await logout(); // Logout logic still runs to clear invalid admin state
            // Chỉ chuyển hướng nếu đang ở trang admin
            if (router.pathname.startsWith('/admin')) {
              safeLog('Đang ở trang admin, chuyển hướng đến trang đăng nhập');
              router.push('/admin/auth/login?error=session_expired');
            } else {
              safeLog('Không ở trang admin, không chuyển hướng');
            }
            return Promise.reject(refreshError);
          }
        }
        
        return Promise.reject(error);
      }
    );
    
    return () => {
      // Xóa interceptor khi unmount
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, [router.pathname]);

  useEffect(() => {
    // Kiểm tra xem admin đã đăng nhập chưa (từ localStorage)
    const loadAdminFromStorage = async () => {
      try {
        // Đã đăng xuất thì bỏ qua
        if (sessionStorage.getItem('adminLoggedOut') === 'true') {
          safeLog('Đã đăng xuất từ trước, bỏ qua việc tải thông tin admin');
          setIsLoading(false);
          return;
        }
        
        const token = localStorage.getItem('adminToken') || Cookies.get('adminToken');
        const storedAdmin = localStorage.getItem('adminUser');

        if (token && storedAdmin) {
          try {
            const adminData = JSON.parse(storedAdmin);
            setAdmin(adminData);
            setAccessToken(token);
            setIsAuthenticated(true);
            
            // Nếu đang ở trang đăng nhập mà đã có token, chuyển về dashboard
            if (router.pathname === '/admin/auth/login') {
              router.push('/admin/dashboard');
            }
          } catch (parseError) {
            safeLog('Lỗi khi phân tích dữ liệu admin từ localStorage', parseError, 'error');
            // Xóa dữ liệu không hợp lệ
            localStorage.removeItem('adminUser');
            setIsAuthenticated(false);
          }
        } else if (router.pathname.startsWith('/admin') && router.pathname !== '/admin/auth/login') {
          // Nếu chưa đăng nhập và đang ở trang admin (không phải trang login), chuyển về trang đăng nhập
          router.push('/admin/auth/login');
        }
      } catch (error) {
        safeLog('Lỗi khi đọc từ localStorage', error, 'error');
      } finally {
        setIsLoading(false);
      }
    };

    loadAdminFromStorage();
  }, [router.pathname]);

  // Kiểm tra xem người dùng có quyền admin không
  const checkAuth = async (): Promise<boolean> => {
    try {
      // Đã đăng xuất thì bỏ qua
      if (sessionStorage.getItem('adminLoggedOut') === 'true') {
        safeLog('Đã đăng xuất từ trước, bỏ qua việc kiểm tra xác thực');
        return false;
      }
      
      if (isAuthenticated && admin) {
        return true;
      }
      
      const token = localStorage.getItem('adminToken') || Cookies.get('adminToken');
      
      if (!token) {
        return false;
      }
      
      // Gọi API để kiểm tra token
      const response = await axios.get(`${API_URL}/admin/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.data) {
        // Cập nhật thông tin người dùng nếu có dữ liệu trả về
        setAdmin(response.data);
        setAccessToken(token);
        setIsAuthenticated(true);
        
        // Lưu thông tin admin trở lại localStorage để đảm bảo nhất quán
        localStorage.setItem('adminUser', JSON.stringify(response.data));
        
        return true;
      }
      
      return false;
    } catch (error) {
      safeLog('Lỗi khi kiểm tra quyền admin', error, 'error');
      setIsAuthenticated(false);
      setAdmin(null);
      setAccessToken(null);
      
      // Nếu có lỗi 401 hoặc 403, xóa token
      if (axios.isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 403)) {
        removeToken('adminToken');
        removeToken('adminRefreshToken');
        localStorage.removeItem('adminUser');
      }
      
      return false;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      
      // Gọi API đăng nhập admin
      const response = await axios.post(`${API_URL}/admin/auth/login`, { email, password });
      const data = response.data;

      if (!data || data.success === false) {
        return false;
      }

      // Xóa flag đánh dấu đã đăng xuất nếu có
      sessionStorage.removeItem('adminLoggedOut');

      // Thay thế console.log bằng safeLog an toàn hơn
      safeLog('Đăng nhập thành công', { 
        user: { 
          _id: data.user._id,
          role: data.user.role,
          // Không log email và tên đầy đủ
        } 
      });

      // Lưu token và thông tin admin vào localStorage và cookie
      saveToken('adminToken', data.accessToken, 0.042); // 60 phút (0.042 ngày)
      saveToken('adminRefreshToken', data.refreshToken, 1); // 1 ngày
      localStorage.setItem('adminUser', JSON.stringify(data.user));
      
      // Cập nhật state
      setAccessToken(data.accessToken);
      setAdmin(data.user);
      setIsAuthenticated(true);
      
      return true;
    } catch (error) {
      safeLog('Lỗi đăng nhập admin', error, 'error');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      
      // Đánh dấu đã đăng xuất trước để ngăn các yêu cầu API khác
      sessionStorage.setItem('adminLoggedOut', 'true');
      
      // Gọi API đăng xuất admin
      const token = localStorage.getItem('adminToken') || Cookies.get('adminToken');
      
      if (token) {
        try {
          await axios.post(`${API_URL}/admin/auth/logout`, null, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          safeLog('Đã gọi API đăng xuất thành công');
        } catch (error) {
          safeLog('Lỗi khi gọi API đăng xuất', error, 'error');
        }
      }
      
      // Xóa token và thông tin admin khỏi localStorage và cookie
      removeToken('adminToken');
      removeToken('adminRefreshToken');
      localStorage.removeItem('adminUser');
      
      // Cập nhật state
      setAdmin(null);
      setAccessToken(null);
      setIsAuthenticated(false);
      
      // Chỉ chuyển về trang đăng nhập nếu đang ở trang admin
      if (router.pathname.startsWith('/admin')) {
        router.push('/admin/auth/login');
      }
    } catch (error) {
      safeLog('Lỗi đăng xuất admin', error, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const contextValue: AdminAuthContextType = {
    admin,
    isAuthenticated,
    isLoading,
    accessToken,
    login,
    logout,
    checkAuth,
    setAdmin,
  };

  return (
    <AdminAuthContext.Provider value={contextValue}>
      {children}
    </AdminAuthContext.Provider>
  );
};
