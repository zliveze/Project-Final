import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FiSearch, FiX, FiClock, FiTrendingUp } from 'react-icons/fi';
import { formatCurrency } from '@/utils/format';
import { useHeader } from '@/contexts/HeaderContext';

// Định nghĩa kiểu dữ liệu cho sản phẩm tìm kiếm
export interface SearchProduct {
  _id: string;
  name: string;
  slug: string;
  price: number;
  currentPrice?: number;
  imageUrl: string;
  brandName?: string;
}

interface SearchResultsProps {
  isVisible: boolean;
  searchTerm: string;
  products: SearchProduct[];
  loading: boolean;
  onClose: () => void;
  onViewAll: () => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

export default function SearchResults({
  isVisible,
  searchTerm,
  products,
  loading,
  onClose,
  onViewAll,
  inputRef
}: SearchResultsProps) {
  const resultsRef = useRef<HTMLDivElement>(null);
  const { popularSearchTerms } = useHeader();
  const [isLoadingMock, setIsLoadingMock] = useState(false);

  // Không cần dữ liệu mockup nữa vì chúng ta sẽ sử dụng dữ liệu thực từ API

  // Log để kiểm tra component được render và các props
  useEffect(() => {
    console.log('SearchResults rendered', { isVisible, searchTerm, loading });

    // Thêm class vào body khi dropdown hiển thị để ngăn scroll
    if (isVisible) {
      document.body.classList.add('search-dropdown-open');
    } else {
      document.body.classList.remove('search-dropdown-open');
    }

    return () => {
      document.body.classList.remove('search-dropdown-open');
    };
  }, [isVisible, searchTerm, loading]);

  // Không cần lọc sản phẩm mockup nữa vì chúng ta sẽ sử dụng dữ liệu thực từ API
  React.useEffect(() => {
    // Chỉ cần xử lý trạng thái loading
    if (searchTerm && searchTerm.length >= 2) {
      setIsLoadingMock(true);
      const timer = setTimeout(() => {
        setIsLoadingMock(false);
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [searchTerm]);

  // Tạo các gợi ý từ khóa tìm kiếm dựa trên từ khóa hiện tại
  const searchSuggestions = React.useMemo(() => {
    if (!searchTerm) return [];

    // Tạo gợi ý từ khóa liên quan đến mỹ phẩm dựa trên từ khóa đã nhập
    const suggestions = [
      `${searchTerm} giá rẻ`,
      `${searchTerm} chính hãng`,
      `${searchTerm} dưỡng da`,
      `${searchTerm} mới nhất`,
      `${searchTerm} mini`,
      `${searchTerm} cho da dầu`,
      `${searchTerm} cho da khô`,
      `${searchTerm} cho da mụn`,
      `${searchTerm} cho da nhạy cảm`,
    ];

    // Lọc bỏ các gợi ý trùng lặp hoặc là từ khóa gốc
    return suggestions.filter(s => s !== searchTerm);
  }, [searchTerm]);

  // Xử lý click bên ngoài để đóng kết quả tìm kiếm
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        resultsRef.current &&
        !resultsRef.current.contains(target) &&
        inputRef?.current &&
        !inputRef.current.contains(target)
      ) {
        onClose();
      }
    }

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isVisible, onClose, inputRef]);

  // Xử lý phím ESC để đóng kết quả tìm kiếm
  useEffect(() => {
    function handleEscKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    if (isVisible) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isVisible, onClose]);

  // Xử lý khi click vào từ khóa gợi ý
  const handleSuggestionClick = (suggestion: string) => {
    // Tự động điều hướng đến trang shop với từ khóa gợi ý
    window.location.href = `/shop?search=${encodeURIComponent(suggestion)}`;
    onClose();
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="w-full mt-2 rounded-md shadow-xl border border-gray-200 bg-white overflow-hidden">
      <div className="p-2 lg:p-3 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center text-gray-600">
          <FiSearch className="mr-1 lg:mr-2 text-pink-500 w-3 h-3 lg:w-4 lg:h-4" />
          <span className="text-xs lg:text-sm">
            {isLoadingMock || loading ? 'Đang tìm kiếm...' : searchTerm ? (
              <>Kết quả cho <span className="font-medium text-pink-600">&quot;{searchTerm}&quot;</span></>
            ) : (
              <>Tìm kiếm phổ biến</>
            )}
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Đóng kết quả tìm kiếm"
        >
          <FiX className="w-3 h-3 lg:w-4 lg:h-4" />
        </button>
      </div>

      {/* Hiển thị từ khóa phổ biến nếu chưa nhập từ khóa hoặc từ khóa quá ngắn */}
      {(!searchTerm || searchTerm.length < 2) && (
        <div className="p-2 lg:p-3 bg-gray-50 border-b border-gray-100">
          <div className="flex items-center gap-1 lg:gap-2 mb-2">
            <FiTrendingUp className="text-gray-400 w-3 h-3 lg:w-4 lg:h-4" />
            <span className="text-xs lg:text-sm font-medium text-gray-700">Tìm kiếm phổ biến</span>
          </div>
          <div className="flex flex-wrap gap-1 lg:gap-2">
            {popularSearchTerms.map((term, index) => (
              <button
                key={`popular-term-${index}`}
                className="px-2 lg:px-3 py-1 lg:py-1.5 bg-white rounded-full border border-gray-200 text-xs lg:text-sm text-gray-700 hover:bg-gray-100 hover:border-gray-300 transition-colors"
                onClick={() => handleSuggestionClick(term)}
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Phần gợi ý từ khóa tìm kiếm */}
      {searchTerm && searchTerm.length >= 2 && searchSuggestions.length > 0 && (
        <div className="p-2 lg:p-3 bg-gray-50 border-b border-gray-100">
          <div className="flex items-center gap-1 lg:gap-2 mb-2">
            <FiClock className="text-gray-400 w-3 h-3 lg:w-4 lg:h-4" />
            <span className="text-xs lg:text-sm font-medium text-gray-700">Gợi ý tìm kiếm</span>
          </div>
          <div className="flex flex-wrap gap-1 lg:gap-2">
            {searchSuggestions.slice(0, 6).map((suggestion, index) => (
              <button
                key={`suggestion-${index}`}
                className="px-2 lg:px-3 py-1 lg:py-1.5 bg-white rounded-full border border-gray-200 text-xs lg:text-sm text-gray-700 hover:bg-gray-100 hover:border-gray-300 transition-colors"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="overflow-y-auto max-h-[60vh] lg:max-h-[70vh]">
        {isLoadingMock || loading ? (
          <div className="flex justify-center items-center py-6 lg:py-8">
            <div className="animate-spin rounded-full h-6 w-6 lg:h-8 lg:w-8 border-b-2 border-pink-500"></div>
          </div>
        ) : searchTerm.length >= 2 && products.length > 0 ? (
          <div>
            {/* Hiển thị kết quả dạng bar thay vì grid */}
            <div className="flex flex-col divide-y divide-gray-100">
              {products.map((product) => (
                <Link
                  key={product._id}
                  href={`/product/${product.slug}`}
                  className="flex items-center p-2 lg:p-3 hover:bg-gray-50 transition-colors"
                  onClick={onClose}
                >
                  <div className="relative w-10 h-10 lg:w-12 lg:h-12 flex-shrink-0 bg-gray-50 rounded-md overflow-hidden">
                    <Image
                      src={product.imageUrl || '/placeholder.png'}
                      alt={product.name}
                      fill
                      sizes="(max-width: 768px) 40px, 48px"
                      className="object-cover"
                    />
                  </div>
                  <div className="ml-2 lg:ml-3 flex-grow min-w-0">
                    <h4 className="text-xs lg:text-sm font-medium text-gray-800 truncate">{product.name}</h4>
                    {product.brandName && (
                      <p className="text-[10px] lg:text-xs text-gray-500 truncate">{product.brandName}</p>
                    )}
                  </div>
                  <div className="ml-2 flex-shrink-0">
                    <span className="text-xs lg:text-sm font-medium text-pink-600">
                      {formatCurrency(product.currentPrice || product.price)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            <div className="p-2 lg:p-3 border-t border-gray-100 text-center">
              <button
                onClick={onViewAll}
                className="text-xs lg:text-sm bg-pink-600 hover:bg-pink-700 text-white py-1.5 lg:py-2 px-3 lg:px-4 rounded-md transition-colors"
              >
                Xem tất cả {products.length} kết quả
              </button>
            </div>
          </div>
        ) : searchTerm.length >= 2 ? (
          <div className="py-6 lg:py-8 px-3 lg:px-4 text-center">
            <div className="text-gray-400 mb-2">
              <FiSearch className="h-6 w-6 lg:h-8 lg:w-8 mx-auto mb-2" />
            </div>
            <p className="text-sm lg:text-base text-gray-600 mb-1">Không tìm thấy sản phẩm nào phù hợp</p>
            <p className="text-xs lg:text-sm text-gray-500">Vui lòng thử lại với từ khóa khác</p>

            {/* Hiển thị các gợi ý từ khóa khi không tìm thấy kết quả */}
            {searchSuggestions.length > 0 && (
              <div className="mt-3 lg:mt-4">
                <p className="text-xs lg:text-sm text-gray-600 mb-2">Bạn có thể thử tìm với:</p>
                <div className="flex flex-wrap justify-center gap-1 lg:gap-2 mt-2">
                  {searchSuggestions.slice(0, 4).map((suggestion, index) => (
                    <button
                      key={`no-result-suggestion-${index}`}
                      className="px-2 lg:px-3 py-1 lg:py-1.5 bg-white rounded-full border border-gray-200 text-xs lg:text-sm text-gray-700 hover:bg-gray-100 hover:border-gray-300 transition-colors"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
