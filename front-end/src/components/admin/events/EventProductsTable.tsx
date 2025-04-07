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
    <div className="bg-white overflow-hidden border border-gray-200 rounded-md">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sản phẩm
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Giá gốc
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Giá khuyến mãi
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Giảm giá
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Hành động
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {displayProducts.length > 0 ? (
              displayProducts.map((product) => {
                // Lấy giá hiển thị từ state local hoặc từ props nếu chưa có trong state
                // Ưu tiên giá người dùng đã nhập (trong localPrices)
                const displayPrice = localPrices[product.productId] !== undefined 
                  ? localPrices[product.productId] 
                  : product.adjustedPrice;
                
                return (
                  <tr key={product.productId + (product.variantId || '')} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        {product.image && (
                          <div className="flex-shrink-0 h-10 w-10 mr-3">
                            <img 
                              className="h-10 w-10 rounded-md object-cover" 
                              src={product.image} 
                              alt={product.name || 'Product'} 
                            />
                          </div>
                        )}
                        <div className="max-w-xs truncate">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {product.name || `Sản phẩm ID: ${product.productId}`}
                          </div>
                          {product.variantId && (
                            <div className="text-xs text-gray-500">
                              Variant ID: {product.variantId}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {product.originalPrice 
                        ? new Intl.NumberFormat('vi-VN').format(product.originalPrice) + ' ₫'
                        : 'N/A'}
                    </td>
                    
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
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
                          className="w-24 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-pink-500"
                        />
                      </div>
                    </td>
                    
                    <td className="px-4 py-3 whitespace-nowrap">
                      {product.originalPrice ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          -{calculateDiscount(product.originalPrice, displayPrice)}%
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500">N/A</span>
                      )}
                    </td>
                    
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => onRemoveProduct(product.productId)}
                        className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-50"
                      >
                        <FiTrash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-4 text-center text-sm text-gray-500">
                  Chưa có sản phẩm nào trong sự kiện. Nhấn "Thêm sản phẩm" để bắt đầu.
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