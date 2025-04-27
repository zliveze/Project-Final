import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FiSearch, FiX } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency } from '@/utils/format';

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
}

export default function SearchResults({
  isVisible,
  searchTerm,
  products,
  loading,
  onClose,
  onViewAll
}: SearchResultsProps) {
  const resultsRef = useRef<HTMLDivElement>(null);

  // Xử lý click bên ngoài để đóng kết quả tìm kiếm
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (resultsRef.current && !resultsRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isVisible, onClose]);

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

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-x-0 top-[60px] md:absolute md:top-full md:left-0 md:right-0 mt-1 bg-white rounded-md shadow-xl border border-gray-200 z-50 max-h-[85vh] overflow-hidden"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          ref={resultsRef}
        >
          <div className="p-3 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center text-gray-600">
              <FiSearch className="mr-2 text-pink-500" />
              <span className="text-sm">
                {loading ? 'Đang tìm kiếm...' : (
                  <>Kết quả tìm kiếm cho <span className="font-medium text-pink-600">"{searchTerm}"</span></>
                )}
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Đóng kết quả tìm kiếm"
            >
              <FiX />
            </button>
          </div>

          <div className="overflow-y-auto max-h-[70vh]">
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
              </div>
            ) : products.length > 0 ? (
              <div>
                {/* Hiển thị kết quả dạng grid thay vì list */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3">
                  {products.map((product) => (
                    <div key={product._id} className="bg-white rounded-md shadow-sm hover:shadow-md transition-shadow">
                      <Link
                        href={`/product/${product.slug}`}
                        className="block h-full"
                        onClick={onClose}
                      >
                        <div className="relative pt-[100%] bg-gray-50 rounded-t-md overflow-hidden">
                          <Image
                            src={product.imageUrl || '/placeholder.png'}
                            alt={product.name}
                            fill
                            sizes="(max-width: 640px) 50vw, 33vw"
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

                <div className="p-3 border-t border-gray-100 text-center">
                  <button
                    onClick={onViewAll}
                    className="text-sm bg-pink-600 hover:bg-pink-700 text-white py-2 px-4 rounded-md transition-colors"
                  >
                    Xem tất cả {products.length} kết quả
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-8 px-4 text-center">
                <div className="text-gray-400 mb-2">
                  <FiSearch className="h-8 w-8 mx-auto mb-2" />
                </div>
                <p className="text-gray-600 mb-1">Không tìm thấy sản phẩm nào phù hợp</p>
                <p className="text-sm text-gray-500">Vui lòng thử lại với từ khóa khác</p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
