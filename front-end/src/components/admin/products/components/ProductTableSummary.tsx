import React from 'react';
import { FiPackage, FiCheck, FiAlertCircle, FiXCircle } from 'react-icons/fi';

interface ProductTableSummaryProps {
  totalItems: number;
  totalActive: number;
  totalOutOfStock: number;
  totalDiscontinued: number;
  filteredItems: number;
  loading?: boolean;
}

const ProductTableSummary: React.FC<ProductTableSummaryProps> = ({
  totalItems,
  totalActive,
  totalOutOfStock,
  totalDiscontinued,
  filteredItems,
  loading = false
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
      <div className={`bg-white p-4 rounded-lg shadow border-l-4 border-gray-400 flex items-center ${loading ? 'opacity-50' : ''}`}>
        <div className="bg-gray-100 p-3 rounded-full mr-4">
          <FiPackage className="h-6 w-6 text-gray-500" />
        </div>
        <div>
          <p className="text-gray-500 text-sm">Tất cả sản phẩm</p>
          <p className="text-2xl font-semibold text-gray-800">{loading ? '-' : totalItems}</p>
          {filteredItems !== totalItems && !loading && (
            <p className="text-xs text-pink-600 mt-1">
              Đang hiển thị {filteredItems} sản phẩm
            </p>
          )}
        </div>
      </div>
      
      <div className={`bg-white p-4 rounded-lg shadow border-l-4 border-green-400 flex items-center ${loading ? 'opacity-50' : ''}`}>
        <div className="bg-green-100 p-3 rounded-full mr-4">
          <FiCheck className="h-6 w-6 text-green-500" />
        </div>
        <div>
          <p className="text-gray-500 text-sm">Đang bán</p>
          <p className="text-2xl font-semibold text-gray-800">{loading ? '-' : totalActive}</p>
          <p className="text-xs text-gray-500 mt-1">
            {!loading && Math.round((totalActive / totalItems) * 100)}% tổng số
          </p>
        </div>
      </div>
      
      <div className={`bg-white p-4 rounded-lg shadow border-l-4 border-yellow-400 flex items-center ${loading ? 'opacity-50' : ''}`}>
        <div className="bg-yellow-100 p-3 rounded-full mr-4">
          <FiAlertCircle className="h-6 w-6 text-yellow-500" />
        </div>
        <div>
          <p className="text-gray-500 text-sm">Hết hàng</p>
          <p className="text-2xl font-semibold text-gray-800">{loading ? '-' : totalOutOfStock}</p>
          <p className="text-xs text-gray-500 mt-1">
            {!loading && Math.round((totalOutOfStock / totalItems) * 100)}% tổng số
          </p>
        </div>
      </div>
      
      <div className={`bg-white p-4 rounded-lg shadow border-l-4 border-red-400 flex items-center ${loading ? 'opacity-50' : ''}`}>
        <div className="bg-red-100 p-3 rounded-full mr-4">
          <FiXCircle className="h-6 w-6 text-red-500" />
        </div>
        <div>
          <p className="text-gray-500 text-sm">Ngừng kinh doanh</p>
          <p className="text-2xl font-semibold text-gray-800">{loading ? '-' : totalDiscontinued}</p>
          <p className="text-xs text-gray-500 mt-1">
            {!loading && Math.round((totalDiscontinued / totalItems) * 100)}% tổng số
          </p>
        </div>
      </div>
      
      <div className="bg-gradient-to-r from-pink-500 to-purple-500 p-4 rounded-lg shadow text-white flex flex-col justify-center">
        <h3 className="font-semibold">Quản lý sản phẩm</h3>
        <p className="text-sm opacity-90 mt-1">Xem và quản lý toàn bộ sản phẩm của bạn</p>
        <div className="mt-auto pt-2">
          <button 
            className="px-3 py-1 bg-white text-pink-600 rounded-md text-sm font-medium hover:bg-gray-100 transition-colors"
            onClick={() => window.scrollTo(0, 0)}
          >
            Đi tới đầu trang
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductTableSummary; 