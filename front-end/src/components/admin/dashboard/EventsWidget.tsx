 import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { FiCalendar, FiTrendingUp, FiExternalLink, FiAlertCircle } from 'react-icons/fi';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://backendyumin.vercel.app/api';

interface RawEventData {
  _id: string;
  title: string;
  totalOrders: number;
  totalRevenue: number;
  endDate: string | number | Date; // Type from API before conversion
  daysLeft: number;
}

interface EventDashboardStats {
  totalEvents: number;
  activeEvents: number;
  expiringSoon: number;
  topPerformingEvents: Array<{
    _id: string;
    title: string;
    totalOrders: number;
    totalRevenue: number;
    endDate: Date;
    daysLeft: number;
  }>;
}

const EventsWidget = () => {
  const { accessToken, isAuthenticated } = useAdminAuth();
  const [dashboardStats, setDashboardStats] = useState<EventDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const effectFetchEventStats = async () => {
      if (!isAuthenticated || !accessToken) {
        return;
      }
      setIsLoading(true);
      try {
        const response = await axios.get(`${API_URL}/events/stats`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        const statsData = response.data;

        // Chuẩn hóa dữ liệu endDate trong topPerformingEvents
        if (statsData.topPerformingEvents) {
          statsData.topPerformingEvents = statsData.topPerformingEvents.map((event: RawEventData) => ({
            ...event,
            endDate: new Date(event.endDate)
          }));
        }
        setDashboardStats(statsData);
      } catch (error: unknown) {
        console.error('Error fetching event stats:', error);

        // Log chi tiết lỗi để debug
        if (axios.isAxiosError(error) && error.response) {
          console.error('Response error:', error.response.data);
          console.error('Status:', error.response.status);
        }

        // Tạo dữ liệu mẫu nếu API có lỗi
        setDashboardStats({
          totalEvents: 0,
          activeEvents: 0,
          expiringSoon: 0,
          topPerformingEvents: []
        });
      } finally {
        setIsLoading(false);
      }
    };
    effectFetchEventStats();
  }, [isAuthenticated, accessToken, setIsLoading, setDashboardStats]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Events</h2>
        <Link
          href="/admin/events"
          className="text-pink-500 hover:text-pink-600 text-sm font-medium flex items-center"
        >
          Xem tất cả
          <FiExternalLink className="ml-1 h-3 w-3" />
        </Link>
      </div>

      {isLoading ? (
        // Loading skeleton
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : dashboardStats ? (
        <div className="space-y-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">{dashboardStats.totalEvents}</p>
              <p className="text-xs text-gray-500">Tổng số</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{dashboardStats.activeEvents}</p>
              <p className="text-xs text-gray-500">Đang chạy</p>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="flex items-center justify-center">
                <FiAlertCircle className="h-4 w-4 text-orange-500 mr-1" />
                <p className="text-2xl font-bold text-orange-600">{dashboardStats.expiringSoon}</p>
              </div>
              <p className="text-xs text-gray-500">Sắp hết hạn</p>
            </div>
          </div>

          {/* Top Performing Events */}
          {dashboardStats.topPerformingEvents.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">Hiệu quả cao nhất</h3>
              <div className="space-y-3">
                {dashboardStats.topPerformingEvents.slice(0, 3).map((event) => (
                  <div
                    key={event._id}
                    className="flex flex-col sm:flex-row sm:items-center p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0 sm:pr-4">
                      <div className="p-2 rounded-full bg-blue-100 text-blue-500 flex-shrink-0">
                        <FiCalendar className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4
                          className="font-medium text-gray-900 text-sm truncate"
                          title={event.title}
                        >
                          {event.title}
                        </h4>
                        <div className="flex items-center space-x-2 mt-1">
                          {event.daysLeft > 0 ? (
                            <span className="text-xs text-gray-500 whitespace-nowrap">{event.daysLeft} ngày còn lại</span>
                          ) : (
                            <span className="text-xs text-red-500 whitespace-nowrap">Đã kết thúc</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-left sm:text-right flex-shrink-0 mt-2 sm:mt-0 ml-11 sm:ml-0">
                      <div className="flex items-center sm:justify-end text-sm font-medium text-gray-900">
                        <FiTrendingUp className="h-3 w-3 text-green-500 mr-1" />
                        <span className="truncate max-w-[120px] sm:max-w-[150px]" title={formatCurrency(event.totalRevenue)}>
                          {formatCurrency(event.totalRevenue)}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 whitespace-nowrap">{event.totalOrders} đơn hàng</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
            <FiCalendar className="h-full w-full" />
          </div>
          <p className="text-gray-500 text-sm">Chưa có dữ liệu thống kê</p>
          <Link
            href="/admin/events"
            className="inline-flex items-center mt-2 text-pink-500 hover:text-pink-600 text-sm font-medium"
          >
            Tạo event mới
            <FiExternalLink className="ml-1 h-3 w-3" />
          </Link>
        </div>
      )}
    </div>
  );
};

export default EventsWidget;
