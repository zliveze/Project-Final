import React from 'react';
import { FiShoppingBag, FiDollarSign, FiClock } from 'react-icons/fi';
import { useAdminOrder } from '@/contexts';

export default function OrderStats() {
  const { orderStats } = useAdminOrder();

  const {
    pendingOrders: newOrders = 0,
    processingOrders = 0,
    completedOrders = 0,
    cancelledOrders = 0,
    totalRevenue = 0,
    todayRevenue = 0
  } = orderStats || {};
  // Định dạng số tiền thành VND
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6 mb-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Thống kê đơn hàng</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center">
            <FiShoppingBag className="h-8 w-8 text-blue-500 mr-2" />
            <div>
              <div className="text-blue-500 text-lg font-semibold">{newOrders}</div>
              <div className="text-gray-500 text-sm">Đơn hàng mới</div>
            </div>
          </div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="flex items-center">
            <FiClock className="h-8 w-8 text-yellow-500 mr-2" />
            <div>
              <div className="text-yellow-500 text-lg font-semibold">{processingOrders}</div>
              <div className="text-gray-500 text-sm">Đang xử lý</div>
            </div>
          </div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center">
            <FiShoppingBag className="h-8 w-8 text-green-500 mr-2" />
            <div>
              <div className="text-green-500 text-lg font-semibold">{completedOrders}</div>
              <div className="text-gray-500 text-sm">Hoàn thành</div>
            </div>
          </div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="flex items-center">
            <FiShoppingBag className="h-8 w-8 text-red-500 mr-2" />
            <div>
              <div className="text-red-500 text-lg font-semibold">{cancelledOrders}</div>
              <div className="text-gray-500 text-sm">Đã hủy</div>
            </div>
          </div>
        </div>
        <div className="bg-pink-50 p-4 rounded-lg">
          <div className="flex items-center">
            <FiDollarSign className="h-8 w-8 text-pink-500 mr-2" />
            <div>
              <div className="text-pink-500 text-lg font-semibold">{formatCurrency(totalRevenue)}</div>
              <div className="text-gray-500 text-sm">Tổng doanh thu</div>
            </div>
          </div>
        </div>
        <div className="bg-indigo-50 p-4 rounded-lg">
          <div className="flex items-center">
            <FiDollarSign className="h-8 w-8 text-indigo-500 mr-2" />
            <div>
              <div className="text-indigo-500 text-lg font-semibold">{formatCurrency(todayRevenue)}</div>
              <div className="text-gray-500 text-sm">Doanh thu hôm nay</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}