import React, { useState } from 'react';
import { FiUsers, FiUserCheck, FiUserMinus, FiUserX, FiBarChart, FiTrendingUp } from 'react-icons/fi';
import dynamic from 'next/dynamic';

// Lazy load biểu đồ chỉ khi cần thiết
const UserGrowthChart = dynamic(() => import('./UserGrowthChart'), {
  ssr: false,
  loading: () => <div className="h-64 flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
});

const UserGrowthTrendChart = dynamic(() => import('./UserGrowthTrendChart'), {
  ssr: false,
  loading: () => <div className="h-64 flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
});

interface UserStatsProps {
  stats: {
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    blockedUsers: number;
    monthlyCounts: { month: string; count: number; growthRate?: number }[];
    totalGrowth?: number;
    activeGrowth?: number;
    inactiveGrowth?: number;
    blockedGrowth?: number;
  };
}

const UserStats: React.FC<UserStatsProps> = ({ stats }) => {
  const [showCharts, setShowCharts] = useState(false);

  // Hiển thị số liệu thống kê
  const renderUserStatistics = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-100 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Tổng số người dùng</p>
              <p className="text-2xl font-bold mt-1 text-gray-800">{stats?.totalUsers ? stats.totalUsers.toLocaleString() : 0}</p>
            </div>
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-md flex items-center justify-center">
              <FiUsers className="text-xl" />
            </div>
          </div>
          <div className="flex items-center mt-3 text-xs">
            <span className={`flex items-center font-medium ${(stats?.totalGrowth || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {(stats?.totalGrowth || 0) >= 0 ? '↑' : '↓'} {Math.abs(stats?.totalGrowth || 0).toFixed(1)}%
            </span>
            <span className="text-gray-500 ml-1">so với tháng trước</span>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Đang hoạt động</p>
              <p className="text-2xl font-bold mt-1 text-gray-800">{stats?.activeUsers ? stats.activeUsers.toLocaleString() : 0}</p>
            </div>
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-md flex items-center justify-center">
              <FiUserCheck className="text-xl" />
            </div>
          </div>
          <div className="flex items-center mt-3 text-xs">
            <span className={`flex items-center font-medium ${(stats?.activeGrowth || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {(stats?.activeGrowth || 0) >= 0 ? '↑' : '↓'} {Math.abs(stats?.activeGrowth || 0).toFixed(1)}%
            </span>
            <span className="text-gray-500 ml-1">so với tháng trước</span>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Không hoạt động</p>
              <p className="text-2xl font-bold mt-1 text-gray-800">{stats?.inactiveUsers ? stats.inactiveUsers.toLocaleString() : 0}</p>
            </div>
            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-md flex items-center justify-center">
              <FiUserMinus className="text-xl" />
            </div>
          </div>
          <div className="flex items-center mt-3 text-xs">
            <span className={`flex items-center font-medium ${(stats?.inactiveGrowth || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {(stats?.inactiveGrowth || 0) >= 0 ? '↑' : '↓'} {Math.abs(stats?.inactiveGrowth || 0).toFixed(1)}%
            </span>
            <span className="text-gray-500 ml-1">so với tháng trước</span>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Đã khóa</p>
              <p className="text-2xl font-bold mt-1 text-gray-800">{stats?.blockedUsers ? stats.blockedUsers.toLocaleString() : 0}</p>
            </div>
            <div className="w-10 h-10 bg-red-50 text-red-600 rounded-md flex items-center justify-center">
              <FiUserX className="text-xl" />
            </div>
          </div>
          <div className="flex items-center mt-3 text-xs">
            <span className={`flex items-center font-medium ${(stats?.blockedGrowth || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {(stats?.blockedGrowth || 0) >= 0 ? '↑' : '↓'} {Math.abs(stats?.blockedGrowth || 0).toFixed(1)}%
            </span>
            <span className="text-gray-500 ml-1">so với tháng trước</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {renderUserStatistics()}

      <div className="flex justify-center mt-6">
        <button
          onClick={() => setShowCharts(prev => !prev)}
          className="inline-flex items-center px-4 py-2 border border-gray-200 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
        >
          {showCharts ? <FiBarChart className="mr-2" /> : <FiTrendingUp className="mr-2" />}
          {showCharts ? 'Ẩn biểu đồ' : 'Hiển thị biểu đồ'}
        </button>
      </div>

      {/* Hiển thị biểu đồ tăng trưởng khi được bật */}
      {showCharts && stats?.monthlyCounts && stats.monthlyCounts.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <div className="bg-white border border-gray-100 shadow-sm rounded-lg overflow-hidden">
            <UserGrowthChart
              data={stats.monthlyCounts}
              title="Biểu đồ tăng trưởng người dùng"
            />
          </div>

          <div className="bg-white border border-gray-100 shadow-sm rounded-lg overflow-hidden">
            <UserGrowthTrendChart
              data={stats.monthlyCounts}
              title="Xu hướng tăng trưởng người dùng"
            />
          </div>
        </div>
      )}

      {/* Hiển thị thông báo khi không có dữ liệu */}
      {showCharts && (!stats?.monthlyCounts || stats.monthlyCounts.length === 0) && (
        <div className="p-6 flex flex-col items-center justify-center bg-white rounded-lg border border-gray-100 shadow-sm mt-6">
          <div className="text-gray-400 mb-3">
            <FiBarChart className="w-10 h-10 mx-auto" />
          </div>
          <p className="text-gray-600 text-center font-medium">Không có dữ liệu biểu đồ tăng trưởng</p>
          <p className="text-gray-500 text-center text-sm mt-1">Dữ liệu sẽ được hiển thị khi có người dùng đăng ký mới</p>
        </div>
      )}
    </div>
  );
};

export default UserStats;
