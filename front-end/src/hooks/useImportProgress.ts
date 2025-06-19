import { useState, useCallback, useRef, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';

// Interface cho dữ liệu tiến trình trả về từ API
export interface ImportTask {
  id: string;
  userId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  message: string;
  summary?: {
    created?: number;
    updated?: number;
    brandsCreated?: number;
    categoriesCreated?: number;
    errors?: string[];
    totalProducts?: number;
    statusChanges?: {
      toOutOfStock?: number;
      toActive?: number;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

// Cờ để bật/tắt log debug
const DEBUG_MODE = process.env.NODE_ENV === 'development';

export const useImportProgress = () => {
  const [task, setTask] = useState<ImportTask | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Sử dụng axios global đã có interceptor từ AdminAuthContext
  const makeAdminRequest = useCallback(async (url: string) => {
    // Kiểm tra nếu đã đăng xuất
    if (sessionStorage.getItem('adminLoggedOut') === 'true') {
      console.log('Admin đã đăng xuất, không thực hiện yêu cầu API');
      throw new Error('Admin đã đăng xuất');
    }

    // Lấy admin token từ localStorage hoặc cookie
    const adminToken = localStorage.getItem('adminToken') || Cookies.get('adminToken');

    if (!adminToken) {
      throw new Error('Không tìm thấy token admin');
    }

    // Xử lý URL khác nhau cho Next.js API routes vs backend trực tiếp
    const apiUrl = url.startsWith('/api/admin')
      ? url // Sử dụng relative URL cho Next.js API routes
      : `${process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '')}/${url.replace(/^\//, '')}`; // Absolute URL cho backend trực tiếp

    // Sử dụng axios global với interceptor đã được cấu hình trong AdminAuthContext
    return await axios.get<ImportTask>(apiUrl, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
    });
  }, []);

  // Debug logger
  const debugLog = useCallback((...args: unknown[]) => {
    if (DEBUG_MODE) {
      console.log('[useImportProgress]', ...args);
    }
  }, []);

  // Hàm để dừng polling
  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      debugLog('Polling stopped.');
    }
  }, [debugLog]);

  // Hàm để bắt đầu polling
  const startPolling = useCallback(
    (taskId: string) => {
      if (!taskId) {
        setError('Task ID không hợp lệ.');
        return;
      }

      // Kiểm tra admin token
      const adminToken = localStorage.getItem('adminToken') || Cookies.get('adminToken');
      if (!adminToken) {
        setError('Không tìm thấy token admin. Vui lòng đăng nhập lại.');
        return;
      }

      // Dừng polling cũ nếu có
      stopPolling();
      setTask(null); // Reset trạng thái cũ
      setIsLoading(true);
      setError(null);

      debugLog(`Bắt đầu polling cho taskId: ${taskId}`);

      const poll = async () => {
        try {
          debugLog(`Polling... taskId: ${taskId}`);
          // Sử dụng API route trung gian của Next.js
          const response = await makeAdminRequest(`/api/admin/tasks/import/${taskId}`);
          const updatedTask = response.data;

          debugLog('Nhận được dữ liệu tác vụ:', updatedTask);
          setTask(updatedTask);

          // Dừng polling nếu tác vụ hoàn thành hoặc thất bại
          if (updatedTask.status === 'completed' || updatedTask.status === 'failed') {
            debugLog(`Tác vụ ${updatedTask.status}, dừng polling.`);
            setIsLoading(false);
            stopPolling();
          }
        } catch (err: unknown) {
          console.error('Lỗi khi polling tác vụ:', err);
          const errorMessage = (
            err as { response?: { data?: { message: string } } }
          )?.response?.data?.message;
          setError(errorMessage || 'Không thể lấy trạng thái tác vụ.');
          setIsLoading(false);
          stopPolling();
        }
      };

      // Gọi lần đầu ngay lập tức
      poll();
      // Sau đó bắt đầu polling định kỳ
      intervalRef.current = setInterval(poll, 2000); // Poll mỗi 2 giây
    },
    [stopPolling, debugLog, makeAdminRequest],
  );

  // Dọn dẹp khi component unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  // Hàm để reset trạng thái
  const resetProgress = useCallback(() => {
    stopPolling();
    setTask(null);
    setIsLoading(false);
    setError(null);
  }, [stopPolling]);

  return {
    task,
    isLoading,
    error,
    startPolling,
    resetProgress,
  };
};
