import React, { useState } from 'react';
import { FiTrash2, FiCheck, FiTag, FiStar, FiAward, FiAlertTriangle } from 'react-icons/fi';
import { ProductStatus } from './ProductStatusBadge';

interface BulkActionBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkDelete: () => void;
  onBulkSetStatus: (status: ProductStatus) => void;
  onBulkSetFlag: (flag: string, value: boolean) => void;
  disabled?: boolean;
}

const BulkActionBar: React.FC<BulkActionBarProps> = ({
  selectedCount,
  onClearSelection,
  onBulkDelete,
  onBulkSetStatus,
  onBulkSetFlag,
  disabled = false
}) => {
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showFlagMenu, setShowFlagMenu] = useState(false);

  // Đóng tất cả menu khi click ra ngoài
  const closeAllMenus = () => {
    setShowStatusMenu(false);
    setShowFlagMenu(false);
  };

  // Mở/đóng menu trạng thái
  const toggleStatusMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowFlagMenu(false);
    setShowStatusMenu(!showStatusMenu);
  };

  // Mở/đóng menu flag
  const toggleFlagMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowStatusMenu(false);
    setShowFlagMenu(!showFlagMenu);
  };

  // Xử lý khi chọn trạng thái
  const handleStatusSelection = (status: ProductStatus, e: React.MouseEvent) => {
    e.stopPropagation();
    onBulkSetStatus(status);
    setShowStatusMenu(false);
  };

  // Xử lý khi chọn flag
  const handleFlagSelection = (flag: string, value: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    onBulkSetFlag(flag, value);
    setShowFlagMenu(false);
  };

  // Xử lý khi xóa hàng loạt
  const handleDeleteClick = () => {
    // Thông thường sẽ có một modal xác nhận trước khi xóa
    if (window.confirm(`Bạn có chắc chắn muốn xóa ${selectedCount} sản phẩm đã chọn?`)) {
      onBulkDelete();
    }
  };

  if (selectedCount === 0) {
    return null;
  }

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200 p-4 z-10"
      onClick={closeAllMenus}
    >
      <div className="container mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center">
          <span className="bg-pink-100 text-pink-800 text-sm font-semibold px-3 py-1 rounded-full mr-3">
            {selectedCount} sản phẩm đã chọn
          </span>
          <button
            onClick={onClearSelection}
            className="text-sm text-gray-600 hover:text-gray-800"
            disabled={disabled}
          >
            Bỏ chọn tất cả
          </button>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Dropdown thay đổi trạng thái */}
          <div className="relative">
            <button
              onClick={toggleStatusMenu}
              disabled={disabled}
              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center"
            >
              <FiCheck className="mr-1" />
              Thay đổi trạng thái
            </button>
            
            {showStatusMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-20">
                <div className="py-1">
                  <button
                    onClick={(e) => handleStatusSelection('active', e)}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <span className="flex items-center">
                      <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                      Đánh dấu đang bán
                    </span>
                  </button>
                  <button
                    onClick={(e) => handleStatusSelection('out_of_stock', e)}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <span className="flex items-center">
                      <span className="w-2 h-2 rounded-full bg-yellow-500 mr-2"></span>
                      Đánh dấu hết hàng
                    </span>
                  </button>
                  <button
                    onClick={(e) => handleStatusSelection('discontinued', e)}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <span className="flex items-center">
                      <span className="w-2 h-2 rounded-full bg-red-500 mr-2"></span>
                      Đánh dấu ngừng kinh doanh
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Dropdown thay đổi flag */}
          <div className="relative">
            <button
              onClick={toggleFlagMenu}
              disabled={disabled}
              className="px-4 py-2 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500 flex items-center"
            >
              <FiTag className="mr-1" />
              Thay đổi nhãn
            </button>
            
            {showFlagMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-20">
                <div className="py-1">
                  <button
                    onClick={(e) => handleFlagSelection('isBestSeller', true, e)}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <span className="flex items-center">
                      <FiAward className="mr-2 text-orange-500" />
                      Đánh dấu bán chạy
                    </span>
                  </button>
                  <button
                    onClick={(e) => handleFlagSelection('isBestSeller', false, e)}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <span className="flex items-center">
                      <FiAward className="mr-2 text-gray-400" />
                      Bỏ đánh dấu bán chạy
                    </span>
                  </button>
                  <hr className="my-1" />
                  <button
                    onClick={(e) => handleFlagSelection('isNew', true, e)}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <span className="flex items-center">
                      <FiStar className="mr-2 text-blue-500" />
                      Đánh dấu sản phẩm mới
                    </span>
                  </button>
                  <button
                    onClick={(e) => handleFlagSelection('isNew', false, e)}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <span className="flex items-center">
                      <FiStar className="mr-2 text-gray-400" />
                      Bỏ đánh dấu sản phẩm mới
                    </span>
                  </button>
                  <hr className="my-1" />
                  <button
                    onClick={(e) => handleFlagSelection('isOnSale', true, e)}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <span className="flex items-center">
                      <FiTag className="mr-2 text-pink-500" />
                      Đánh dấu giảm giá
                    </span>
                  </button>
                  <button
                    onClick={(e) => handleFlagSelection('isOnSale', false, e)}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <span className="flex items-center">
                      <FiTag className="mr-2 text-gray-400" />
                      Bỏ đánh dấu giảm giá
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Nút xóa hàng loạt */}
          <button
            onClick={handleDeleteClick}
            disabled={disabled}
            className="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 flex items-center"
          >
            <FiTrash2 className="mr-1" />
            Xóa sản phẩm
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkActionBar; 