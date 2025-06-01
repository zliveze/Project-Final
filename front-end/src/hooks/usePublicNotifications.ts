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

// Define types to replace 'any'
interface RawNotificationData {
  _id: string;
  content: string;
  type: string;
  link?: string;
  priority: number;
  startDate: string; // Raw date as string from API
  endDate?: string | null; // Raw date as string from API
  isActive: boolean;
  backgroundColor?: string;
  textColor?: string;
}

interface ApiError {
  message?: string;
  [key: string]: unknown;
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
        
        const data: RawNotificationData[] = await response.json();

        // Chuyển đổi các chuỗi ngày thành đối tượng Date
        const processedData: PublicNotification[] = data.map((notification: RawNotificationData) => ({
          ...notification,
          startDate: new Date(notification.startDate),
          endDate: notification.endDate ? new Date(notification.endDate) : null
        }));

        setNotifications(processedData);
        setError(null);
      } catch (err: unknown) {
        console.error('Error fetching public notifications:', err);
        const errorMessage = (err as ApiError)?.message || 'Có lỗi xảy ra khi tải thông báo';
        setError(errorMessage);
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