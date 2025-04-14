import { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAdminAuth } from '@/contexts/AdminAuthContext';

interface ImportProgress {
  progress: number;
  status: 'reading' | 'parsing' | 'processing' | 'finalizing' | 'completed' | 'error';
  message: string;
}

export const useImportProgress = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { admin } = useAdminAuth(); // Thay user thành admin

  // Khởi tạo kết nối socket
  useEffect(() => {
    // Lấy base URL từ NEXT_PUBLIC_API_URL hoặc sử dụng mặc định
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    // Tạo URL cho WebSocket, đảm bảo không có path ở cuối
    const wsUrl = apiUrl.replace(/\/api$/, '');

    console.log('Connecting to WebSocket at:', wsUrl);

    // Tạo cấu hình socket
    const socketOptions = {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    };

    console.log('Socket options:', socketOptions);

    // Tạo kết nối socket
    const socketIo = io(wsUrl, socketOptions);

    socketIo.on('connect', () => {
      console.log('WebSocket connected, socket id:', socketIo.id);
      setIsConnected(true);
    });

    socketIo.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    });

    socketIo.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setIsConnected(false);
    });

    socketIo.on('error', (error) => {
      console.error('Socket error:', error);
    });

    // Thêm sự kiện debug
    socketIo.onAny((event, ...args) => {
      console.log(`Socket event: ${event}`, args);
    });

    setSocket(socketIo);

    return () => {
      socketIo.disconnect();
    };
  }, []);

  // Đăng ký lắng nghe sự kiện tiến trình import
  useEffect(() => {
    if (!socket || !admin?._id) return; // Thay user?.id thành admin?._id

    const eventName = `import-progress-${admin._id}`; // Thay user.id thành admin._id

    const handleProgress = (data: any) => {
      console.log(`Received progress update - RAW DATA:`, data);
      console.log(`Data type: ${typeof data}, Is Array: ${Array.isArray(data)}`);

      // Nếu dữ liệu là mảng, lấy phần tử đầu tiên
      if (Array.isArray(data) && data.length > 0) {
        console.log('Data is an array, using first element');
        data = data[0];
      }

      // In ra chi tiết hơn về dữ liệu
      if (data) {
        console.log('Data keys:', Object.keys(data));
        if ('progress' in data) console.log('Progress value:', data.progress, 'type:', typeof data.progress);
        if ('status' in data) console.log('Status value:', data.status, 'type:', typeof data.status);
        if ('message' in data) console.log('Message value:', data.message);
      }

      // Đảm bảo dữ liệu có định dạng đúng
      if (data && typeof data === 'object' && 'progress' in data && 'status' in data) {
        const progressData: ImportProgress = {
          progress: Number(data.progress),
          status: data.status as ImportProgress['status'],
          message: data.message || ''
        };

        console.log('Cập nhật tiến trình:', progressData);

        // Cập nhật trạng thái
        setProgress(progressData);

        // Log thêm thông tin để debug
        if (progressData.status === 'completed' && progressData.progress === 100) {
          console.log('Import hoàn tất, cập nhật trạng thái tiến trình');
        }
      } else {
        console.error('Nhận được dữ liệu không hợp lệ:', data);
      }
    };

    // Đăng ký lắng nghe sự kiện
    console.log(`Đăng ký lắng nghe sự kiện: ${eventName}`);
    socket.on(eventName, handleProgress);

    // // Đăng ký lắng nghe sự kiện trực tiếp (không có userId) - Tạm thời loại bỏ để tránh xung đột
    // const directEventName = 'import-progress';
    // console.log(`Đăng ký lắng nghe sự kiện trực tiếp: ${directEventName}`);
    // socket.on(directEventName, handleProgress);

    return () => {
      console.log(`Hủy đăng ký lắng nghe sự kiện: ${eventName}`);
      socket.off(eventName, handleProgress);
      // socket.off(directEventName, handleProgress); // Bỏ luôn phần hủy đăng ký tương ứng
    };
  }, [socket, admin?._id]); // Thay user?.id thành admin?._id

  // Reset tiến trình
  const resetProgress = useCallback(() => {
    setProgress(null);
  }, []);

  return { progress, isConnected, resetProgress };
};
