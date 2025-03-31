import React from 'react';
import { FiShoppingBag, FiDollarSign, FiTag, FiPercent } from 'react-icons/fi';

interface WishlistStatsProps {
  totalValue: number;
  savedAmount: number;
  itemCount: number;
  categoryCount: number;
  brandCount: number;
}

const WishlistStats: React.FC<WishlistStatsProps> = ({
  totalValue,
  savedAmount,
  itemCount,
  categoryCount,
  brandCount
}) => {
  // Tính phần trăm tiết kiệm
  const savingPercentage = totalValue > 0 ? Math.round((savedAmount / totalValue) * 100) : 0;

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-3">Thống kê danh sách yêu thích</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Tổng giá trị */}
        <div className="bg-[#fdf2f8] rounded-lg p-3 border border-[#f5d0e3]">
          <div className="flex items-center mb-2">
            <div className="w-8 h-8 rounded-full bg-pink-500 bg-opacity-10 flex items-center justify-center mr-2">
              <FiDollarSign className="w-4 h-4 text-pink-500" />
            </div>
            <span className="text-sm text-gray-600">Tổng giá trị</span>
          </div>
          <div className="text-lg font-semibold text-pink-600">
            {new Intl.NumberFormat('vi-VN').format(totalValue)}đ
          </div>
        </div>
        
        {/* Tiết kiệm */}
        <div className="bg-[#fff9f6] rounded-lg p-3 border border-[#ffede3]">
          <div className="flex items-center mb-2">
            <div className="w-8 h-8 rounded-full bg-orange-500 bg-opacity-10 flex items-center justify-center mr-2">
              <FiPercent className="w-4 h-4 text-orange-500" />
            </div>
            <span className="text-sm text-gray-600">Tiết kiệm</span>
          </div>
          <div className="flex items-center">
            <span className="text-lg font-semibold text-orange-500">
              {new Intl.NumberFormat('vi-VN').format(savedAmount)}đ
            </span>
            <span className="ml-1 text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded">
              -{savingPercentage}%
            </span>
          </div>
        </div>
        
        {/* Số lượng sản phẩm */}
        <div className="bg-[#f6f9ff] rounded-lg p-3 border border-[#e3edff]">
          <div className="flex items-center mb-2">
            <div className="w-8 h-8 rounded-full bg-blue-500 bg-opacity-10 flex items-center justify-center mr-2">
              <FiShoppingBag className="w-4 h-4 text-blue-500" />
            </div>
            <span className="text-sm text-gray-600">Sản phẩm</span>
          </div>
          <div className="text-lg font-semibold text-blue-500">
            {itemCount} <span className="text-xs text-gray-500 font-normal">sản phẩm</span>
          </div>
        </div>
        
        {/* Danh mục & Thương hiệu */}
        <div className="bg-[#f9f6ff] rounded-lg p-3 border border-[#ede3ff]">
          <div className="flex items-center mb-2">
            <div className="w-8 h-8 rounded-full bg-purple-500 bg-opacity-10 flex items-center justify-center mr-2">
              <FiTag className="w-4 h-4 text-purple-500" />
            </div>
            <span className="text-sm text-gray-600">Phân loại</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-purple-500">
              {categoryCount} <span className="text-xs text-gray-500 font-normal">danh mục</span>
            </span>
            <span className="text-sm font-medium text-purple-500">
              {brandCount} <span className="text-xs text-gray-500 font-normal">thương hiệu</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WishlistStats; 