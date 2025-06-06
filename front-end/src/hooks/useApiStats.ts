import { useState, useEffect, useCallback } from 'react';
import { useAdminAuth } from '../contexts/AdminAuthContext';
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

// Define error type to replace 'any'
interface ApiError {
  message?: string;
  [key: string]: unknown;
}

// API configuration
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://backendyumin.vercel.app/api';
const API_URL = BASE_URL;
const ADMIN_STATS_API = `${API_URL}/admin/products/statistics`;

export const useApiStats = () => {
  const { accessToken, isAuthenticated, logout } = useAdminAuth();
  const [statistics, setStatistics] = useState<ProductStatistics | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasTriedFetch, setHasTriedFetch] = useState<boolean>(false);

  // Lấy header xác thực sử dụng AdminAuthContext
  const getAuthHeader = useCallback((): HeadersInit => {
    // Lấy token từ context trước, nếu không có thì lấy từ localStorage
    const token = accessToken || localStorage.getItem('adminToken') || Cookies.get('adminToken');
    return {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    };
  }, [accessToken]);

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
      // Kiểm tra đầy đủ về xác thực
      const token = accessToken || localStorage.getItem('adminToken') || Cookies.get('adminToken');
      const isLoggedOut = sessionStorage.getItem('adminLoggedOut') === 'true';
      const isLoginPage = window.location.pathname.includes('/admin/auth/login');
      
      if (!token || isLoggedOut || isLoginPage) {
        console.log('Không đủ điều kiện để tải dữ liệu thống kê:', {
          hasToken: !!token,
          isLoggedOut,
          isLoginPage
        });
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
        if (response.status === 401) {
          // Sử dụng hàm logout từ context
          console.log('Token hết hạn, đăng xuất người dùng');
          await logout();
          return null;
        }
        
        const errorData = await response.json();
        throw new Error(errorData.message || `Error: ${response.status}`);
      }

      const data: ProductStatistics = await response.json();
      
      // Cập nhật state
      setStatistics(data);
      
      return data;
    } catch (error: unknown) {
      const apiError = error as ApiError;
      console.error('Error fetching statistics:', error);
      setError(apiError.message || 'Có lỗi xảy ra khi tải dữ liệu thống kê');
      return null;
    } finally {
      setLoading(false);
    }
  }, [accessToken, getAuthHeader, checkApiHealth, logout]);

  // Load thống kê khi component mount
  useEffect(() => {
    // Sử dụng bộ đếm để giới hạn số lần gọi để tránh vòng lặp vô hạn
    const fetchTriedCount = parseInt(sessionStorage.getItem('stats_fetch_tried') || '0');
    
    if (fetchTriedCount > 3) {
      console.log('Đã thử gọi API thống kê 3 lần, tạm dừng để tránh vòng lặp');
      return;
    }
    
    // Kiểm tra đầy đủ về xác thực
    const token = accessToken || localStorage.getItem('adminToken') || Cookies.get('adminToken');
    const isLoggedOut = sessionStorage.getItem('adminLoggedOut') === 'true';
    const isLoginPage = window.location.pathname.includes('/admin/auth/login');

    if (!token || isLoggedOut || isLoginPage || hasTriedFetch) {
      console.log('Không đủ điều kiện để tải dữ liệu thống kê, bỏ qua');
      return;
    }

    console.log('Đã xác thực admin, đang tải dữ liệu thống kê');
    sessionStorage.setItem('stats_fetch_tried', String(fetchTriedCount + 1));
    fetchStatistics().then(() => {
      // Xóa bộ đếm fetch sau khi hoàn thành
      setTimeout(() => sessionStorage.removeItem('stats_fetch_tried'), 5000);
    });
  }, [fetchStatistics, hasTriedFetch, isAuthenticated, accessToken]);

  // Hàm để reset trạng thái đã thử fetch
  const resetFetchState = useCallback(() => {
    setHasTriedFetch(false);
    sessionStorage.removeItem('stats_fetch_tried');
  }, []);

  return {
    statistics,
    loading,
    error,
    fetchStatistics,
    checkApiHealth,
    resetFetchState
  };
};