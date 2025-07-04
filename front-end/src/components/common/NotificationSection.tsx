import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { FiX } from 'react-icons/fi'
import { motion, AnimatePresence } from 'framer-motion'

// Định nghĩa kiểu dữ liệu thông báo
type Notification = {
  _id: string;
  content: string;
  type: string;
  link?: string;
  priority: number;
  startDate: Date;
  endDate?: Date | null;
  isActive: boolean;
  backgroundColor?: string;
  textColor?: string;
};

// Định nghĩa kiểu dữ liệu thông báo thô từ API
type RawNotification = {
  _id: string;
  content: string;
  type: string;
  link?: string;
  priority: number;
  startDate: string; // Dữ liệu từ API là chuỗi
  endDate?: string | null; // Dữ liệu từ API là chuỗi
  isActive: boolean;
  backgroundColor?: string;
  textColor?: string;
};

export default function NotificationSection() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentNotificationIndex, setCurrentNotificationIndex] = useState(0);
  const [showNotification, setShowNotification] = useState(true);

  useEffect(() => {
    // Hàm lấy dữ liệu thông báo
    const fetchNotifications = async () => {
      setLoading(true);
      setError(null);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://backendyumin.vercel.app/api';
        const response = await fetch(`${apiUrl}/notifications`);

        if (!response.ok) {
          // Nếu API chưa sẵn sàng (404) hoặc có lỗi khác, coi như không có thông báo
          if (response.status === 404) {
            console.log('API thông báo chưa sẵn sàng, sẽ không hiển thị thông báo.');
            setNotifications([]);
          } else {
            throw new Error(`Lỗi mạng: ${response.status}`);
          }
        } else {
          const data: RawNotification[] = await response.json();
          if (data && data.length > 0) {
            const formattedNotifications = data.map(notification => ({
              ...notification,
              startDate: new Date(notification.startDate),
              endDate: notification.endDate ? new Date(notification.endDate) : null,
            })).sort((a, b) => a.priority - b.priority);
            setNotifications(formattedNotifications);
          } else {
            setNotifications([]);
          }
        }
      } catch (error) {
        console.error('Không thể tải thông báo:', error);
        setNotifications([]); // Đặt mảng rỗng khi có lỗi
        setError('Không thể tải thông báo. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();

    // Thiết lập interval để tải lại thông báo mỗi 5 phút
    const intervalId = setInterval(fetchNotifications, 300000);

    // Xóa interval khi component unmount
    return () => clearInterval(intervalId);
  }, []);

  // Chuyển đổi thông báo sau mỗi 5 giây
  useEffect(() => {
    if (notifications.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentNotificationIndex((prev) => (prev + 1) % notifications.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [notifications.length]);

  // Hiển thị mặc định nếu không có thông báo hoặc đang tải/lỗi
  const shouldDisplay = !loading && !error && notifications.length > 0 && showNotification;

  if (!shouldDisplay) {
    return null;
  }

  const currentNotification = notifications[currentNotificationIndex];

  return (
    <AnimatePresence>
      {showNotification && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            backgroundColor: currentNotification.backgroundColor || '#FDF2F8',
            color: currentNotification.textColor || '#DB2777',
          }}
          className="w-full text-center py-2 relative"
        >
          <div className="container mx-auto px-4">
            <Link href={currentNotification.link || '#'} className="text-sm font-medium hover:underline">
              {currentNotification.content}
            </Link>

            {/* Nút đóng thông báo */}
            <button
              onClick={() => setShowNotification(false)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-white/20"
              aria-label="Đóng thông báo"
            >
              <FiX className="w-4 h-4" />
            </button>

            {/* Hiển thị chỉ số thông báo nếu có nhiều hơn 1 thông báo */}
            {notifications.length > 1 && (
              <div className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 flex space-x-1">
                {notifications.map((_, index) => (
                  <span
                    key={index}
                    className={`block w-1.5 h-1.5 rounded-full ${
                      index === currentNotificationIndex ? 'bg-current' : 'bg-current/30'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
