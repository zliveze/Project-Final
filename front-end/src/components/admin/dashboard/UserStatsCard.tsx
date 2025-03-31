import React, { useEffect, useState } from 'react';
import { useAdminUser } from '@/contexts/AdminUserContext';
import { 
  FiUsers, 
  FiUserCheck, 
  FiUserX, 
  FiUserMinus,
  FiTrendingUp,
  FiTrendingDown
} from 'react-icons/fi';

const UserStatsCard = () => {
  const { stats, loading } = useAdminUser();
  const [isLoaded, setIsLoaded] = useState(false);

  // Đánh dấu đã tải dữ liệu để tránh hiệu ứng nhấp nháy khi chuyển trang
  useEffect(() => {
    if (!loading && stats?.totalUsers !== undefined) {
      setIsLoaded(true);
    }
  }, [loading, stats]);

  // Hàm tạo component hiển thị phần trăm tăng trưởng
  const renderGrowthIndicator = (value: number | undefined) => {
    // Nếu không có dữ liệu hoặc giá trị bằng 0, không hiển thị indicator
    if (value === undefined || value === 0) return null;
    
    return value > 0 ? (
      <div className="flex items-center text-green-600">
        <FiTrendingUp className="mr-1" />
        <span>+{value.toFixed(1)}%</span>
      </div>
    ) : (
      <div className="flex items-center text-red-600">
        <FiTrendingDown className="mr-1" />
        <span>{value.toFixed(1)}%</span>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Tổng số người dùng */}
      <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100">
        <div className="flex items-center justify-between">
          <div className="p-3 rounded-full bg-blue-50 text-blue-500">
            <FiUsers size={24} />
          </div>
          <div className="inline-flex flex-col items-end">
            {isLoaded ? (
              <span className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</span>
            ) : (
              <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
            )}
            {isLoaded && renderGrowthIndicator(stats.totalGrowth)}
          </div>
        </div>
        <div className="mt-2 text-sm text-gray-600">Tổng số người dùng</div>
      </div>

      {/* Người dùng đang hoạt động */}
      <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100">
        <div className="flex items-center justify-between">
          <div className="p-3 rounded-full bg-green-50 text-green-500">
            <FiUserCheck size={24} />
          </div>
          <div className="inline-flex flex-col items-end">
            {isLoaded ? (
              <span className="text-2xl font-bold">{stats.activeUsers.toLocaleString()}</span>
            ) : (
              <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
            )}
            {isLoaded && renderGrowthIndicator(stats.activeGrowth)}
          </div>
        </div>
        <div className="mt-2 text-sm text-gray-600">Đang hoạt động</div>
      </div>

      {/* Người dùng không hoạt động */}
      <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100">
        <div className="flex items-center justify-between">
          <div className="p-3 rounded-full bg-yellow-50 text-yellow-500">
            <FiUserMinus size={24} />
          </div>
          <div className="inline-flex flex-col items-end">
            {isLoaded ? (
              <span className="text-2xl font-bold">{stats.inactiveUsers.toLocaleString()}</span>
            ) : (
              <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
            )}
            {isLoaded && renderGrowthIndicator(stats.inactiveGrowth)}
          </div>
        </div>
        <div className="mt-2 text-sm text-gray-600">Không hoạt động</div>
      </div>

      {/* Người dùng bị khóa */}
      <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100">
        <div className="flex items-center justify-between">
          <div className="p-3 rounded-full bg-red-50 text-red-500">
            <FiUserX size={24} />
          </div>
          <div className="inline-flex flex-col items-end">
            {isLoaded ? (
              <span className="text-2xl font-bold">{stats.blockedUsers.toLocaleString()}</span>
            ) : (
              <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
            )}
            {isLoaded && renderGrowthIndicator(stats.blockedGrowth)}
          </div>
        </div>
        <div className="mt-2 text-sm text-gray-600">Đã khóa</div>
      </div>
    </div>
  );
};

export default UserStatsCard; 