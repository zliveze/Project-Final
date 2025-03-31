import { useState, useEffect } from 'react';

export interface PublicNotification {
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
}

export const usePublicNotifications = () => {
  const [notifications, setNotifications] = useState<PublicNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/notifications/public');
        
        if (!response.ok) {
          throw new Error('Failed to fetch notifications');
        }
        
        const data = await response.json();
        
        // Chuyển đổi các chuỗi ngày thành đối tượng Date
        const processedData = data.map((notification: any) => ({
          ...notification,
          startDate: new Date(notification.startDate),
          endDate: notification.endDate ? new Date(notification.endDate) : null
        }));
        
        setNotifications(processedData);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching public notifications:', err);
        setError(err.message || 'Có lỗi xảy ra khi tải thông báo');
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  return {
    notifications,
    loading,
    error
  };
}; 