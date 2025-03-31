import React, { useState } from 'react';
import { FiUsers, FiUserCheck, FiUserMinus, FiUserX, FiBarChart, FiRefreshCw } from 'react-icons/fi';
import dynamic from 'next/dynamic';

// Lazy load biểu đồ chỉ khi cần thiết
const UserGrowthChart = dynamic(() => import('./UserGrowthChart'), { 
  ssr: false,
  loading: () => <div className="h-64 flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
  </div>
});

const UserGrowthTrendChart = dynamic(() => import('./UserGrowthTrendChart'), {
  ssr: false,
  loading: () => <div className="h-64 flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
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
        <div className="bg-gradient-to-r from-pink-500 to-pink-600 rounded-lg p-5 text-white shadow-lg transform transition-all hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm">Tổng số người dùng</p>
              <p className="text-3xl font-bold mt-1">{stats?.totalUsers ? stats.totalUsers.toLocaleString() : 0}</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <FiUsers className="text-white text-xl" />
            </div>
          </div>
          <p className="text-white/70 text-xs mt-4">
            <span className={`${(stats?.totalGrowth || 0) >= 0 ? 'text-green-300' : 'text-red-300'}`}>
              {(stats?.totalGrowth || 0) >= 0 ? '↑' : '↓'} {Math.abs(stats?.totalGrowth || 0).toFixed(1)}%
            </span> so với tháng trước
          </p>
        </div>
        
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-5 text-white shadow-lg transform transition-all hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm">Đang hoạt động</p>
              <p className="text-3xl font-bold mt-1">{stats?.activeUsers ? stats.activeUsers.toLocaleString() : 0}</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <FiUserCheck className="text-white text-xl" />
            </div>
          </div>
          <p className="text-white/70 text-xs mt-4">
            <span className={`${(stats?.activeGrowth || 0) >= 0 ? 'text-green-300' : 'text-red-300'}`}>
              {(stats?.activeGrowth || 0) >= 0 ? '↑' : '↓'} {Math.abs(stats?.activeGrowth || 0).toFixed(1)}%
            </span> so với tháng trước
          </p>
        </div>
        
        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg p-5 text-white shadow-lg transform transition-all hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm">Không hoạt động</p>
              <p className="text-3xl font-bold mt-1">{stats?.inactiveUsers ? stats.inactiveUsers.toLocaleString() : 0}</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <FiUserMinus className="text-white text-xl" />
            </div>
          </div>
          <p className="text-white/70 text-xs mt-4">
            <span className={`${(stats?.inactiveGrowth || 0) >= 0 ? 'text-green-300' : 'text-red-300'}`}>
              {(stats?.inactiveGrowth || 0) >= 0 ? '↑' : '↓'} {Math.abs(stats?.inactiveGrowth || 0).toFixed(1)}%
            </span> so với tháng trước
          </p>
        </div>
        
        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg p-5 text-white shadow-lg transform transition-all hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm">Đã khóa</p>
              <p className="text-3xl font-bold mt-1">{stats?.blockedUsers ? stats.blockedUsers.toLocaleString() : 0}</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <FiUserX className="text-white text-xl" />
            </div>
          </div>
          <p className="text-white/70 text-xs mt-4">
            <span className={`${(stats?.blockedGrowth || 0) >= 0 ? 'text-green-300' : 'text-red-300'}`}>
              {(stats?.blockedGrowth || 0) >= 0 ? '↑' : '↓'} {Math.abs(stats?.blockedGrowth || 0).toFixed(1)}%
            </span> so với tháng trước
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {renderUserStatistics()}
      
      <div className="flex justify-center mt-4">
        <button
          onClick={() => setShowCharts(prev => !prev)}
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-all"
        >
          <FiBarChart className="mr-2" />
          {showCharts ? 'Ẩn biểu đồ' : 'Hiển thị biểu đồ'}
        </button>
      </div>
      
      {/* Hiển thị biểu đồ tăng trưởng khi được bật */}
      {showCharts && stats?.monthlyCounts && stats.monthlyCounts.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <UserGrowthChart 
              data={stats.monthlyCounts} 
              title="Biểu đồ tăng trưởng người dùng"
            />
          </div>
          
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <UserGrowthTrendChart 
              data={stats.monthlyCounts} 
              title="Xu hướng tăng trưởng người dùng"
            />
          </div>
        </div>
      )}
      
      {/* Hiển thị thông báo khi không có dữ liệu */}
      {showCharts && (!stats?.monthlyCounts || stats.monthlyCounts.length === 0) && (
        <div className="p-6 flex flex-col items-center justify-center bg-white rounded-lg shadow-sm">
          <div className="text-gray-400 mb-2">
            <FiBarChart className="w-10 h-10 mx-auto" />
          </div>
          <p className="text-gray-500 text-center">Không có dữ liệu biểu đồ tăng trưởng</p>
        </div>
      )}
    </div>
  );
};

export default UserStats; 