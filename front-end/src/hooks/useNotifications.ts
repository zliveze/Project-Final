import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Notification } from '@/components/admin/notifications/NotificationForm';

// Define error type to replace 'any'
interface ApiError {
  message?: string;
  [key: string]: unknown;
}

interface UseNotificationsProps {
  initialPage?: number;
  initialLimit?: number;
}

export const useNotifications = ({ initialPage = 1, initialLimit = 10 }: UseNotificationsProps = {}) => {
  // Quản lý state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    expiringSoon: 0
  });

  // Fetch danh sách thông báo
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('limit', limit.toString());
      
      if (typeFilter !== 'all') {
        queryParams.append('type', typeFilter);
      }
      
      if (statusFilter !== 'all') {
        queryParams.append('isActive', statusFilter === 'active' ? 'true' : 'false');
      }
      
      if (searchTerm) {
        queryParams.append('search', searchTerm);
      }

      const response = await fetch(`/api/admin/notifications?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      
      const data = await response.json();
      
      setNotifications(data.data);
      setTotal(data.metadata.total);
      setTotalPages(data.metadata.totalPages);
    } catch (err: unknown) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Có lỗi xảy ra khi tải dữ liệu thông báo');
      toast.error('Có lỗi xảy ra khi tải dữ liệu thông báo');
    } finally {
      setLoading(false);
    }
  }, [page, limit, typeFilter, statusFilter, searchTerm]);

  // Fetch thống kê
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/notifications/stats');
      
      if (!response.ok) {
        throw new Error('Failed to fetch notification stats');
      }
      
      const data = await response.json();
      setStats(data);
    } catch (err: unknown) {
      console.error('Error fetching notification stats:', err);
    }
  }, []);

  // Tạo thông báo mới
  const createNotification = async (data: Partial<Notification>): Promise<boolean> => {
    try {
      const response = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create notification');
      }

      // Refresh danh sách thông báo và thống kê
      fetchNotifications();
      fetchStats();

      return true;
    } catch (err: unknown) {
      const apiError = err as ApiError;
      toast.error(apiError.message || 'Có lỗi xảy ra khi tạo thông báo');
      return false;
    }
  };

  // Cập nhật thông báo
  const updateNotification = async (id: string, data: Partial<Notification>): Promise<boolean> => {
    try {
      const response = await fetch(`/api/admin/notifications/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update notification');
      }

      // Cập nhật state và thống kê
      setNotifications(prev => prev.map(item => item._id === id ? { ...item, ...data } as Notification : item));
      fetchStats();

      return true;
    } catch (err: unknown) {
      const apiError = err as ApiError;
      toast.error(apiError.message || 'Có lỗi xảy ra khi cập nhật thông báo');
      return false;
    }
  };

  // Xóa thông báo
  const deleteNotification = async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/admin/notifications/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete notification');
      }

      // Cập nhật state và thống kê
      setNotifications(prev => prev.filter(item => item._id !== id));
      fetchStats();

      return true;
    } catch (err: unknown) {
      const apiError = err as ApiError;
      toast.error(apiError.message || 'Có lỗi xảy ra khi xóa thông báo');
      return false;
    }
  };

  // Thay đổi trạng thái thông báo
  const toggleNotificationStatus = async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/admin/notifications/${id}`, {
        method: 'PATCH',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to toggle notification status');
      }

      const updatedNotification = await response.json();
      
      // Cập nhật state và thống kê
      setNotifications(prev => prev.map(item => item._id === id ? updatedNotification : item));
      fetchStats();

      return true;
    } catch (err: unknown) {
      const apiError = err as ApiError;
      toast.error(apiError.message || 'Có lỗi xảy ra khi thay đổi trạng thái thông báo');
      return false;
    }
  };

  // Load dữ liệu khi component mount hoặc các filter thay đổi
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Load thống kê khi component mount
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Hàm tiện ích thay đổi trang
  const goToPage = (newPage: number) => {
    setPage(newPage);
  };

  // Hàm tiện ích thay đổi số lượng hiển thị
  const changeLimit = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1); // Reset về trang 1 khi thay đổi limit
  };

  return {
    notifications,
    loading,
    error,
    page,
    limit,
    total,
    totalPages,
    stats,
    typeFilter,
    statusFilter,
    searchTerm,
    setTypeFilter,
    setStatusFilter,
    setSearchTerm,
    goToPage,
    changeLimit,
    fetchNotifications,
    createNotification,
    updateNotification,
    deleteNotification,
    toggleNotificationStatus
  };
}; 