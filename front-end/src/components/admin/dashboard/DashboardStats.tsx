import React, { useEffect, useState } from 'react';
import { FiBox, FiDollarSign, FiShoppingBag, FiUsers, FiTrendingUp, FiTrendingDown } from 'react-icons/fi';
import { useApiStats } from '@/hooks/useApiStats';
import { useAdminOrder } from '@/contexts/AdminOrderContext';
import { useAdminUser } from '@/contexts/AdminUserContext';
import Cookies from 'js-cookie';

const DashboardStats = () => {
  const [hasToken, setHasToken] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const { statistics, loading, error, fetchStatistics } = useApiStats();
  const { orderStats, loading: orderLoading, fetchOrderStats } = useAdminOrder();
  const { stats: userStats, loading: userLoading, fetchUserStats } = useAdminUser();

  // State cho các thống kê
  const [todayOrders, setTodayOrders] = useState(0);
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [newUsers, setNewUsers] = useState(0);
  const [revenueGrowth, setRevenueGrowth] = useState(0);
  const [userGrowth, setUserGrowth] = useState(0);

  useEffect(() => {
    // Kiểm tra token có tồn tại không
    const adminToken = localStorage.getItem('adminToken') || Cookies.get('adminToken');
    setHasToken(!!adminToken);
  }, []);

  useEffect(() => {
    // Chỉ fetch một lần duy nhất
    if (hasToken && !hasFetched && !loading) {
      console.log('DashboardStats - Fetching all statistics once...');
      setHasFetched(true);
      fetchStatistics();
      fetchOrderStats('today'); // Lấy thống kê đơn hàng hôm nay
      fetchUserStats(); // Lấy thống kê người dùng
    }
  }, [hasToken, hasFetched, loading, fetchStatistics, fetchOrderStats, fetchUserStats]);

  // Cập nhật thống kê đơn hàng
  useEffect(() => {
    if (orderStats) {
      // Sử dụng todayOrders từ orderStats thay vì dailyStats
      setTodayOrders(orderStats.todayOrders || 0);

      // Tính doanh thu tháng này và tỷ lệ tăng trưởng
      if (orderStats.monthlyStats && orderStats.monthlyStats.length > 0) {
        const currentMonth = orderStats.monthlyStats[orderStats.monthlyStats.length - 1];
        const previousMonth = orderStats.monthlyStats[orderStats.monthlyStats.length - 2];

        setMonthlyRevenue(currentMonth.revenue || 0);

        if (previousMonth && previousMonth.revenue > 0) {
          const growth = ((currentMonth.revenue - previousMonth.revenue) / previousMonth.revenue) * 100;
          setRevenueGrowth(growth);
        }
      }
    }
  }, [orderStats]);

  // Cập nhật thống kê người dùng
  useEffect(() => {
    if (userStats) {
      // Tính người dùng mới tháng này
      if (userStats.monthlyCounts && userStats.monthlyCounts.length > 0) {
        const currentMonth = userStats.monthlyCounts[userStats.monthlyCounts.length - 1];
        setNewUsers(currentMonth.count || 0);
        setUserGrowth(currentMonth.growthRate || 0);
      }
    }
  }, [userStats]);

  // Nếu không có token, không render gì cả
  if (!hasToken) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center">
          <div className="p-3 rounded-full bg-pink-100 text-pink-500 mr-4">
            <FiBox className="h-6 w-6" />
          </div>
          <div>
            <p className="text-gray-500 text-sm font-medium">Tổng sản phẩm</p>
            <p className="text-2xl font-bold text-gray-800">
              {loading ? (
                <span className="inline-block w-12 h-7 bg-gray-200 animate-pulse rounded"></span>
              ) : error ? (
                <span className="text-red-500 text-sm">Lỗi</span>
              ) : (
                statistics?.total || 0
              )}
            </p>
            {error && (
              <p className="text-xs text-red-500 mt-1">{error}</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center">
          <div className="p-3 rounded-full bg-blue-100 text-blue-500 mr-4">
            <FiShoppingBag className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <p className="text-gray-500 text-sm font-medium">Đơn hàng hôm nay</p>
            <p className="text-2xl font-bold text-gray-800">
              {orderLoading ? (
                <span className="inline-block w-12 h-7 bg-gray-200 animate-pulse rounded"></span>
              ) : (
                todayOrders
              )}
            </p>
            <div className="flex items-center mt-1">
              <span className="text-xs text-gray-500">So với hôm qua</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center">
          <div className="p-3 rounded-full bg-green-100 text-green-500 mr-4">
            <FiDollarSign className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <p className="text-gray-500 text-sm font-medium">Doanh thu tháng</p>
            <p className="text-2xl font-bold text-gray-800">
              {orderLoading ? (
                <span className="inline-block w-16 h-7 bg-gray-200 animate-pulse rounded"></span>
              ) : (
                monthlyRevenue.toLocaleString('vi-VN') + 'đ'
              )}
            </p>
            <div className="flex items-center mt-1">
              {revenueGrowth !== 0 && (
                <>
                  {revenueGrowth > 0 ? (
                    <FiTrendingUp className="h-3 w-3 text-green-500 mr-1" />
                  ) : (
                    <FiTrendingDown className="h-3 w-3 text-red-500 mr-1" />
                  )}
                  <span className={`text-xs ${revenueGrowth > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {revenueGrowth > 0 ? '+' : ''}{revenueGrowth.toFixed(1)}%
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center">
          <div className="p-3 rounded-full bg-purple-100 text-purple-500 mr-4">
            <FiUsers className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <p className="text-gray-500 text-sm font-medium">Người dùng mới</p>
            <p className="text-2xl font-bold text-gray-800">
              {userLoading ? (
                <span className="inline-block w-12 h-7 bg-gray-200 animate-pulse rounded"></span>
              ) : (
                newUsers
              )}
            </p>
            <div className="flex items-center mt-1">
              {userGrowth !== 0 && (
                <>
                  {userGrowth > 0 ? (
                    <FiTrendingUp className="h-3 w-3 text-green-500 mr-1" />
                  ) : (
                    <FiTrendingDown className="h-3 w-3 text-red-500 mr-1" />
                  )}
                  <span className={`text-xs ${userGrowth > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {userGrowth > 0 ? '+' : ''}{userGrowth.toFixed(1)}%
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardStats;