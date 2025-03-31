import React from 'react';
import { FiShoppingCart, FiTrash2, FiShare2 } from 'react-icons/fi';
import { toast } from 'react-toastify';

interface WishlistSummaryProps {
  itemCount: number;
  onClearAll: () => void;
  onAddAllToCart: () => void;
}

const WishlistSummary: React.FC<WishlistSummaryProps> = ({
  itemCount,
  onClearAll,
  onAddAllToCart
}) => {
  // Xử lý chia sẻ danh sách yêu thích
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Danh sách yêu thích của tôi',
        text: 'Xem danh sách sản phẩm yêu thích của tôi tại YUMIN',
        url: window.location.href,
      })
      .then(() => {
        toast.info('Đã chia sẻ thành công', {
          position: "bottom-right",
          autoClose: 3000,
          theme: "light"
        });
      })
      .catch((error) => {
        console.error('Lỗi khi chia sẻ:', error);
      });
    } else {
      // Fallback cho các trình duyệt không hỗ trợ Web Share API
      navigator.clipboard.writeText(window.location.href)
        .then(() => {
          toast.success('Đã sao chép liên kết vào clipboard', {
            position: "bottom-right",
            autoClose: 3000,
            theme: "light",
            style: { backgroundColor: '#fdf2f8', color: '#db2777', borderLeft: '4px solid #db2777' }
          });
        })
        .catch(() => {
          toast.error('Không thể sao chép liên kết', {
            position: "bottom-right",
            autoClose: 3000,
            theme: "light"
          });
        });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-5 mb-6 border border-gray-100">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-1">Danh sách yêu thích của bạn</h2>
          <div className="flex items-center">
            <span className="text-pink-600 font-medium mr-1">{itemCount}</span>
            <span className="text-gray-600 text-sm">sản phẩm trong danh sách</span>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleShare}
            className="px-4 py-2.5 border border-gray-200 rounded-md text-gray-700 hover:bg-gray-50 flex items-center text-sm transition-colors shadow-sm"
          >
            <FiShare2 className="mr-1.5" />
            Chia sẻ
          </button>
          
          <button
            onClick={onAddAllToCart}
            disabled={itemCount === 0}
            className={`px-4 py-2.5 rounded-md flex items-center text-sm shadow-sm transition-all ${
              itemCount > 0
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:opacity-90'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <FiShoppingCart className="mr-1.5" />
            Thêm tất cả vào giỏ
          </button>
          
          <button
            onClick={onClearAll}
            disabled={itemCount === 0}
            className={`px-4 py-2.5 rounded-md flex items-center text-sm shadow-sm transition-colors ${
              itemCount > 0
                ? 'bg-red-50 text-red-600 hover:bg-red-100'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <FiTrash2 className="mr-1.5" />
            Xóa tất cả
          </button>
        </div>
      </div>
      
      {/* Thêm gạch ngang và thông tin */}
      {itemCount > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="text-xs text-gray-500 flex items-center">
            <span className="inline-block w-2 h-2 rounded-full bg-pink-500 mr-2"></span>
            Nhấp vào sản phẩm để xem chi tiết hoặc sử dụng các nút tương tác để thêm vào giỏ hàng
          </div>
        </div>
      )}
    </div>
  );
};

export default WishlistSummary; 