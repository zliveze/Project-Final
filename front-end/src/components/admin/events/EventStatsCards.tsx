import React, { useEffect, useState, useCallback } from 'react';
import { FiCalendar, FiCheckCircle, FiAlertTriangle, FiTrendingUp } from 'react-icons/fi';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://backendyumin.vercel.app/api';

interface TopPerformingEventRaw {
  _id: string;
  title: string;
  totalOrders: number;
  totalRevenue: number;
  endDate: string; 
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

const EventStatsCards = () => {
  const { accessToken, isAuthenticated } = useAdminAuth();
  const [dashboardStats, setDashboardStats] = useState<EventDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchEventStats = useCallback(async () => {
    if (!isAuthenticated || !accessToken) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/events/stats`, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      
      const statsData = response.data;
      
      // Chuẩn hóa dữ liệu endDate trong topPerformingEvents
      if (statsData.topPerformingEvents) {
        statsData.topPerformingEvents = statsData.topPerformingEvents.map((event: TopPerformingEventRaw) => ({
          ...event,
          endDate: new Date(event.endDate)
        }));
      }

      setDashboardStats(statsData);
    } catch (error) {
      console.error('Error fetching event stats:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, accessToken]); // Dependencies for useCallback

  useEffect(() => {
    fetchEventStats();
  }, [fetchEventStats]); // useEffect depends on the memoized fetchEventStats

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="bg-white overflow-hidden shadow rounded-lg animate-pulse">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-6 w-6 bg-gray-200 rounded"></div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded w-12"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!dashboardStats) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
        <p className="text-gray-500 text-center">Không thể tải thống kê events</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FiCalendar className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Tổng số
                  </dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{dashboardStats.totalEvents}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FiCheckCircle className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Đang hoạt động
                  </dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{dashboardStats.activeEvents}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FiAlertTriangle className="h-6 w-6 text-orange-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Sắp hết hạn
                  </dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{dashboardStats.expiringSoon}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FiTrendingUp className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Tổng doanh thu
                  </dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">
                      {formatCurrency(
                        dashboardStats.topPerformingEvents.reduce((sum, event) => sum + event.totalRevenue, 0)
                      )}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Performing Events */}
      {dashboardStats.topPerformingEvents.length > 0 && (
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Top Events hiệu quả nhất
            </h3>
            <div className="space-y-3">
              {dashboardStats.topPerformingEvents.slice(0, 5).map((event, index) => (
                <div key={event._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{event.title}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        {event.daysLeft > 0 ? (
                          <span className="text-xs text-gray-500">{event.daysLeft} ngày còn lại</span>
                        ) : (
                          <span className="text-xs text-red-500">Đã kết thúc</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{formatCurrency(event.totalRevenue)}</p>
                    <p className="text-xs text-gray-500">{event.totalOrders} đơn hàng</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Expiring Soon Alert */}
      {dashboardStats.expiringSoon > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <FiAlertTriangle className="h-5 w-5 text-orange-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-orange-800">
                Cảnh báo: {dashboardStats.expiringSoon} event sắp hết hạn
              </h3>
              <div className="mt-2 text-sm text-orange-700">
                <p>Có {dashboardStats.expiringSoon} event sẽ hết hạn trong 7 ngày tới. Hãy kiểm tra và gia hạn nếu cần thiết.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventStatsCards;
