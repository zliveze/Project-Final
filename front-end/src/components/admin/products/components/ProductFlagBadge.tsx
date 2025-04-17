import React from 'react';
import { FiStar, FiGift, FiTag, FiAward } from 'react-icons/fi';

interface FlagBadgeProps {
  type: 'bestSeller' | 'new' | 'sale' | 'gift';
  small?: boolean;
}

const ProductFlagBadge: React.FC<FlagBadgeProps> = ({ type, small = false }) => {
  // Xác định style, text và icon dựa trên loại flag
  const getFlagDetails = (flagType: string) => {
    switch (flagType) {
      case 'bestSeller':
        return {
          color: 'bg-orange-100 text-orange-800 border-orange-200 shadow-sm',
          text: 'Bán chạy',
          icon: <FiAward className={small ? 'w-2.5 h-2.5 mr-0.5' : 'w-3.5 h-3.5 mr-1'} />
        };
      case 'new':
        return {
          color: 'bg-blue-100 text-blue-800 border-blue-200 shadow-sm',
          text: 'Mới',
          icon: <FiStar className={small ? 'w-2.5 h-2.5 mr-0.5' : 'w-3.5 h-3.5 mr-1'} />
        };
      case 'sale':
        return {
          color: 'bg-pink-100 text-pink-800 border-pink-200 shadow-sm',
          text: 'Giảm giá',
          icon: <FiTag className={small ? 'w-2.5 h-2.5 mr-0.5' : 'w-3.5 h-3.5 mr-1'} />
        };
      case 'gift':
        return {
          color: 'bg-purple-100 text-purple-800 border-purple-200 shadow-sm',
          text: 'Có quà tặng',
          icon: <FiGift className={small ? 'w-2.5 h-2.5 mr-0.5' : 'w-3.5 h-3.5 mr-1'} />
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-200 shadow-sm',
          text: 'Không xác định',
          icon: null
        };
    }
  };

  const { color, text, icon } = getFlagDetails(type);
  const sizeClass = small ? 'text-xs py-0.5 px-1.5' : 'text-xs py-1 px-2.5';

  return (
    <span className={`inline-flex items-center font-medium rounded-full border transition-all duration-200 ${sizeClass} ${color}`}>
      {icon}
      {text}
    </span>
  );
};

export default ProductFlagBadge;