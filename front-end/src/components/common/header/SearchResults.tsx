import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FiSearch, FiX, FiClock, FiTrendingUp } from 'react-icons/fi';
import { motion } from 'framer-motion';
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

  // Dữ liệu mockup cho sản phẩm
  const mockProducts: SearchProduct[] = [
    {
      _id: 'mock1',
      name: 'Son Kem Lì Black Rouge Air Fit Velvet Tint Ver.9',
      slug: 'son-kem-li-black-rouge-air-fit-velvet-tint-ver-9',
      price: 180000,
      currentPrice: 159000,
      imageUrl: '/images/products/son-black-rouge-ver9.jpg',
      brandName: 'Black Rouge',
    },
    {
      _id: 'mock2',
      name: 'Nước Tẩy Trang L\'Oreal Revitalift Hyaluronic Acid Hydrating Micellar Water',
      slug: 'nuoc-tay-trang-loreal-revitalift-hyaluronic-acid',
      price: 250000,
      imageUrl: '/images/products/tay-trang-loreal-ha.jpg',
      brandName: 'L\'Oréal',
    },
    {
      _id: 'mock3',
      name: 'Kem Chống Nắng La Roche-Posay Anthelios UVMune 400 Invisible Fluid SPF50+',
      slug: 'kem-chong-nang-la-roche-posay-anthelios-uvmune-400',
      price: 550000,
      currentPrice: 495000,
      imageUrl: '/images/products/kcn-laroche-posay-uvmune400.jpg',
      brandName: 'La Roche-Posay',
    },
    {
      _id: 'mock4',
      name: 'Serum Klairs Midnight Blue Youth Activating Drop',
      slug: 'serum-klairs-midnight-blue-youth-activating-drop',
      price: 600000,
      imageUrl: '/images/products/serum-klairs-midnight-blue.jpg',
      brandName: 'Klairs',
    },
     {
      _id: 'mock5',
      name: 'Phấn Nước CLIO Kill Cover The New Founwear Cushion SPF50+',
      slug: 'phan-nuoc-clio-kill-cover-the-new-founwear-cushion',
      price: 700000,
      currentPrice: 589000,
      imageUrl: '/images/products/cushion-clio-kill-cover-new.jpg',
      brandName: 'CLIO',
    },
    {
      _id: 'mock6',
      name: 'Mặt Nạ Đất Sét Kiehl\'s Rare Earth Deep Pore Cleansing Masque',
      slug: 'mat-na-dat-set-kiehls-rare-earth',
      price: 850000,
      imageUrl: '/images/products/mat-na-kiehls-rare-earth.jpg',
      brandName: 'Kiehl\'s',
    },
  ];

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

  // Lọc sản phẩm mockup dựa trên searchTerm
  const filteredMockProducts = React.useMemo(() => {
    if (!searchTerm || searchTerm.length < 2) return [];
    
    console.log('Filtering products with term:', searchTerm);
    setIsLoadingMock(true);
    
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    
    // Giả lập độ trễ mạng
    const timer = setTimeout(() => {
      setIsLoadingMock(false);
    }, 300);

    // Thực hiện lọc
    const results = mockProducts.filter(product =>
      product.name.toLowerCase().includes(lowerCaseSearchTerm) ||
      (product.brandName && product.brandName.toLowerCase().includes(lowerCaseSearchTerm))
    );

    console.log('Filtered results:', results);

    return results;
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
      <div className="p-3 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center text-gray-600">
          <FiSearch className="mr-2 text-pink-500" />
          <span className="text-sm">
            {isLoadingMock || loading ? 'Đang tìm kiếm...' : searchTerm ? ( 
              <>Kết quả tìm kiếm cho <span className="font-medium text-pink-600">"{searchTerm}"</span></>
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
          <FiX />
        </button>
      </div>

      {/* Hiển thị từ khóa phổ biến nếu chưa nhập từ khóa hoặc từ khóa quá ngắn */}
      {(!searchTerm || searchTerm.length < 2) && (
        <div className="p-3 bg-gray-50 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <FiTrendingUp className="text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Tìm kiếm phổ biến</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {popularSearchTerms.map((term, index) => (
              <button
                key={`popular-term-${index}`}
                className="px-3 py-1.5 bg-white rounded-full border border-gray-200 text-sm text-gray-700 hover:bg-gray-100 hover:border-gray-300 transition-colors"
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
        <div className="p-3 bg-gray-50 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <FiClock className="text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Gợi ý tìm kiếm</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {searchSuggestions.map((suggestion, index) => (
              <button
                key={`suggestion-${index}`}
                className="px-3 py-1.5 bg-white rounded-full border border-gray-200 text-sm text-gray-700 hover:bg-gray-100 hover:border-gray-300 transition-colors"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="overflow-y-auto max-h-[70vh]">
        {isLoadingMock || loading ? ( 
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
          </div>
        ) : searchTerm.length >= 2 && (products.length > 0 || filteredMockProducts.length > 0) ? ( 
          <div>
            {/* Hiển thị kết quả dạng grid thay vì list */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3">
              {/* Ưu tiên hiển thị sản phẩm thật từ API */}
              {products.length > 0 ? (
                products.map((product) => (
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
                ))
              ) : (
                // Hiển thị sản phẩm mockup khi không có sản phẩm thật
                filteredMockProducts.map((product) => (
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
                ))
              )}
            </div>

            <div className="p-3 border-t border-gray-100 text-center">
              <button
                onClick={onViewAll}
                className="text-sm bg-pink-600 hover:bg-pink-700 text-white py-2 px-4 rounded-md transition-colors"
              >
                Xem tất cả {products.length > 0 ? products.length : filteredMockProducts.length} kết quả
              </button>
            </div>
          </div>
        ) : searchTerm.length >= 2 ? (
          <div className="py-8 px-4 text-center">
            <div className="text-gray-400 mb-2">
              <FiSearch className="h-8 w-8 mx-auto mb-2" />
            </div>
            <p className="text-gray-600 mb-1">Không tìm thấy sản phẩm nào phù hợp</p>
            <p className="text-sm text-gray-500">Vui lòng thử lại với từ khóa khác</p>
            
            {/* Hiển thị các gợi ý từ khóa khi không tìm thấy kết quả */}
            {searchSuggestions.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-2">Bạn có thể thử tìm với:</p>
                <div className="flex flex-wrap justify-center gap-2 mt-2">
                  {searchSuggestions.map((suggestion, index) => (
                    <button
                      key={`no-result-suggestion-${index}`}
                      className="px-3 py-1.5 bg-white rounded-full border border-gray-200 text-sm text-gray-700 hover:bg-gray-100 hover:border-gray-300 transition-colors"
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
