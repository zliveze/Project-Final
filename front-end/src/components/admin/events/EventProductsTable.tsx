import React, { useState, useEffect, useCallback } from 'react';
import { FiTrash2 } from 'react-icons/fi';
import { format } from 'date-fns';

// Định nghĩa kiểu dữ liệu cho props
interface EventProductsTableProps {
  products: {
    productId: string;
    variantId?: string;
    adjustedPrice: number;
    name?: string;
    image?: string;
    originalPrice?: number;
  }[];
  onRemoveProduct: (productId: string) => void;
  onPriceChange: (productId: string, newPrice: number) => void;
}

// Sản phẩm mẫu (để hiển thị khi chưa có data)
const sampleProducts = [
  {
    productId: 'prod1',
    name: 'Sữa Rửa Mặt CeraVe Sạch Sâu Cho Da Thường Đến Da Dầu',
    image: '/images/sample-product.jpg',
    originalPrice: 475000,
    adjustedPrice: 336000,
  },
  {
    productId: 'prod2',
    name: 'Nước Hoa Hồng Klairs Không Mùi Cho Da Nhạy Cảm 180ml',
    image: '/images/sample-product.jpg',
    originalPrice: 435000,
    adjustedPrice: 208000,
  }
];

const EventProductsTable: React.FC<EventProductsTableProps> = ({
  products = [],
  onRemoveProduct,
  onPriceChange
}) => {
  // State lưu trữ giá trị người dùng nhập
  const [localPrices, setLocalPrices] = useState<{[key: string]: number}>({});

  // Chỉ khởi tạo giá khi lần đầu mounted, KHÔNG cập nhật khi props thay đổi
  // Điều này giúp giữ nguyên giá người dùng đã nhập
  useEffect(() => {
    // Khởi tạo giá trị ban đầu chỉ một lần khi component mount
    // và chỉ khởi tạo cho sản phẩm chưa có trong localPrices
    const initialPrices: {[key: string]: number} = { ...localPrices };
    let hasNewProducts = false;

    products.forEach(product => {
      if (localPrices[product.productId] === undefined) {
        initialPrices[product.productId] = product.adjustedPrice;
        hasNewProducts = true;
      }
    });

    // Chỉ cập nhật state nếu có sản phẩm mới
    if (hasNewProducts) {
      setLocalPrices(initialPrices);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Chỉ chạy khi mount, không phụ thuộc vào products

  // Thêm useEffect mới để khởi tạo giá cho sản phẩm mới
  useEffect(() => {
    // Chỉ khởi tạo giá cho sản phẩm mới thêm vào mà chưa có trong localPrices
    const newProductsPrice: {[key: string]: number} = {};
    let hasNewProducts = false;

    products.forEach(product => {
      if (localPrices[product.productId] === undefined) {
        newProductsPrice[product.productId] = product.adjustedPrice;
        hasNewProducts = true;
      }
    });

    // Chỉ cập nhật state nếu có sản phẩm mới
    if (hasNewProducts) {
      setLocalPrices(prev => ({
        ...prev,
        ...newProductsPrice
      }));
    }
  }, [products, localPrices]);

  // Tính toán % giảm giá
  const calculateDiscount = (originalPrice: number, adjustedPrice: number) => {
    if (!originalPrice || originalPrice <= 0) return 0;
    return Math.round(((originalPrice - adjustedPrice) / originalPrice) * 100);
  };

  // Hiển thị sản phẩm từ props
  const displayProducts = products.length > 0
    ? products
    : [];

  // Hàm xử lý khi giá thay đổi
  const handlePriceChange = useCallback((productId: string, newPrice: number) => {
    // Cập nhật giá trong state local
    setLocalPrices(prev => ({
      ...prev,
      [productId]: newPrice
    }));

    // Gọi onPriceChange để cập nhật state ở component cha
    onPriceChange(productId, newPrice);
  }, [onPriceChange]);

  return (
    <div className="bg-white overflow-hidden border border-gray-100 rounded-xl shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-pink-50">
            <tr>
              <th scope="col" className="px-5 py-3.5 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                Sản phẩm
              </th>
              <th scope="col" className="px-5 py-3.5 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                Giá gốc
              </th>
              <th scope="col" className="px-5 py-3.5 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                Giá khuyến mãi
              </th>
              <th scope="col" className="px-5 py-3.5 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                Giảm giá
              </th>
              <th scope="col" className="px-5 py-3.5 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                Hành động
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {displayProducts.length > 0 ? (
              displayProducts.map((product) => {
                // Lấy giá hiển thị từ state local hoặc từ props nếu chưa có trong state
                // Ưu tiên giá người dùng đã nhập (trong localPrices)
                const displayPrice = localPrices[product.productId] !== undefined
                  ? localPrices[product.productId]
                  : product.adjustedPrice;

                return (
                  <tr key={product.productId + (product.variantId || '')} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {product.image ? (
                          <div className="flex-shrink-0 h-14 w-14 border border-gray-100 rounded-lg overflow-hidden shadow-sm">
                            <img
                              className="h-14 w-14 object-cover"
                              src={product.image}
                              alt={product.name || 'Product'}
                            />
                          </div>
                        ) : (
                          <div className="flex-shrink-0 h-14 w-14 border border-gray-100 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center shadow-sm">
                            <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                        <div className="ml-4 max-w-xs">
                          <div className="text-sm font-medium text-gray-800 line-clamp-2">
                            {product.name || `Sản phẩm ID: ${product.productId}`}
                          </div>
                          {product.variantId && (
                            <div className="text-xs text-gray-500 mt-1">
                              Variant ID: {product.variantId.substring(0, 8)}...
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-700">
                        {product.originalPrice
                          ? new Intl.NumberFormat('vi-VN').format(product.originalPrice) + ' ₫'
                          : 'N/A'}
                      </div>
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="relative">
                          <input
                            type="number"
                            value={displayPrice}
                            onChange={(e) => {
                              const value = parseInt(e.target.value);
                              if (!isNaN(value) && value >= 0) {
                                // Cập nhật giá trong state local
                                handlePriceChange(product.productId, value);
                              }
                            }}
                            min="0"
                            step="1000"
                            className="w-32 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors duration-150 shadow-sm"
                          />
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <span className="text-gray-400 text-xs">₫</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap">
                      {product.originalPrice ? (
                        <span className={`px-3 py-1.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          calculateDiscount(product.originalPrice, displayPrice) >= 30 ? 'bg-pink-100 text-pink-800' :
                          calculateDiscount(product.originalPrice, displayPrice) >= 15 ? 'bg-pink-50 text-pink-700' :
                          'bg-green-50 text-green-700'
                        }`}>
                          -{calculateDiscount(product.originalPrice, displayPrice)}%
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500">N/A</span>
                      )}
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => onRemoveProduct(product.productId)}
                        className="text-gray-400 hover:text-pink-500 focus:outline-none transition-colors duration-150 p-2 rounded-full hover:bg-pink-50"
                        title="Xóa sản phẩm khỏi sự kiện"
                      >
                        <FiTrash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-sm text-gray-500">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="bg-pink-50 p-3 rounded-full">
                      <svg className="h-10 w-10 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                    </div>
                    <p className="text-gray-600 font-medium">Chưa có sản phẩm nào trong sự kiện</p>
                    <p className="text-pink-600">Nhấn nút "Thêm sản phẩm" để bắt đầu</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EventProductsTable;