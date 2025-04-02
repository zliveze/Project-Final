import React, { createContext, useState, useContext, useEffect } from 'react';
import Cookies from 'js-cookie';

type User = {
  _id: string;
  name: string;
  email: string;
  role: string;
};

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{success: boolean; needVerification?: boolean; email?: string}>;
  register: (name: string, email: string, phone: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<boolean>;
  resetPassword: (token: string, password: string) => Promise<boolean>;
  googleLogin: (token: string) => Promise<boolean>;
  resendVerificationEmail: (email: string) => Promise<boolean>;
  setUser: (user: User | null) => void;
  setIsAuthenticated: (isAuthenticated: boolean) => void;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

// Base API URL từ biến môi trường
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Hàm lưu token vào cả localStorage và cookie
const saveToken = (name: string, value: string, expires?: number) => {
  localStorage.setItem(name, value);
  Cookies.set(name, value, { expires: expires || 2, path: '/' }); // 2 ngày mặc định
};

// Hàm xóa token từ cả localStorage và cookie
const removeToken = (name: string) => {
  localStorage.removeItem(name);
  Cookies.remove(name, { path: '/' });
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Kiểm tra xem người dùng đã đăng nhập chưa (từ localStorage)
    const loadUserFromStorage = () => {
      try {
        const token = localStorage.getItem('accessToken');
        const storedUser = localStorage.getItem('user');

        if (token && storedUser) {
          setUser(JSON.parse(storedUser));
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Lỗi khi đọc từ localStorage:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserFromStorage();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      
      // Gọi API đăng nhập trực tiếp
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Kiểm tra nếu lỗi là do chưa xác minh email
        if (data.message === 'Vui lòng xác minh email của bạn trước khi đăng nhập') {
          return { success: false, needVerification: true, email };
        }
        throw new Error(data.message || 'Đăng nhập thất bại');
      }

      // Kiểm tra xem người dùng đã xác minh email chưa
      if (!data.user.isVerified) {
        return { success: false, needVerification: true, email };
      }

      // Lưu token và thông tin người dùng vào localStorage và cookie
      saveToken('accessToken', data.accessToken, 2); // 2 ngày
      saveToken('refreshToken', data.refreshToken, 7); // 7 ngày
      localStorage.setItem('user', JSON.stringify(data.user));

      setUser(data.user);
      setIsAuthenticated(true);
      return { success: true };
    } catch (error) {
      console.error('Lỗi đăng nhập:', error);
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, phone: string, password: string) => {
    try {
      setIsLoading(true);
      
      // Gọi API đăng ký trực tiếp
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, phone, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Đăng ký thất bại');
      }

      return true;
    } catch (error) {
      console.error('Lỗi đăng ký:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      
      // Gọi API đăng xuất trực tiếp
      const token = localStorage.getItem('accessToken');
      
      if (token) {
        await fetch(`${API_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      }
      
      // Xóa thông tin đăng nhập khỏi localStorage và cookie
      removeToken('accessToken');
      removeToken('refreshToken');
      localStorage.removeItem('user');

      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Lỗi đăng xuất:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      setIsLoading(true);
      console.log('Gọi API forgot-password với URL:', `${API_URL}/auth/forgot-password`);
      
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      console.log('Kết quả API:', response.status, response.ok);
      return response.ok;
    } catch (error) {
      console.error('Lỗi quên mật khẩu:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (token: string, password: string) => {
    try {
      setIsLoading(true);
      
      // Gọi API đặt lại mật khẩu trực tiếp
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      });

      return response.ok;
    } catch (error) {
      console.error('Lỗi đặt lại mật khẩu:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const googleLogin = async (token: string) => {
    try {
      setIsLoading(true);
      
      console.log('Đang gọi Google login API với URL:', `${API_URL}/auth/google`);
      
      // Kết nối trực tiếp đến backend API thay vì qua API trung gian
      const response = await fetch(`${API_URL}/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
        mode: 'cors',
        credentials: 'include'
      });

      console.log('Google login API response status:', response.status);
      console.log('Google login API response type:', response.type);
      
      // Xử lý response
      try {
        const data = await response.json();
        console.log('Google login API response data:', data);

        if (!response.ok) {
          throw new Error(data.message || 'Đăng nhập Google thất bại');
        }

        // Lưu token và thông tin người dùng vào localStorage và cookie
        saveToken('accessToken', data.accessToken, 2); // 2 ngày
        saveToken('refreshToken', data.refreshToken, 7); // 7 ngày
        localStorage.setItem('user', JSON.stringify(data.user));

        setUser(data.user);
        setIsAuthenticated(true);
      } catch (parseError) {
        console.error('Không thể phân tích phản hồi:', parseError);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Lỗi đăng nhập Google:', error);
      // Log thêm thông tin để debug
      console.error('API_URL:', API_URL);
      console.error('Error details:', error instanceof Error ? error.message : String(error));
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const resendVerificationEmail = async (email: string) => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`${API_URL}/auth/resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      return response.ok;
    } catch (error) {
      console.error('Lỗi gửi lại email xác minh:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    googleLogin,
    resendVerificationEmail,
    setUser,
    setIsAuthenticated,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 