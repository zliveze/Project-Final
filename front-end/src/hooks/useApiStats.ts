import { useState, useEffect, useCallback } from 'react';
import Cookies from 'js-cookie';

interface ProductStatistics {
  total: number;
  active: number;
  outOfStock: number;
  discontinued: number;
  withVariants: number;
  withGifts: number;
  bestSellers: number;
  newProducts: number;
  onSale: number;
}

// API configuration
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const API_URL = BASE_URL.endsWith('/api') ? BASE_URL : `${BASE_URL}/api`;
const ADMIN_STATS_API = `${API_URL}/admin/products/statistics`;

export const useApiStats = () => {
  const [statistics, setStatistics] = useState<ProductStatistics | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasTriedFetch, setHasTriedFetch] = useState<boolean>(false);

  // Lấy token xác thực từ localStorage và cookie
  const getAuthHeader = useCallback((): HeadersInit => {
    // Kiểm tra nếu đã đăng xuất
    if (sessionStorage.getItem('adminLoggedOut') === 'true') {
      console.log('Người dùng đã đăng xuất, không thực hiện yêu cầu API statistics');
      return {
        'Content-Type': 'application/json'
      };
    }
    
    // Lấy token từ localStorage hoặc từ cookie nếu không có trong localStorage
    const token = localStorage.getItem('adminToken') || Cookies.get('adminToken');
    return {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    };
  }, []);

  // Phương thức kiểm tra API health
  const checkApiHealth = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/health`);
      return response.ok;
    } catch (error) {
      console.error('API health check failed:', error);
      return false;
    }
  }, []);

  // Fetch thống kê sản phẩm
  const fetchStatistics = useCallback(async (): Promise<ProductStatistics | null> => {
    try {
      // Kiểm tra nếu đã đăng xuất
      if (sessionStorage.getItem('adminLoggedOut') === 'true') {
        console.log('Người dùng đã đăng xuất, không thực hiện yêu cầu API statistics');
        return null;
      }
      
      // Kiểm tra token trước khi gọi API
      const token = localStorage.getItem('adminToken') || Cookies.get('adminToken');
      if (!token) {
        console.log('Không có token admin, bỏ qua việc tải dữ liệu thống kê');
        return null;
      }
      
      setLoading(true);
      setError(null);
      setHasTriedFetch(true);

      // Kiểm tra sức khỏe API trước
      const isApiHealthy = await checkApiHealth();
      if (!isApiHealthy) {
        throw new Error('API đang offline, vui lòng thử lại sau');
      }

      // Gọi API
      const response = await fetch(ADMIN_STATS_API, {
        headers: getAuthHeader()
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401) {
          // Xóa token và chuyển hướng đến trang đăng nhập admin
          localStorage.removeItem('adminToken');
          Cookies.remove('adminToken');
          sessionStorage.setItem('adminLoggedOut', 'true');
          console.log('Token đã hết hạn, chuyển hướng đến trang đăng nhập');
          
          // Đặt timeout để tránh chuyển hướng lặp lại
          setTimeout(() => {
            window.location.href = '/admin/auth/login?error=session_expired';
          }, 100);
          
          return null;
        }
        throw new Error(errorData.message || `Error: ${response.status}`);
      }

      const data: ProductStatistics = await response.json();
      
      // Cập nhật state
      setStatistics(data);
      
      return data;
    } catch (error: any) {
      console.error('Error fetching statistics:', error);
      setError(error.message || 'Có lỗi xảy ra khi tải dữ liệu thống kê');
      return null;
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader, checkApiHealth]);

  // Load thống kê khi component mount
  useEffect(() => {
    // Kiểm tra token trước khi tải dữ liệu
    const adminToken = localStorage.getItem('adminToken') || Cookies.get('adminToken');
    if (!adminToken || hasTriedFetch) {
      console.log('Không có token admin hoặc đã thử gọi API, bỏ qua việc tải dữ liệu thống kê');
      return;
    }
    
    // Nếu đã đăng xuất, không gọi API
    if (sessionStorage.getItem('adminLoggedOut') === 'true') {
      console.log('Người dùng đã đăng xuất, không gọi API thống kê');
      return;
    }
    
    console.log('Đã tìm thấy token admin, đang tải dữ liệu thống kê');
    fetchStatistics();
  }, [fetchStatistics, hasTriedFetch]);

  return {
    statistics,
    loading,
    error,
    fetchStatistics,
    checkApiHealth
  };
};