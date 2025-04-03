import React, { useState, useRef, useEffect } from 'react';
import { FiTrash2, FiTag, FiCheckCircle, FiAlertCircle, FiXCircle, FiChevronDown, FiFlag, FiStar, FiGift } from 'react-icons/fi';
import { ProductStatus } from './ProductStatusBadge';

// Hook để xử lý click bên ngoài
const useOnClickOutside = (ref: React.RefObject<HTMLDivElement | null>, handler: () => void) => {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      handler();
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
};

interface BulkActionBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkDelete: () => Promise<boolean>;
  onBulkSetStatus: (status: ProductStatus) => Promise<boolean>;
  onBulkSetFlag: (flag: string, value: boolean) => Promise<boolean>;
  disabled?: boolean;
}

/**
 * Component thanh công cụ cho các thao tác hàng loạt với sản phẩm
 */
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
  const [isProcessing, setIsProcessing] = useState(false);
  
  const statusMenuRef = useRef<HTMLDivElement>(null);
  const flagMenuRef = useRef<HTMLDivElement>(null);
  
  // Đóng menu khi click bên ngoài
  useOnClickOutside(statusMenuRef, () => setShowStatusMenu(false));
  useOnClickOutside(flagMenuRef, () => setShowFlagMenu(false));

  /**
   * Đóng tất cả các menu
   */
  const closeAllMenus = () => {
    setShowStatusMenu(false);
    setShowFlagMenu(false);
  };

  /**
   * Mở/đóng menu trạng thái
   */
  const toggleStatusMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowFlagMenu(false);
    setShowStatusMenu(prev => !prev);
  };

  /**
   * Mở/đóng menu cờ đánh dấu
   */
  const toggleFlagMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowStatusMenu(false);
    setShowFlagMenu(prev => !prev);
  };

  /**
   * Xử lý khi chọn trạng thái
   */
  const handleStatusSelection = async (status: ProductStatus, e: React.MouseEvent) => {
    e.stopPropagation();
    closeAllMenus();
    
    setIsProcessing(true);
    try {
      const success = await onBulkSetStatus(status);
      if (success) {
        console.log(`Đã cập nhật ${selectedCount} sản phẩm thành trạng thái: ${status}`);
      }
    } catch (error) {
      console.error('Lỗi khi cập nhật trạng thái hàng loạt:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Xử lý khi chọn cờ đánh dấu
   */
  const handleFlagSelection = async (flag: string, value: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    closeAllMenus();
    
    setIsProcessing(true);
    try {
      const success = await onBulkSetFlag(flag, value);
      if (success) {
        console.log(`Đã ${value ? 'bật' : 'tắt'} cờ ${flag} cho ${selectedCount} sản phẩm`);
      }
    } catch (error) {
      console.error('Lỗi khi cập nhật cờ đánh dấu hàng loạt:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Xử lý khi click nút xóa
   */
  const handleDeleteClick = async () => {
    if (selectedCount === 0 || disabled || isProcessing) return;
    
    if (window.confirm(`Bạn có chắc chắn muốn xóa ${selectedCount} sản phẩm đã chọn không?`)) {
      setIsProcessing(true);
      try {
        const success = await onBulkDelete();
        if (success) {
          console.log(`Đã xóa ${selectedCount} sản phẩm`);
        }
      } catch (error) {
        console.error('Lỗi khi xóa sản phẩm hàng loạt:', error);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  // Nếu không có sản phẩm nào được chọn, không hiển thị thanh công cụ
  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg z-50">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center">
          <span className="text-sm font-medium text-gray-700 mr-4">
            Đã chọn {selectedCount} sản phẩm
          </span>
          <button
            type="button"
            onClick={onClearSelection}
            className="text-sm text-gray-600 hover:text-gray-900"
            disabled={disabled || isProcessing}
          >
            Bỏ chọn tất cả
          </button>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Nút Thay đổi trạng thái */}
          <div className="relative" ref={statusMenuRef}>
            <button
              type="button"
              onClick={toggleStatusMenu}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50"
              disabled={disabled || isProcessing}
            >
              <FiTag className="-ml-0.5 mr-2 h-4 w-4" />
              Thay đổi trạng thái
              <FiChevronDown className="ml-2 h-4 w-4" />
            </button>
            
            {showStatusMenu && (
              <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                <div className="py-1" role="menu" aria-orientation="vertical">
                  <button
                    type="button"
                    className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={(e) => handleStatusSelection('active', e)}
                  >
                    <FiCheckCircle className="mr-3 h-5 w-5 text-green-500" />
                    Đang bán
                  </button>
                  <button
                    type="button"
                    className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={(e) => handleStatusSelection('out_of_stock', e)}
                  >
                    <FiAlertCircle className="mr-3 h-5 w-5 text-yellow-500" />
                    Hết hàng
                  </button>
                  <button
                    type="button"
                    className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={(e) => handleStatusSelection('discontinued', e)}
                  >
                    <FiXCircle className="mr-3 h-5 w-5 text-red-500" />
                    Ngừng kinh doanh
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Nút Đánh dấu */}
          <div className="relative" ref={flagMenuRef}>
            <button
              type="button"
              onClick={toggleFlagMenu}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50"
              disabled={disabled || isProcessing}
            >
              <FiFlag className="-ml-0.5 mr-2 h-4 w-4" />
              Đánh dấu
              <FiChevronDown className="ml-2 h-4 w-4" />
            </button>
            
            {showFlagMenu && (
              <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                <div className="py-1" role="menu" aria-orientation="vertical">
                  <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bật cờ
                  </div>
                  <button
                    type="button"
                    className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={(e) => handleFlagSelection('isBestSeller', true, e)}
                  >
                    <FiStar className="mr-3 h-5 w-5 text-orange-500" />
                    Bán chạy
                  </button>
                  <button
                    type="button"
                    className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={(e) => handleFlagSelection('isNew', true, e)}
                  >
                    <FiTag className="mr-3 h-5 w-5 text-blue-500" />
                    Mới
                  </button>
                  <button
                    type="button"
                    className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={(e) => handleFlagSelection('isOnSale', true, e)}
                  >
                    <FiTag className="mr-3 h-5 w-5 text-pink-500" />
                    Giảm giá
                  </button>
                  <button
                    type="button"
                    className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={(e) => handleFlagSelection('hasGifts', true, e)}
                  >
                    <FiGift className="mr-3 h-5 w-5 text-purple-500" />
                    Có quà tặng
                  </button>
                  
                  <div className="border-t border-gray-100 my-1"></div>
                  
                  <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tắt cờ
                  </div>
                  <button
                    type="button"
                    className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={(e) => handleFlagSelection('isBestSeller', false, e)}
                  >
                    <FiStar className="mr-3 h-5 w-5 text-gray-400" />
                    Bỏ đánh dấu bán chạy
                  </button>
                  <button
                    type="button"
                    className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={(e) => handleFlagSelection('isNew', false, e)}
                  >
                    <FiTag className="mr-3 h-5 w-5 text-gray-400" />
                    Bỏ đánh dấu mới
                  </button>
                  <button
                    type="button"
                    className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={(e) => handleFlagSelection('isOnSale', false, e)}
                  >
                    <FiTag className="mr-3 h-5 w-5 text-gray-400" />
                    Bỏ đánh dấu giảm giá
                  </button>
                  <button
                    type="button"
                    className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={(e) => handleFlagSelection('hasGifts', false, e)}
                  >
                    <FiGift className="mr-3 h-5 w-5 text-gray-400" />
                    Bỏ đánh dấu có quà tặng
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Nút Xóa */}
          <button
            type="button"
            onClick={handleDeleteClick}
            className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
            disabled={disabled || isProcessing}
          >
            <FiTrash2 className="-ml-0.5 mr-2 h-4 w-4" />
            Xóa
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkActionBar;