import Cookies from 'js-cookie';
import { toast } from 'react-toastify';

/**
 * Kiểm tra trạng thái đăng nhập của người dùng
 * @returns {boolean} true nếu người dùng đã đăng nhập, false nếu chưa
 */
export const isAuthenticated = (): boolean => {
  const token = Cookies.get('token');
  return !!token;
};

/**
 * Kiểm tra xác thực và xử lý chuyển hướng nếu chưa đăng nhập
 * @param {() => void} callback - Hàm callback được gọi nếu người dùng đã đăng nhập
 * @param {boolean} redirect - Có chuyển hướng người dùng đến trang đăng nhập hay không
 * @param {string} message - Thông báo hiển thị khi chưa đăng nhập
 * @returns {boolean} true nếu người dùng đã đăng nhập, false nếu chưa
 */
export const checkAuth = (
  callback?: () => void,
  redirect = true,
  message = 'Vui lòng đăng nhập để thực hiện chức năng này'
): boolean => {
  const token = Cookies.get('token');
  
  if (!token) {
    // Hiển thị thông báo
    toast.info(message, {
      position: "bottom-right",
      autoClose: 3000,
      theme: "light",
      style: { backgroundColor: '#e3f2fd', color: '#0d47a1', borderLeft: '4px solid #0d47a1' }
    });
    
    // Chuyển hướng nếu cần
    if (redirect) {
      // Lấy đường dẫn hiện tại để quay lại sau khi đăng nhập
      const currentPath = window.location.pathname;
      const redirectUrl = `auth/login?redirect=${encodeURIComponent(currentPath)}`;
      
      // Chuyển hướng sau 1 giây để người dùng có thể đọc thông báo
      setTimeout(() => {
        window.location.href = redirectUrl;
      }, 1000);
    }
    
    return false;
  }
  
  // Gọi callback nếu có
  if (callback && typeof callback === 'function') {
    callback();
  }
  
  return true;
};

/**
 * Lấy token xác thực từ cookie
 * @returns {string|null} Token xác thực hoặc null nếu không có
 */
export const getAuthToken = (): string | null => {
  return Cookies.get('token') || null;
};

/**
 * Thêm Authorization header cho fetch request
 * @param {Object} headers - Headers hiện tại
 * @returns {Object} Headers đã được thêm Authorization
 */
export const addAuthHeader = (headers: Record<string, string> = {}): Record<string, string> => {
  const token = getAuthToken();
  
  if (token) {
    return {
      ...headers,
      'Authorization': `Bearer ${token}`
    };
  }
  
  return headers;
};

/**
 * Đăng xuất người dùng
 * @param {boolean} redirect - Có chuyển hướng về trang chủ sau khi đăng xuất hay không
 */
export const logout = (redirect = true): void => {
  Cookies.remove('token');
  
  // Thông báo đăng xuất thành công
  toast.success('Đăng xuất thành công', {
    position: "bottom-right",
    autoClose: 3000,
    theme: "light"
  });
  
  // Chuyển hướng về trang chủ
  if (redirect) {
    setTimeout(() => {
      window.location.href = '/';
    }, 1000);
  }
}; 
