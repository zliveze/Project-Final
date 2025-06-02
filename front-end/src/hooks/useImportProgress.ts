import { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAdminAuth } from '@/contexts/AdminAuthContext';

interface ImportProgress {
  progress: number;
  status: 'reading' | 'parsing' | 'processing' | 'finalizing' | 'completed' | 'error';
  message: string;
  // Thêm các trường cho thông tin tổng kết
  summary?: {
    created?: number;
    updated?: number;
    errors?: string[];
    totalProducts?: number;
    statusChanges?: {
      toOutOfStock?: number;
      toActive?: number;
    };
  };
}

// Define types to replace 'any'
interface ImportProgressData {
  progress: number;
  status: string;
  message?: string;
  [key: string]: unknown;
}

// Cờ để bật/tắt log debug
const DEBUG_MODE = false;

export const useImportProgress = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { admin } = useAdminAuth(); // Thay user thành admin

  // Debug logger - chỉ log khi DEBUG_MODE = true
  const debugLog = useCallback((...args: unknown[]) => {
    if (DEBUG_MODE) {
      console.log(...args);
    }
  }, []);

  // Khởi tạo kết nối socket
  useEffect(() => {
    // Lấy base URL từ NEXT_PUBLIC_API_URL hoặc sử dụng mặc định
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    // Tạo URL cho WebSocket, đảm bảo không có path ở cuối
    const wsUrl = apiUrl.replace(/\/api$/, '');

    debugLog('Connecting to WebSocket at:', wsUrl);

    // Tạo cấu hình socket
    const socketOptions = {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    };

    debugLog('Socket options:', socketOptions);

    // Tạo kết nối socket
    const socketIo = io(wsUrl, socketOptions);

    socketIo.on('connect', () => {
      debugLog('WebSocket connected, socket id:', socketIo.id);
      setIsConnected(true);
    });

    socketIo.on('disconnect', () => {
      debugLog('WebSocket disconnected');
      setIsConnected(false);
    });

    socketIo.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setIsConnected(false);
    });

    socketIo.on('error', (error) => {
      console.error('Socket error:', error);
    });

    // Thêm sự kiện debug với mức log thấp hơn
    if (DEBUG_MODE) {
      socketIo.onAny((event, ...args) => {
        debugLog(`Socket event: ${event}`, args);
      });
    }

    setSocket(socketIo);

    return () => {
      socketIo.disconnect();
    };
  }, [debugLog]);

  // Đăng ký lắng nghe sự kiện tiến trình import
  useEffect(() => {
    if (!socket || !admin?._id) return; // Thay user?.id thành admin?._id

    const eventName = `import-progress-${admin._id}`; // Thay user.id thành admin._id

    const handleProgress = (data: unknown) => {
      // Giảm bớt log chi tiết, chỉ log khi debug
      debugLog(`Received progress update - RAW DATA:`, data);

      // Type guard và xử lý dữ liệu
      let progressData: ImportProgressData;

      // Nếu dữ liệu là mảng, lấy phần tử đầu tiên
      if (Array.isArray(data) && data.length > 0) {
        debugLog('Data is an array, using first element');
        progressData = data[0] as ImportProgressData;
      } else {
        progressData = data as ImportProgressData;
      }

      // Đảm bảo dữ liệu có định dạng đúng
      if (progressData && typeof progressData === 'object' && 'progress' in progressData && 'status' in progressData) {
        const finalProgressData: ImportProgress = {
          progress: Number(progressData.progress),
          status: progressData.status as ImportProgress['status'],
          message: progressData.message || ''
        };

        // Xử lý thông tin tổng kết từ message khi hoàn thành
        if (progressData.status === 'completed' && progressData.message) {
          try {
            // Phân tích thông báo để lấy thông tin tổng kết
            const message = progressData.message || '';
            const createdMatch = message.match(/(\d+) sản phẩm mới/);
            const updatedMatch = message.match(/(\d+) cập nhật/);
            const errorsMatch = message.match(/(\d+) lỗi/);
            const totalMatch = message.match(/tổng số (\d+) sản phẩm/);
            const toOutOfStockMatch = message.match(/(\d+) sản phẩm hết hàng/);
            const toActiveMatch = message.match(/(\d+) sản phẩm còn hàng/);

            finalProgressData.summary = {
              created: createdMatch ? parseInt(createdMatch[1]) : 0,
              updated: updatedMatch ? parseInt(updatedMatch[1]) : 0,
              errors: [],
              totalProducts: totalMatch ? parseInt(totalMatch[1]) : 0,
              statusChanges: {
                toOutOfStock: toOutOfStockMatch ? parseInt(toOutOfStockMatch[1]) : 0,
                toActive: toActiveMatch ? parseInt(toActiveMatch[1]) : 0
              }
            };

            // Thêm số lượng lỗi vào summary
            if (errorsMatch) {
              finalProgressData.summary.errors = new Array(parseInt(errorsMatch[1])).fill('Lỗi không xác định');
            }

            debugLog('Extracted summary data:', finalProgressData.summary);
          } catch (error) {
            console.error('Error parsing summary data:', error);
          }
        }

        // Chỉ log khi tiến trình thay đổi đáng kể hoặc có trạng thái đặc biệt
        if (DEBUG_MODE ||
            finalProgressData.status === 'completed' ||
            finalProgressData.status === 'error' ||
            finalProgressData.progress % 20 === 0) { // Chỉ log mỗi 20% tiến độ
          debugLog('Cập nhật tiến trình:', finalProgressData);
        }

        // Cập nhật trạng thái
        setProgress(finalProgressData);
      } else {
        console.error('Nhận được dữ liệu không hợp lệ:', progressData);
      }
    };

    // Đăng ký lắng nghe sự kiện
    debugLog(`Đăng ký lắng nghe sự kiện: ${eventName}`);
    socket.on(eventName, handleProgress);

    return () => {
      debugLog(`Hủy đăng ký lắng nghe sự kiện: ${eventName}`);
      socket.off(eventName, handleProgress);
    };
  }, [socket, admin?._id, debugLog]);

  // Reset tiến trình
  const resetProgress = useCallback(() => {
    setProgress(null);
  }, []);

  return { progress, isConnected, resetProgress };
};
