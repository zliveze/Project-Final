import React, { useEffect, useState } from 'react';
import { FiBox, FiDollarSign, FiShoppingBag, FiUsers } from 'react-icons/fi';
import { useApiStats } from '@/hooks/useApiStats';
import Cookies from 'js-cookie';

const DashboardStats = () => {
  const [hasToken, setHasToken] = useState(false);
  const { statistics, loading } = useApiStats();
  
  useEffect(() => {
    // Kiểm tra token có tồn tại không
    const adminToken = localStorage.getItem('adminToken') || Cookies.get('adminToken');
    setHasToken(!!adminToken);
  }, []);
  
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
              ) : (
                statistics?.total || 0
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center">
          <div className="p-3 rounded-full bg-blue-100 text-blue-500 mr-4">
            <FiShoppingBag className="h-6 w-6" />
          </div>
          <div>
            <p className="text-gray-500 text-sm font-medium">Đơn hàng hôm nay</p>
            <p className="text-2xl font-bold text-gray-800">
              <span className="inline-block w-12 h-7 bg-gray-200 animate-pulse rounded"></span>
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center">
          <div className="p-3 rounded-full bg-green-100 text-green-500 mr-4">
            <FiDollarSign className="h-6 w-6" />
          </div>
          <div>
            <p className="text-gray-500 text-sm font-medium">Doanh thu hôm nay</p>
            <p className="text-2xl font-bold text-gray-800">
              <span className="inline-block w-16 h-7 bg-gray-200 animate-pulse rounded"></span>
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center">
          <div className="p-3 rounded-full bg-purple-100 text-purple-500 mr-4">
            <FiUsers className="h-6 w-6" />
          </div>
          <div>
            <p className="text-gray-500 text-sm font-medium">Tổng khách hàng</p>
            <p className="text-2xl font-bold text-gray-800">
              <span className="inline-block w-12 h-7 bg-gray-200 animate-pulse rounded"></span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardStats; 