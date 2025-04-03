import { useState, useEffect, useCallback } from 'react';

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

  // Lấy token xác thực từ localStorage
  const getAuthHeader = useCallback(() => {
    const token = localStorage.getItem('adminToken');
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
      setLoading(true);
      setError(null);

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
    fetchStatistics();
  }, [fetchStatistics]);

  return {
    statistics,
    loading,
    error,
    fetchStatistics,
    checkApiHealth
  };
};