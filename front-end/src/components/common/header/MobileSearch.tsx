import React, { useRef, useEffect } from 'react';
import { FiSearch, FiX, FiArrowLeft } from 'react-icons/fi';
import { useHeader } from '@/contexts/HeaderContext';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency } from '@/utils/format';

interface MobileSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileSearch({ isOpen, onClose }: MobileSearchProps) {
  const {
    searchTerm,
    setSearchTerm,
    performSearch,
    searchResults,
    isSearching,
    handleViewAllResults
  } = useHeader();

  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Focus vào input khi mở tìm kiếm
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Dọn dẹp timeout khi component bị unmount
  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, []);

  // Xử lý khi người dùng nhập vào ô tìm kiếm
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);

    // Debounce tìm kiếm để tránh gọi API quá nhiều
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    if (value.trim()) {
      // Giảm thời gian debounce xuống 200ms để phản hồi nhanh hơn
      searchDebounceRef.current = setTimeout(() => {
        performSearch(value);
      }, 200);
    }
  };

  // Xử lý khi người dùng submit form tìm kiếm
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      // Đảm bảo mã hóa URL đúng cách với từ khóa tiếng Việt
      const encodedTerm = encodeURIComponent(searchTerm.trim());
      console.log('Mobile search với từ khóa:', searchTerm, 'Đã mã hóa:', encodedTerm);

      // Chuyển hướng đến trang shop với tham số tìm kiếm
      router.push(`/shop?search=${encodedTerm}`);
      // Đóng tìm kiếm
      onClose();
    }
  };

  // Xử lý khi người dùng nhấn vào nút xem tất cả
  const handleViewAll = () => {
    handleViewAllResults();
    onClose();
  };

  // Xử lý khi người dùng nhấn vào một sản phẩm
  const handleProductClick = () => {
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-white z-50 flex flex-col"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {/* Header */}
          <div className="p-4 border-b border-gray-100 flex items-center">
            <button
              onClick={onClose}
              className="p-2 -ml-2 text-gray-500 hover:text-gray-700"
              aria-label="Đóng tìm kiếm"
            >
              <FiArrowLeft className="w-5 h-5" />
            </button>
            <form onSubmit={handleSearch} className="flex-grow ml-2">
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Tìm kiếm sản phẩm..."
                  className="w-full pl-10 pr-10 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-500"
                  value={searchTerm}
                  onChange={handleSearchInputChange}
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <FiSearch className="w-4 h-4" />
                </div>
                {searchTerm && (
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setSearchTerm('')}
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Results */}
          <div className="flex-grow overflow-y-auto">
            {isSearching ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
              </div>
            ) : searchResults.length > 0 ? (
              <div>
                <div className="p-4 border-b border-gray-100">
                  <h3 className="text-sm font-medium text-gray-500">
                    Kết quả tìm kiếm cho "{searchTerm}"
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-3 p-3">
                  {searchResults.map((product) => (
                    <div key={product._id} className="bg-white rounded-md shadow-sm hover:shadow-md transition-shadow">
                      <Link
                        href={`/product/${product.slug}`}
                        className="block h-full"
                        onClick={handleProductClick}
                      >
                        <div className="relative pt-[100%] bg-gray-50 rounded-t-md overflow-hidden">
                          <Image
                            src={product.imageUrl || '/placeholder.png'}
                            alt={product.name}
                            fill
                            sizes="50vw"
                            className="object-cover"
                          />
                        </div>
                        <div className="p-2">
                          <h4 className="text-sm font-medium text-gray-800 line-clamp-2 min-h-[2.5rem]">{product.name}</h4>
                          {product.brandName && (
                            <p className="text-xs text-gray-500 mt-1">{product.brandName}</p>
                          )}
                          <div className="flex items-center mt-2">
                            <span className="text-sm font-medium text-pink-600">
                              {formatCurrency(product.currentPrice || product.price)}
                            </span>
                            {product.currentPrice && product.currentPrice < product.price && (
                              <span className="text-xs text-gray-400 line-through ml-2">
                                {formatCurrency(product.price)}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>

                <div className="p-4 border-t border-gray-100">
                  <button
                    onClick={handleViewAll}
                    className="w-full py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-md text-sm font-medium transition-colors"
                  >
                    Xem tất cả {searchResults.length} kết quả
                  </button>
                </div>
              </div>
            ) : searchTerm ? (
              <div className="flex flex-col items-center justify-center h-64 px-4 text-center">
                <div className="text-gray-400 mb-4">
                  <FiSearch className="h-12 w-12 mx-auto mb-2" />
                </div>
                <p className="text-gray-600 mb-2">Không tìm thấy sản phẩm nào phù hợp</p>
                <p className="text-sm text-gray-500">Vui lòng thử lại với từ khóa khác</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 px-4 text-center">
                <div className="text-gray-300 mb-4">
                  <FiSearch className="h-12 w-12 mx-auto mb-2" />
                </div>
                <p className="text-gray-600 mb-2">Nhập từ khóa để tìm kiếm sản phẩm</p>
                <p className="text-sm text-gray-500">Bạn có thể tìm theo tên sản phẩm, thương hiệu...</p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
