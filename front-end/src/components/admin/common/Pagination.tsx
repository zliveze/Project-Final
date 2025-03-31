import React from 'react';
import { FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight } from 'react-icons/fi';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  itemsPerPage?: number;
  showItemsInfo?: boolean;
  className?: string;
  maxVisiblePages?: number;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
  showItemsInfo = true,
  className = '',
  maxVisiblePages = 5
}: PaginationProps) {
  // Tính toán các trang hiển thị
  const getVisiblePages = () => {
    if (totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const halfVisible = Math.floor(maxVisiblePages / 2);
    let startPage = Math.max(currentPage - halfVisible, 1);
    let endPage = Math.min(startPage + maxVisiblePages - 1, totalPages);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(endPage - maxVisiblePages + 1, 1);
    }

    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  };

  // Tính toán thông tin hiển thị số lượng item
  const getItemsInfo = () => {
    if (!totalItems || !itemsPerPage) return null;

    const start = (currentPage - 1) * itemsPerPage + 1;
    const end = Math.min(start + itemsPerPage - 1, totalItems);
    return `${start}-${end} / ${totalItems}`;
  };

  const visiblePages = getVisiblePages();

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0 ${className}`}>
      {showItemsInfo && totalItems && itemsPerPage && (
        <div className="text-sm text-gray-500">
          Hiển thị {getItemsInfo()} mục
        </div>
      )}

      <div className="flex items-center space-x-1">
        {/* Nút về trang đầu tiên */}
        <button
          className={`p-2 rounded-md border border-gray-300 text-sm ${
            currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'
          }`}
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          aria-label="Trang đầu tiên"
        >
          <FiChevronsLeft className="h-4 w-4" />
        </button>

        {/* Nút về trang trước */}
        <button
          className={`p-2 rounded-md border border-gray-300 text-sm ${
            currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'
          }`}
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Trang trước"
        >
          <FiChevronLeft className="h-4 w-4" />
        </button>

        {/* Các nút số trang */}
        {visiblePages.map(page => (
          <button
            key={page}
            className={`px-3 py-2 rounded-md border text-sm ${
              currentPage === page
                ? 'bg-pink-600 text-white border-pink-600'
                : 'border-gray-300 hover:bg-gray-100'
            }`}
            onClick={() => onPageChange(page)}
            aria-label={`Trang ${page}`}
            aria-current={currentPage === page ? 'page' : undefined}
          >
            {page}
          </button>
        ))}

        {/* Nút đến trang sau */}
        <button
          className={`p-2 rounded-md border border-gray-300 text-sm ${
            currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'
          }`}
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Trang sau"
        >
          <FiChevronRight className="h-4 w-4" />
        </button>

        {/* Nút đến trang cuối cùng */}
        <button
          className={`p-2 rounded-md border border-gray-300 text-sm ${
            currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'
          }`}
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          aria-label="Trang cuối cùng"
        >
          <FiChevronsRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
} 