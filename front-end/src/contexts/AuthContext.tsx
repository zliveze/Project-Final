import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import Cookies from 'js-cookie';
// Giả định UserApiService có thể được import từ đây
// Nếu đường dẫn khác, cần điều chỉnh
import { UserApiService } from './user/UserApiService';

type User = {
  _id: string;
  name: string;
  email: string;
  role: string;
  customerLevel?: string; // Giữ nguyên định nghĩa User
  // Thêm các trường khác nếu API profile trả về
  addresses?: any[]; // Ví dụ
  phoneNumber?: string; // Ví dụ
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
  googleLogin: (code: string) => Promise<boolean>;
  resendVerificationEmail: (email: string) => Promise<boolean>;
  setUser: (user: User | null) => void;
  setIsAuthenticated: (isAuthenticated: boolean) => void;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

// Base API URL từ biến môi trường
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
// Sử dụng API_URL cho tất cả các endpoint, bao gồm cả auth
const AUTH_URL = API_URL + '/auth'; // Đảm bảo AUTH_URL cũng có /api

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
  const [isLoading, setIsLoading] = useState(true); // Giữ nguyên isLoading tổng thể
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Hàm fetch profile đầy đủ và cập nhật user state
  const fetchAndUpdateUserProfile = useCallback(async () => {
    try {
      // Chỉ fetch profile khi có token
      const token = localStorage.getItem('accessToken');
      if (!token) {
        // Chỉ log trong môi trường development
        if (process.env.NODE_ENV === 'development') {
          console.log('[AuthContext] No token found, skipping profile fetch');
        }
        return;
      }

      // Gọi API lấy profile đầy đủ
      const fullUserProfile = await UserApiService.getProfile();

      // Kiểm tra nếu profile là null (do token không hợp lệ/hết hạn hoặc không có token)
      if (fullUserProfile === null) {
        // Chỉ log trong môi trường development
        if (process.env.NODE_ENV === 'development') {
          console.log('[AuthContext] getProfile returned null. Logging out.');
        }
        // Nếu không lấy được profile (ví dụ: token hết hạn), thực hiện logout
        await logout();
        return; // Dừng thực thi hàm này
      }

      // Nếu có profile, cập nhật state và localStorage
      setUser(currentUser => ({
        ...(currentUser || {}),
        ...fullUserProfile
      })); // Xóa dấu chấm phẩy thừa và một dấu ngoặc đơn
      localStorage.setItem('user', JSON.stringify(fullUserProfile));
      // Chỉ log trong môi trường development
      if (process.env.NODE_ENV === 'development') {
        console.log('[AuthContext] User state and localStorage updated with full profile.');
      }
    } // Đóng khối try ở đây
    catch (error) { // catch phải đi liền sau try
      // Chỉ log trong môi trường development
      if (process.env.NODE_ENV === 'development') {
        console.error('[AuthContext] Error fetching full user profile (non-401):', error);
      }
      // Xử lý các lỗi khác không phải 401 (ví dụ: network error)
      // Có thể thêm logic xử lý lỗi cụ thể hơn ở đây nếu cần
    }
  }, []); // Xóa logout khỏi dependency array, vì hàm logout được định nghĩa bên ngoài và ổn định

  useEffect(() => {
    const loadUserFromStorage = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const storedUser = localStorage.getItem('user');

        if (token && storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            setIsAuthenticated(true);
            // Chỉ fetch profile khi cần thiết (ví dụ: khi không có đủ thông tin)
            if (!parsedUser.addresses || !parsedUser.phoneNumber) {
              await fetchAndUpdateUserProfile();
            }
          } catch (parseError) {
            // Chỉ log trong môi trường development
            if (process.env.NODE_ENV === 'development') {
              console.error('[AuthContext] Error parsing user from localStorage:', parseError);
            }
            removeToken('accessToken');
            removeToken('refreshToken');
            localStorage.removeItem('user');
            setIsAuthenticated(false);
          }
        } else {
          // Chỉ log trong môi trường development
          if (process.env.NODE_ENV === 'development') {
            console.log('[AuthContext] No valid token or user in storage.');
          }
          setIsAuthenticated(false);
        }
      } catch (error) {
        // Chỉ log trong môi trường development
        if (process.env.NODE_ENV === 'development') {
          console.error('[AuthContext] Error in loadUserFromStorage:', error);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadUserFromStorage();
  }, [fetchAndUpdateUserProfile]);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);

      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.message === 'Vui lòng xác minh email của bạn trước khi đăng nhập') {
          return { success: false, needVerification: true, email };
        }
        throw new Error(data.message || 'Đăng nhập thất bại');
      }

      if (!data.user.isVerified) {
        return { success: false, needVerification: true, email };
      }

      saveToken('accessToken', data.accessToken, 2);
      saveToken('refreshToken', data.refreshToken, 7);
      localStorage.setItem('user', JSON.stringify(data.user));

      setUser(data.user);
      setIsAuthenticated(true);

      // Chỉ log trong môi trường development
      if (process.env.NODE_ENV === 'development') {
        console.log('[AuthContext] Login successful');
      }

      await fetchAndUpdateUserProfile();

      return { success: true };
    } catch (error) {
      // Chỉ log trong môi trường development
      if (process.env.NODE_ENV === 'development') {
        console.error('[AuthContext] Login error:', error);
      }
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

  const googleLogin = async (code: string) => {
    try {
      setIsLoading(true);
      console.log('Đang xử lý callback Google với code:', code);

      // Backend sẽ xử lý việc trao đổi code lấy token và thông tin user
      // Frontend chỉ cần gọi endpoint callback của backend với code nhận được
      // Endpoint này nên là GET và code nằm trong query param
      const googleCallbackUrl = `${API_URL}/auth/callback/google?code=${code}`;
      console.log('Gọi API Backend:', googleCallbackUrl);

      const response = await fetch(googleCallbackUrl, {
        method: 'GET',
        headers: {
          // Không cần Content-Type cho GET không có body
        },
        // Không cần body, code đã ở trong URL
        credentials: 'include' // Quan trọng để gửi/nhận cookie session nếu backend dùng session
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          // Nếu không parse được JSON, dùng text
          errorData = { message: await response.text() };
        }
        console.error('Lỗi từ backend:', errorData);
        throw new Error(errorData.message || `Đăng nhập Google thất bại (status: ${response.status})`);
      }

      const data = await response.json();
      console.log('Response data từ backend:', data);

      // Backend nên trả về accessToken, refreshToken (nếu có), và user info
      if (!data.accessToken || !data.user) {
        console.error('Dữ liệu trả về không hợp lệ:', data);
        throw new Error('Không nhận được thông tin xác thực đầy đủ từ server');
      }

      // Lưu token và thông tin người dùng
      saveToken('accessToken', data.accessToken, 2); // 2 ngày
      if (data.refreshToken) {
        saveToken('refreshToken', data.refreshToken, 7); // 7 ngày
      }
      localStorage.setItem('user', JSON.stringify(data.user));

      setUser(data.user);
      setIsAuthenticated(true);
      console.log('Đăng nhập Google thành công!');

      // Redirect to profile page after successful login
      // window.location.href = '/profile';

      return true;
    } catch (error) {
      console.error('Lỗi trong hàm googleLogin:', error);
      // Ném lại lỗi để component gọi có thể xử lý (ví dụ: hiển thị thông báo)
      throw error;
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
