import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'

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

export default function NotificationSection() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Hàm lấy dữ liệu thông báo
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        
        // Sử dụng biến môi trường từ .env
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        console.log('Đang tải thông báo từ API:', `${apiUrl}/notifications`);
        
        const response = await fetch(`${apiUrl}/notifications`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        console.log('Kết quả response:', response.status, response.statusText);
        
        // Xử lý lỗi HTTP
        if (!response.ok) {
          console.error('Lỗi response:', response.status, response.statusText);
          if (response.status === 404) {
            console.log('API endpoint chưa được triển khai, sử dụng mảng rỗng tạm thời');
            setNotifications([]);
            setLoading(false);
            return;
          }
          throw new Error(`Không thể tải thông báo: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Dữ liệu thông báo nhận được:', data);
        
        // Kiểm tra nếu dữ liệu là mảng rỗng
        if (!data || !Array.isArray(data) || data.length === 0) {
          console.log('Không có thông báo nào');
          setNotifications([]);
          return;
        }
        
        // Chuyển đổi chuỗi ngày thành đối tượng Date
        const formattedNotifications = data.map((notification: any) => ({
          ...notification,
          startDate: new Date(notification.startDate),
          endDate: notification.endDate ? new Date(notification.endDate) : null
        }));
        
        // Sắp xếp theo độ ưu tiên
        const sortedNotifications = formattedNotifications.sort((a: Notification, b: Notification) => 
          a.priority - b.priority
        );
        
        console.log('Số lượng thông báo sau khi xử lý:', sortedNotifications.length);
        setNotifications(sortedNotifications);
        setError(null);
      } catch (error) {
        console.error('Lỗi khi tải thông báo:', error);
        // Để tránh lỗi hiển thị, đặt mảng rỗng khi có lỗi
        setNotifications([]);
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError('Không thể tải thông báo');
        }
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

  // Hiển thị mặc định nếu không có thông báo hoặc đang tải/lỗi
  const shouldDisplay = !loading && !error && notifications.length > 0;
  
  if (!shouldDisplay) {
    return null;
  }

  // Tạo danh sách nội dung thông báo để hiển thị
  const notificationContent = notifications.map(notification => {
    const content = (
      <span key={notification._id}>
        {notification.link ? (
          <Link href={notification.link}>
            <span className="cursor-pointer hover:underline">{notification.content}</span>
          </Link>
        ) : (
          notification.content
        )}
      </span>
    );
    return content;
  });

  return (
    <div 
      className='w-full h-[30px]'
      style={{ 
        backgroundColor: notifications[0]?.backgroundColor || '#FDF2F8' 
      }}
    >
      <div className='h-full flex items-center overflow-hidden relative'>
        <style jsx>{`
          .marquee-container {
            display: flex;
            width: 100%;
            overflow: hidden;
          }
          .marquee {
            display: flex;
            animation: marquee 30s linear infinite;
            white-space: nowrap;
          }
          .marquee span {
            margin-right: 50px;
          }
          @keyframes marquee {
            0% {
              transform: translate(100%, 0);
            }
            100% {
              transform: translate(-100%, 0);
            }
          }
        `}</style>
        <div className='marquee-container'>
          <div 
            className='marquee'
            style={{ 
              color: notifications[0]?.textColor || '#DB2777',
              fontSize: '0.875rem',
              fontWeight: 'bold',
              gap: '200px'
            }}
          >
            {/* Lặp lại thông báo nhiều lần để tạo hiệu ứng chạy liên tục */}
            {notificationContent}
            {notificationContent}
            {notificationContent}
            {notificationContent}
            {notificationContent}
          </div>
        </div>
      </div>
    </div>
  )
}
