import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { FaBell, FaCheck, FaTimes, FaCircle, FaExternalLinkAlt, FaShoppingBag, FaGift, FaCog } from 'react-icons/fa';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import { Notification } from './types';

interface NotificationsProps {
  notifications: Notification[];
  onMarkAsRead?: (notificationId: string) => void;
  onMarkAllAsRead?: () => void;
  onDeleteNotification?: (notificationId: string) => void;
}

const Notifications = ({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification
}: NotificationsProps) => {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<string>('all');
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>(notifications);

  useEffect(() => {
    if (selectedType === 'all') {
      setFilteredNotifications(notifications);
    } else {
      setFilteredNotifications(notifications.filter(notification => notification.type === selectedType));
    }
  }, [selectedType, notifications]);

  const formatDate = (dateString: string) => {
    const notificationDate = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - notificationDate.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return `${diffInSeconds} giây trước`;
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} phút trước`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} giờ trước`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays} ngày trước`;
    }
    
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(notificationDate);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'order':
        return 'bg-blue-100 text-blue-800';
      case 'promotion':
        return 'bg-pink-100 text-pink-800';
      case 'system':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'order':
        return 'Đơn hàng';
      case 'promotion':
        return 'Khuyến mãi';
      case 'system':
        return 'Hệ thống';
      default:
        return type;
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // Đánh dấu thông báo đã đọc
    if (!notification.isRead && onMarkAsRead) {
      onMarkAsRead(notification._id);
    }

    // Chuyển hướng tới trang liên quan nếu có
    if (notification.relatedId) {
      if (notification.type === 'order') {
        // Chuyển đến trang chi tiết đơn hàng
        router.push(`/profile?tab=orders&order=${notification.relatedId}`);
      } else if (notification.type === 'promotion') {
        // Chuyển đến trang khuyến mãi
        router.push(`/promotions/${notification.relatedId}`);
      }
    }
  };

  const handleMarkAllAsRead = () => {
    if (onMarkAllAsRead) {
      onMarkAllAsRead();
      toast.success('Đã đánh dấu tất cả thông báo là đã đọc');
    }
  };

  const countUnread = () => {
    return notifications.filter(notification => !notification.isRead).length;
  };

  if (notifications.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Thông báo</h2>
        <div className="text-center py-8">
          <div className="w-20 h-20 mx-auto bg-pink-50 rounded-full flex items-center justify-center mb-4">
            <FaBell className="text-pink-400 text-4xl" />
          </div>
          <p className="text-gray-500">Bạn chưa có thông báo nào</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <h2 className="text-xl font-semibold text-gray-800">Thông báo</h2>
          {countUnread() > 0 && (
            <span className="ml-2 px-2 py-1 bg-pink-100 text-pink-800 text-xs rounded-full">
              {countUnread()} chưa đọc
            </span>
          )}
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
          >
            <FaCheck className="mr-1 text-xs" /> Đánh dấu tất cả đã đọc
          </button>
        </div>
      </div>

      {/* Bộ lọc */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setSelectedType('all')}
          className={`px-3 py-1.5 rounded-md text-sm ${
            selectedType === 'all'
              ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Tất cả
        </button>
        <button
          onClick={() => setSelectedType('order')}
          className={`px-3 py-1.5 rounded-md text-sm ${
            selectedType === 'order'
              ? 'bg-blue-600 text-white'
              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
          }`}
        >
          Đơn hàng
        </button>
        <button
          onClick={() => setSelectedType('promotion')}
          className={`px-3 py-1.5 rounded-md text-sm ${
            selectedType === 'promotion'
              ? 'bg-pink-600 text-white'
              : 'bg-pink-100 text-pink-700 hover:bg-pink-200'
          }`}
        >
          Khuyến mãi
        </button>
        <button
          onClick={() => setSelectedType('system')}
          className={`px-3 py-1.5 rounded-md text-sm ${
            selectedType === 'system'
              ? 'bg-purple-600 text-white'
              : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
          }`}
        >
          Hệ thống
        </button>
      </div>

      {/* Danh sách thông báo */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <p className="text-center py-4 text-gray-500">Không có thông báo nào trong mục này</p>
        ) : (
          filteredNotifications.map((notification) => (
            <div
              key={notification._id}
              onClick={() => handleNotificationClick(notification)}
              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                notification.isRead
                  ? 'border-gray-200 bg-white hover:bg-gray-50'
                  : 'border-pink-200 bg-pink-50 hover:bg-pink-100'
              }`}
            >
              <div className="flex items-start">
                <div className="flex-shrink-0 mr-3">
                  {notification.image ? (
                    <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-100">
                      <Image
                        src={notification.image}
                        alt={notification.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gray-100">
                      {notification.type === 'order' && <FaShoppingBag className="text-blue-500 text-xl" />}
                      {notification.type === 'promotion' && <FaGift className="text-pink-500 text-xl" />}
                      {notification.type === 'system' && <FaCog className="text-purple-500 text-xl" />}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900 flex items-center">
                        {!notification.isRead && (
                          <FaCircle className="text-pink-500 mr-2 text-xs" />
                        )}
                        {notification.title}
                        <span
                          className={`ml-2 px-2 py-0.5 text-xs rounded-full ${getTypeColor(
                            notification.type
                          )}`}
                        >
                          {getTypeText(notification.type)}
                        </span>
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                    </div>
                    {onDeleteNotification && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteNotification(notification._id);
                        }}
                        className="text-gray-400 hover:text-red-500"
                        aria-label="Xóa thông báo"
                      >
                        <FaTimes />
                      </button>
                    )}
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-xs text-gray-500">{formatDate(notification.createdAt)}</p>
                    {notification.relatedId && (
                      <div className="text-xs text-pink-600 flex items-center">
                        Xem chi tiết <FaExternalLinkAlt className="ml-1" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Notifications;
