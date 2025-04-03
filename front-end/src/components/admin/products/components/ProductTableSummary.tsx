import React, { useEffect } from 'react';
import { FiPackage, FiCheck, FiAlertCircle, FiXCircle } from 'react-icons/fi';
import { useApiStats } from '@/hooks/useApiStats';

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
  // Sử dụng hook useApiStats thay vì useProduct
  const { statistics, fetchStatistics, loading: statsLoading } = useApiStats();

  // Fetch statistics when component mounts
  useEffect(() => {
    if (!statistics) {
      fetchStatistics();
    }
  }, [statistics, fetchStatistics]);

  // Combine data - prefer statistics from API if available
  const totalCount = statistics?.total || totalItems;
  const activeCount = statistics?.active || totalActive;
  const outOfStockCount = statistics?.outOfStock || totalOutOfStock;
  const discontinuedCount = statistics?.discontinued || totalDiscontinued;
  const isLoading = loading || statsLoading;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className={`bg-white p-4 rounded-lg shadow border-l-4 border-gray-400 flex items-center ${isLoading ? 'opacity-50' : ''}`}>
        <div className="bg-gray-100 p-3 rounded-full mr-4">
          <FiPackage className="h-6 w-6 text-gray-500" />
        </div>
        <div>
          <p className="text-gray-500 text-sm">Tất cả sản phẩm</p>
          <p className="text-2xl font-semibold text-gray-800">{isLoading ? '-' : totalCount}</p>
          {filteredItems !== totalCount && !isLoading && (
            <p className="text-xs text-pink-600 mt-1">
              Đang hiển thị {filteredItems} sản phẩm
            </p>
          )}
        </div>
      </div>

      <div className={`bg-white p-4 rounded-lg shadow border-l-4 border-green-400 flex items-center ${isLoading ? 'opacity-50' : ''}`}>
        <div className="bg-green-100 p-3 rounded-full mr-4">
          <FiCheck className="h-6 w-6 text-green-500" />
        </div>
        <div>
          <p className="text-gray-500 text-sm">Đang bán</p>
          <p className="text-2xl font-semibold text-gray-800">{isLoading ? '-' : activeCount}</p>
          <p className="text-xs text-gray-500 mt-1">
            {!isLoading && totalCount > 0 && Math.round((activeCount / totalCount) * 100)}% tổng số
          </p>
        </div>
      </div>

      <div className={`bg-white p-4 rounded-lg shadow border-l-4 border-yellow-400 flex items-center ${isLoading ? 'opacity-50' : ''}`}>
        <div className="bg-yellow-100 p-3 rounded-full mr-4">
          <FiAlertCircle className="h-6 w-6 text-yellow-500" />
        </div>
        <div>
          <p className="text-gray-500 text-sm">Hết hàng</p>
          <p className="text-2xl font-semibold text-gray-800">{isLoading ? '-' : outOfStockCount}</p>
          <p className="text-xs text-gray-500 mt-1">
            {!isLoading && totalCount > 0 && Math.round((outOfStockCount / totalCount) * 100)}% tổng số
          </p>
        </div>
      </div>

      <div className={`bg-white p-4 rounded-lg shadow border-l-4 border-red-400 flex items-center ${isLoading ? 'opacity-50' : ''}`}>
        <div className="bg-red-100 p-3 rounded-full mr-4">
          <FiXCircle className="h-6 w-6 text-red-500" />
        </div>
        <div>
          <p className="text-gray-500 text-sm">Ngừng kinh doanh</p>
          <p className="text-2xl font-semibold text-gray-800">{isLoading ? '-' : discontinuedCount}</p>
          <p className="text-xs text-gray-500 mt-1">
            {!isLoading && totalCount > 0 && Math.round((discontinuedCount / totalCount) * 100)}% tổng số
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProductTableSummary;