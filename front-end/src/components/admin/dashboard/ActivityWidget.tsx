import React, { useState } from 'react';
import Link from 'next/link';
import {
  FiBell,
  FiAlertTriangle,
  FiBarChart2,
  FiTarget,
  FiBox,
  FiUsers,
  FiExternalLink
} from 'react-icons/fi';

interface ActivityItem {
  id: string;
  type: 'notification' | 'warning' | 'info' | 'success';
  icon: React.ReactNode;
  title: string;
  description: string;
  time: string;
  actionLink?: string;
  actionText?: string;
}

const ActivityWidget = () => {
  // Sử dụng dữ liệu tĩnh để tránh lỗi với contexts
  const [activities] = useState<ActivityItem[]>([
    {
      id: 'pending-orders',
      type: 'notification',
      icon: <FiBell className="h-4 w-4" />,
      title: '5 đơn hàng mới cần xử lý',
      description: 'Có đơn hàng đang chờ xác nhận',
      time: 'Vừa xong',
      actionLink: '/admin/orders',
      actionText: 'Xem đơn hàng'
    },
    {
      id: 'low-stock',
      type: 'warning',
      icon: <FiAlertTriangle className="h-4 w-4" />,
      title: '12 sản phẩm sắp hết hàng',
      description: 'Cần nhập thêm hàng để tránh thiếu hụt',
      time: '30 phút trước',
      actionLink: '/admin/products',
      actionText: 'Kiểm tra kho'
    },
    {
      id: 'revenue-report',
      type: 'info',
      icon: <FiBarChart2 className="h-4 w-4" />,
      title: 'Báo cáo doanh thu tuần đã sẵn sàng',
      description: 'Xem chi tiết hiệu suất bán hàng tuần này',
      time: '1 giờ trước',
      actionLink: '/admin/dashboard',
      actionText: 'Xem báo cáo'
    },
    {
      id: 'campaign-milestone',
      type: 'success',
      icon: <FiTarget className="h-4 w-4" />,
      title: 'Campaign "Sale Tết" đạt 80% mục tiêu',
      description: 'Chỉ còn 20% nữa để hoàn thành mục tiêu',
      time: '2 giờ trước',
      actionLink: '/admin/campaigns',
      actionText: 'Xem campaign'
    },
    {
      id: 'new-users',
      type: 'info',
      icon: <FiUsers className="h-4 w-4" />,
      title: '15 người dùng mới đăng ký hôm nay',
      description: 'Tăng 25% so với hôm qua',
      time: '3 giờ trước',
      actionLink: '/admin/users',
      actionText: 'Xem người dùng'
    }
  ]);

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'notification':
        return 'text-blue-500 bg-blue-100';
      case 'warning':
        return 'text-yellow-500 bg-yellow-100';
      case 'info':
        return 'text-gray-500 bg-gray-100';
      case 'success':
        return 'text-green-500 bg-green-100';
      default:
        return 'text-gray-500 bg-gray-100';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Thông báo & Hoạt động</h2>
        <div className="flex items-center space-x-2">
          <span className="bg-pink-100 text-pink-600 text-xs font-medium px-2 py-1 rounded-full">
            {activities.filter(a => a.type === 'notification' || a.type === 'warning').length} mới
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-start space-x-3 p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className={`p-2 rounded-full ${getActivityColor(activity.type)}`}>
              {activity.icon}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 text-sm">{activity.title}</h3>
              <p className="text-xs text-gray-500 mt-1">{activity.description}</p>

              {activity.actionLink && activity.actionText && (
                <Link
                  href={activity.actionLink}
                  className="inline-flex items-center mt-2 text-pink-500 hover:text-pink-600 text-xs font-medium"
                >
                  {activity.actionText}
                  <FiExternalLink className="ml-1 h-3 w-3" />
                </Link>
              )}
            </div>

            <span className="text-xs text-gray-400 whitespace-nowrap">{activity.time}</span>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Thao tác nhanh</h3>
        <div className="grid grid-cols-2 gap-2">
          <Link
            href="/admin/products/create"
            className="flex items-center justify-center p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FiBox className="h-4 w-4 text-gray-600 mr-2" />
            <span className="text-xs text-gray-600">Thêm sản phẩm</span>
          </Link>

          <Link
            href="/admin/campaigns/create"
            className="flex items-center justify-center p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FiTarget className="h-4 w-4 text-gray-600 mr-2" />
            <span className="text-xs text-gray-600">Tạo campaign</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ActivityWidget;
