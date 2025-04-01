import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useNotification } from '@/contexts/NotificationContext';

const NotificationBanner: React.FC = () => {
  const { activeNotifications, getActiveNotifications, isLoading } = useNotification();
  const [currentNotificationIndex, setCurrentNotificationIndex] = useState(0);

  // Lấy thông báo khi component được mount
  useEffect(() => {
    getActiveNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Thiết lập interval để chuyển đổi giữa các thông báo
  useEffect(() => {
    if (activeNotifications.length <= 1) return;

    const intervalId = setInterval(() => {
      setCurrentNotificationIndex((prevIndex) => 
        prevIndex === activeNotifications.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000); // Thay đổi thông báo sau mỗi 5 giây

    return () => clearInterval(intervalId);
  }, [activeNotifications]);

  // Nếu không có thông báo nào, không hiển thị gì cả
  if (!activeNotifications.length || isLoading) return null;

  const currentNotification = activeNotifications[currentNotificationIndex];

  return (
    <div 
      className="w-full h-[30px] text-center overflow-hidden transition-colors duration-300"
      style={{ 
        backgroundColor: currentNotification.backgroundColor || '#E5FBF1',
      }}
    >
      <div className="h-full flex items-center justify-center">
        <div className="w-full whitespace-nowrap overflow-hidden">
          <div className="inline-block marquee-content">
            {currentNotification.link ? (
              <Link href={currentNotification.link}>
                <span 
                  className="text-sm font-medium cursor-pointer hover:underline"
                  style={{ color: currentNotification.textColor || '#306E51' }}
                >
                  {currentNotification.content}
                </span>
              </Link>
            ) : (
              <span 
                className="text-sm font-medium"
                style={{ color: currentNotification.textColor || '#306E51' }}
              >
                {currentNotification.content}
              </span>
            )}
          </div>
        </div>
        
        {/* Dots cho multiple notifications */}
        {activeNotifications.length > 1 && (
          <div className="flex space-x-1 absolute bottom-1 left-1/2 transform -translate-x-1/2">
            {activeNotifications.map((_, index) => (
              <span 
                key={index}
                className={`h-1 w-1 rounded-full ${
                  index === currentNotificationIndex 
                    ? 'bg-gray-800 opacity-70' 
                    : 'bg-gray-400 opacity-40'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(100%);
          }
          100% {
            transform: translateX(-100%);
          }
        }
        .marquee-content {
          animation: marquee 15s linear infinite;
          padding-left: 100%;
        }
      `}</style>
    </div>
  );
};

export default NotificationBanner; 