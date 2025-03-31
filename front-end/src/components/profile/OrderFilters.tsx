import React from 'react';
import { OrderStatusType } from './types';

interface OrderFiltersProps {
  orderStatusFilter: OrderStatusType;
  searchOrderQuery: string;
  onFilterChange: (status: OrderStatusType) => void;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  onClearFilters?: () => void;
}

const OrderFilters: React.FC<OrderFiltersProps> = ({
  orderStatusFilter,
  searchOrderQuery,
  onFilterChange,
  onSearchChange,
  onSearchSubmit,
  onClearFilters
}) => {
  return (
    <div className="mb-8">
      <h3 className="text-lg font-medium text-gray-800 mb-4">Lọc đơn hàng</h3>
      
      {/* Bộ lọc theo trạng thái */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button 
          onClick={() => onFilterChange('all')}
          className={`px-4 py-2 rounded-md ${
            orderStatusFilter === 'all' 
              ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white' 
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          }`}
        >
          Tất cả
        </button>
        <button 
          onClick={() => onFilterChange('pending')}
          className={`px-4 py-2 rounded-md ${
            orderStatusFilter === 'pending' 
              ? 'bg-yellow-500 text-white' 
              : 'bg-gray-200 text-gray-800 hover:bg-yellow-100 hover:text-yellow-600'
          }`}
        >
          Chờ xác nhận
        </button>
        <button 
          onClick={() => onFilterChange('processing')}
          className={`px-4 py-2 rounded-md ${
            orderStatusFilter === 'processing' 
              ? 'bg-purple-500 text-white' 
              : 'bg-gray-200 text-gray-800 hover:bg-purple-100 hover:text-purple-600'
          }`}
        >
          Đang xử lý
        </button>
        <button 
          onClick={() => onFilterChange('shipping')}
          className={`px-4 py-2 rounded-md ${
            orderStatusFilter === 'shipping' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 text-gray-800 hover:bg-blue-100 hover:text-blue-600'
          }`}
        >
          Đang giao
        </button>
        <button 
          onClick={() => onFilterChange('delivered')}
          className={`px-4 py-2 rounded-md ${
            orderStatusFilter === 'delivered' 
              ? 'bg-green-500 text-white' 
              : 'bg-gray-200 text-gray-800 hover:bg-green-100 hover:text-green-600'
          }`}
        >
          Đã giao
        </button>
        <button 
          onClick={() => onFilterChange('cancelled')}
          className={`px-4 py-2 rounded-md ${
            orderStatusFilter === 'cancelled' 
              ? 'bg-red-500 text-white' 
              : 'bg-gray-200 text-gray-800 hover:bg-red-100 hover:text-red-600'
          }`}
        >
          Đã hủy
        </button>
      </div>
      
      {/* Tìm kiếm đơn hàng */}
      <div className="mb-4">
        <form onSubmit={onSearchSubmit} className="relative">
          <input
            type="text"
            placeholder="Tìm kiếm theo mã đơn hàng hoặc sản phẩm"
            value={searchOrderQuery}
            onChange={onSearchChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
          <button 
            type="submit"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-md"
          >
            Tìm
          </button>
        </form>
      </div>

      {/* Nút xóa bộ lọc */}
      {(orderStatusFilter !== 'all' || searchOrderQuery) && onClearFilters && (
        <div className="flex justify-end">
          <button
            onClick={onClearFilters}
            className="text-sm text-pink-600 hover:text-pink-800"
          >
            Xóa bộ lọc
          </button>
        </div>
      )}
    </div>
  );
};

export default OrderFilters; 