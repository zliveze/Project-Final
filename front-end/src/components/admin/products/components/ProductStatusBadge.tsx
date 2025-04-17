import React from 'react';
import { FiCheckCircle, FiAlertCircle, FiXCircle } from 'react-icons/fi';

export type ProductStatus = 'active' | 'out_of_stock' | 'discontinued';

interface ProductStatusBadgeProps {
  status: ProductStatus;
}

const ProductStatusBadge: React.FC<ProductStatusBadgeProps> = ({ status }) => {
  // Xác định style, text và icon dựa trên trạng thái
  const getStatusDetails = (status: ProductStatus) => {
    switch (status) {
      case 'active':
        return {
          color: 'bg-green-100 text-green-800 border-green-200 shadow-sm',
          text: 'Đang bán',
          icon: <FiCheckCircle className="w-3.5 h-3.5 mr-1" />
        };
      case 'out_of_stock':
        return {
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200 shadow-sm',
          text: 'Hết hàng',
          icon: <FiAlertCircle className="w-3.5 h-3.5 mr-1" />
        };
      case 'discontinued':
        return {
          color: 'bg-red-100 text-red-800 border-red-200 shadow-sm',
          text: 'Ngừng kinh doanh',
          icon: <FiXCircle className="w-3.5 h-3.5 mr-1" />
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-200 shadow-sm',
          text: 'Không xác định',
          icon: null
        };
    }
  };

  const { color, text, icon } = getStatusDetails(status);

  return (
    <span className={`px-2.5 py-1 inline-flex items-center text-xs leading-5 font-medium rounded-full border transition-all duration-200 ${color}`}>
      {icon}
      {text}
    </span>
  );
};

export default ProductStatusBadge;