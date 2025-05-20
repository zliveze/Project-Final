import React, { useState, useEffect, useCallback } from 'react';
import { FiTrash2, FiChevronDown, FiChevronUp, FiEdit, FiLoader } from 'react-icons/fi';
import { format } from 'date-fns';
import axios from 'axios';
import { toast } from 'react-hot-toast';

// Định nghĩa kiểu dữ liệu cho props
interface EventProductsTableProps {
  products: {
    productId: string;
    variantId?: string;
    combinationId?: string;
    adjustedPrice: number;
    name?: string;
    image?: string;
    originalPrice?: number;
    variantName?: string;
    variantAttributes?: Record<string, string>;
    // Thêm các trường mới
    sku?: string;
    status?: string;
    brandId?: string;
    brand?: string;
    variantSku?: string;
    variantPrice?: number;
    combinationPrice?: number;
  }[];
  onRemoveProduct: (productId: string, variantId?: string, combinationId?: string) => void;
  onPriceChange: (productId: string, newPrice: number, variantId?: string, combinationId?: string) => void;
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

  // State để quản lý việc hiển thị dropdown cho từng sản phẩm
  const [expandedProducts, setExpandedProducts] = useState<{[key: string]: boolean}>({});

  // State để lưu trữ thông tin về biến thể và tổ hợp biến thể của sản phẩm
  const [productVariants, setProductVariants] = useState<{[productId: string]: any[]}>({});

  // Chỉ khởi tạo giá khi lần đầu mounted, KHÔNG cập nhật khi props thay đổi
  // Điều này giúp giữ nguyên giá người dùng đã nhập
  useEffect(() => {
    // Khởi tạo giá trị ban đầu chỉ một lần khi component mount
    // và chỉ khởi tạo cho sản phẩm chưa có trong localPrices
    const initialPrices: {[key: string]: number} = { ...localPrices };
    let hasNewProducts = false;

    products.forEach(product => {
      // Tạo key duy nhất cho sản phẩm/biến thể/tổ hợp
      const key = product.productId +
        (product.variantId ? `:${product.variantId}` : '') +
        (product.combinationId ? `:${product.combinationId}` : '');

      if (localPrices[key] === undefined) {
        initialPrices[key] = product.adjustedPrice;
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
      // Tạo key duy nhất cho sản phẩm/biến thể/tổ hợp
      const key = product.productId +
        (product.variantId ? `:${product.variantId}` : '') +
        (product.combinationId ? `:${product.combinationId}` : '');

      if (localPrices[key] === undefined) {
        newProductsPrice[key] = product.adjustedPrice;
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
  const handlePriceChange = useCallback((
    productId: string,
    newPrice: number,
    variantId?: string,
    combinationId?: string
  ) => {
    // Tạo key duy nhất cho sản phẩm/biến thể/tổ hợp
    const key = productId + (variantId ? `:${variantId}` : '') + (combinationId ? `:${combinationId}` : '');

    // Log thông tin về giá thay đổi
    console.log('EventProductsTable - handlePriceChange:', {
      productId,
      variantId,
      combinationId,
      key,
      newPrice
    });

    // Log thông tin về sản phẩm trong products
    const product = products.find(p => {
      if (combinationId) {
        return p.productId === productId && p.variantId === variantId && p.combinationId === combinationId;
      } else if (variantId) {
        return p.productId === productId && p.variantId === variantId && !p.combinationId;
      } else {
        return p.productId === productId && !p.variantId;
      }
    });

    console.log('EventProductsTable - Sản phẩm được cập nhật giá:', JSON.stringify(product, null, 2));

    // Cập nhật giá trong state local
    setLocalPrices(prev => ({
      ...prev,
      [key]: newPrice
    }));

    // Gọi onPriceChange để cập nhật state ở component cha
    // Sử dụng setTimeout để tránh việc re-render ngay lập tức
    // Điều này giúp giữ dropdown mở khi người dùng thay đổi giá
    setTimeout(() => {
      onPriceChange(productId, newPrice, variantId, combinationId);
    }, 0);
  }, [onPriceChange, products]);

  // Hàm này đã được thay thế bằng handleToggleProductExpand

  // Hàm tạo key duy nhất cho sản phẩm/biến thể/tổ hợp
  const createProductKey = useCallback((productId: string, variantId?: string, combinationId?: string) => {
    return productId + (variantId ? `:${variantId}` : '') + (combinationId ? `:${combinationId}` : '');
  }, []);

  // State để theo dõi trạng thái loading của từng sản phẩm
  const [loadingVariants, setLoadingVariants] = useState<{[key: string]: boolean}>({});

  // Hàm để lấy thông tin biến thể và tổ hợp biến thể từ API
  const fetchProductVariants = useCallback(async (productId: string) => {
    // Đánh dấu đang loading
    setLoadingVariants(prev => ({ ...prev, [productId]: true }));

    try {
      // Lấy token từ localStorage
      const token = localStorage.getItem('adminToken');

      // Gọi API để lấy thông tin chi tiết sản phẩm
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/admin/products/${productId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      // Lấy thông tin biến thể từ response
      const product = response.data;
      const variants = product.variants || [];

      // Cập nhật state productVariants
      setProductVariants(prev => ({
        ...prev,
        [productId]: variants
      }));

      // Không hiển thị thông báo để tránh làm đóng dropdown
      // toast.success('Đã tải thông tin biến thể sản phẩm');

      return variants;
    } catch (error) {
      console.error('Lỗi khi lấy thông tin biến thể:', error);
      toast.error('Không thể tải thông tin biến thể sản phẩm');
      return [];
    } finally {
      // Đánh dấu đã hoàn thành loading
      setLoadingVariants(prev => ({ ...prev, [productId]: false }));
    }
  }, []);

  // Hàm xử lý khi mở/đóng dropdown
  const handleToggleProductExpand = useCallback(async (productId: string, e?: React.MouseEvent) => {
    // Ngăn chặn sự kiện lan truyền nếu có
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }

    // Đảo trạng thái hiển thị dropdown
    setExpandedProducts(prev => {
      const newState = { ...prev, [productId]: !prev[productId] };

      // Nếu đang mở dropdown và chưa có dữ liệu biến thể, thì lấy dữ liệu
      if (newState[productId] && !productVariants[productId]) {
        fetchProductVariants(productId);
      }

      return newState;
    });
  }, [fetchProductVariants, productVariants]);

  return (
    <div className="bg-white overflow-hidden border border-gray-100 rounded-xl shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-pink-50">
            <tr>
              <th scope="col" className="px-3 py-2 text-left text-[10px] font-medium text-gray-600 uppercase tracking-wider">
                Sản phẩm
              </th>
              <th scope="col" className="px-3 py-2 text-left text-[10px] font-medium text-gray-600 uppercase tracking-wider">
                Giá gốc
              </th>
              <th scope="col" className="px-3 py-2 text-left text-[10px] font-medium text-gray-600 uppercase tracking-wider">
                Giá KM
              </th>
              <th scope="col" className="px-3 py-2 text-left text-[10px] font-medium text-gray-600 uppercase tracking-wider">
                Giảm
              </th>
              <th scope="col" className="px-3 py-2 text-left text-[10px] font-medium text-gray-600 uppercase tracking-wider">
                Xóa
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {displayProducts.length > 0 ? (
              // Tạo mảng mới để chứa cả sản phẩm và dropdown biến thể
              displayProducts.flatMap((product) => {
                // Tạo key duy nhất cho sản phẩm/biến thể/tổ hợp
                const key = product.productId +
                  (product.variantId ? `:${product.variantId}` : '') +
                  (product.combinationId ? `:${product.combinationId}` : '');

                // Lấy giá hiển thị từ state local hoặc từ props nếu chưa có trong state
                // Ưu tiên giá người dùng đã nhập (trong localPrices)
                const displayPrice = localPrices[key] !== undefined
                  ? localPrices[key]
                  : product.adjustedPrice;

                // Tạo mảng chứa các phần tử cần hiển thị
                const elements = [];

                // Thêm hàng sản phẩm
                elements.push(
                  <tr key={product.productId + (product.variantId || '') + (product.combinationId || '')} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center">
                        {product.image ? (
                          <div className="flex-shrink-0 h-10 w-10 border border-gray-100 rounded-md overflow-hidden">
                            <img
                              className="h-10 w-10 object-cover"
                              src={product.image}
                              alt={product.name || 'Product'}
                            />
                          </div>
                        ) : (
                          <div className="flex-shrink-0 h-10 w-10 border border-gray-100 rounded-md overflow-hidden bg-gray-50 flex items-center justify-center">
                            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                        <div className="ml-3 max-w-xs">
                          <div className="flex items-center">
                            <div className="text-xs font-medium text-gray-800 line-clamp-2">
                              {product.name || `Sản phẩm ID: ${product.productId}`}
                            </div>

                            {/* Nút xổ xuống để hiển thị biến thể - Thiết kế nhỏ gọn hơn */}
                            <button
                              onClick={(e) => handleToggleProductExpand(product.productId, e)}
                              className="ml-1.5 px-1.5 py-0.5 text-xs rounded bg-pink-50 hover:bg-pink-100 focus:outline-none border border-pink-200 transition-all duration-200"
                              title="Hiển thị biến thể và tổ hợp biến thể"
                              aria-label="Xem biến thể sản phẩm"
                            >
                              <span className="font-medium text-pink-600 text-[10px]">Biến thể</span>
                              {loadingVariants[product.productId] ? (
                                <FiLoader className="h-2.5 w-2.5 text-pink-500 animate-spin inline-block ml-0.5" />
                              ) : expandedProducts[product.productId] ? (
                                <FiChevronUp className="h-2.5 w-2.5 text-pink-500 inline-block ml-0.5" />
                              ) : (
                                <FiChevronDown className="h-2.5 w-2.5 text-pink-500 inline-block ml-0.5" />
                              )}
                            </button>
                          </div>

                          {/* Hiển thị thông tin sản phẩm */}
                          {product.sku && (
                            <div className="text-[10px] text-gray-500 mt-0.5">
                              SKU: {product.sku}
                            </div>
                          )}
                          {product.brand && (
                            <div className="text-[10px] text-gray-500 mt-0.5">
                              Thương hiệu: {product.brand}
                            </div>
                          )}

                          {/* Hiển thị thông tin biến thể */}
                          {product.variantName && (
                            <div className="text-[10px] font-medium text-pink-600 mt-0.5">
                              {product.variantName}
                            </div>
                          )}
                          {product.variantSku && (
                            <div className="text-[10px] text-gray-500 mt-0.5">
                              Variant SKU: {product.variantSku}
                            </div>
                          )}
                          {product.variantAttributes && Object.keys(product.variantAttributes).length > 0 && (
                            <div className="text-[10px] text-gray-500 mt-0.5 flex flex-wrap gap-0.5">
                              {Object.entries(product.variantAttributes).map(([key, value]) => (
                                value && <span key={key} className="bg-gray-100 px-1 py-0.5 rounded">
                                  {key}: {value}
                                </span>
                              ))}
                            </div>
                          )}
                          {!product.variantAttributes && product.variantId && (
                            <div className="text-[10px] text-gray-500 mt-0.5">
                              Variant ID: {product.variantId.substring(0, 8)}...
                            </div>
                          )}
                          {product.combinationId && !product.variantAttributes && (
                            <div className="text-[10px] text-gray-500 mt-0.5">
                              Combination ID: {product.combinationId.substring(0, 8)}...
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="text-xs font-medium text-gray-700">
                        {product.originalPrice
                          ? new Intl.NumberFormat('vi-VN').format(product.originalPrice) + ' ₫'
                          : 'N/A'}
                      </div>
                    </td>

                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="text-xs text-gray-900">
                        <div className="flex flex-col space-y-1">
                          {/* Hiển thị thông tin loại giá đang nhập - nhỏ gọn hơn */}
                          <div className="text-[10px] font-medium text-gray-500">
                            {product.combinationId ? (
                              <span className="text-pink-600">
                                Giá cho tổ hợp biến thể
                                {product.combinationPrice && ` (${new Intl.NumberFormat('vi-VN').format(product.combinationPrice)} ₫)`}
                              </span>
                            ) : product.variantId ? (
                              <span className="text-pink-600">
                                Giá cho biến thể
                                {product.variantPrice && ` (${new Intl.NumberFormat('vi-VN').format(product.variantPrice)} ₫)`}
                              </span>
                            ) : (
                              <span>Giá cho sản phẩm</span>
                            )}
                          </div>

                          {/* Trường nhập giá - nhỏ gọn hơn */}
                          <div className="relative">
                            <input
                              type="number"
                              value={displayPrice}
                              onChange={(e) => {
                                e.stopPropagation(); // Ngăn sự kiện lan truyền lên form
                                const value = parseInt(e.target.value);
                                if (!isNaN(value) && value >= 0) {
                                  // Cập nhật giá trong state local
                                  handlePriceChange(
                                    product.productId,
                                    value,
                                    product.variantId,
                                    product.combinationId
                                  );
                                }
                              }}
                              onClick={(e) => e.stopPropagation()} // Ngăn sự kiện click lan truyền
                              min="0"
                              step="1000"
                              className="w-24 border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-pink-500 transition-colors duration-150"
                            />
                            <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
                              <span className="text-gray-400 text-[10px]">₫</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-3 py-2 whitespace-nowrap">
                      {product.originalPrice ? (
                        <span className={`px-2 py-1 inline-flex text-[10px] leading-none font-medium rounded ${
                          calculateDiscount(product.originalPrice, displayPrice) >= 30 ? 'bg-pink-100 text-pink-800' :
                          calculateDiscount(product.originalPrice, displayPrice) >= 15 ? 'bg-pink-50 text-pink-700' :
                          'bg-green-50 text-green-700'
                        }`}>
                          -{calculateDiscount(product.originalPrice, displayPrice)}%
                        </span>
                      ) : (
                        <span className="text-xs text-gray-500">N/A</span>
                      )}
                    </td>

                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                      <button
                        onClick={() => onRemoveProduct(product.productId, product.variantId, product.combinationId)}
                        className="text-gray-400 hover:text-pink-500 focus:outline-none transition-colors duration-150 p-1 rounded hover:bg-pink-50"
                        title="Xóa sản phẩm khỏi sự kiện"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );

                // Nếu sản phẩm đang được mở rộng, thêm hàng hiển thị biến thể
                if (expandedProducts[product.productId]) {
                  elements.push(
                    <tr key={`${product.productId}-variants`}>
                      <td colSpan={5} className="px-0 py-0 border-t-0">
                        <div
                          className="bg-gray-50 p-4 rounded-b-lg"
                          onClick={(e) => e.stopPropagation()} // Ngăn sự kiện click lan truyền lên form
                        >
                          <div className="mb-3">
                            <h4 className="text-sm font-medium text-gray-700 mb-1">Nhập giá cho biến thể</h4>
                            <p className="text-xs text-gray-500">Chọn biến thể và nhập giá khuyến mãi tương ứng.</p>
                          </div>

                          {/* Hiển thị trạng thái loading */}
                          {loadingVariants[product.productId] ? (
                            <div className="flex justify-center items-center py-4">
                              <FiLoader className="h-5 w-5 text-pink-500 animate-spin" />
                              <span className="ml-2 text-xs text-gray-600">Đang tải biến thể...</span>
                            </div>
                          ) : (
                            <>
                              {/* Danh sách biến thể */}
                              {productVariants[product.productId] && productVariants[product.productId].length > 0 ? (
                                <div className="space-y-3">
                                  {productVariants[product.productId].map((variant: any) => (
                                    <div
                                      key={variant.variantId}
                                      className="border border-gray-200 rounded-md p-3 bg-white shadow-sm"
                                      onClick={(e) => e.stopPropagation()} // Ngăn sự kiện click lan truyền
                                    >
                                      <div className="flex justify-between items-center mb-2">
                                        <div className="text-sm font-medium text-gray-800">
                                          {variant.name || `Biến thể: ${variant.options?.color || variant.variantId.substring(0, 8)}`}
                                        </div>
                                        <div className="flex items-center space-x-3">
                                          <div className="text-xs text-gray-500">
                                            Giá gốc: {new Intl.NumberFormat('vi-VN').format(variant.price || 0)} ₫
                                          </div>
                                          <div className="relative">
                                            <input
                                              type="number"
                                              placeholder="Giá KM"
                                              className="w-28 border border-gray-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                                              defaultValue={
                                                localPrices[product.productId + `:${variant.variantId}`] ||
                                                Math.round((variant.price || 0) * 0.7) // Giả sử giảm 30%
                                              }
                                              onChange={(e) => {
                                                e.stopPropagation(); // Ngăn sự kiện lan truyền lên form
                                                const value = parseInt(e.target.value);
                                                if (!isNaN(value) && value >= 0) {
                                                  // Cập nhật giá trong state local
                                                  handlePriceChange(
                                                    product.productId,
                                                    value,
                                                    variant.variantId
                                                  );
                                                }
                                              }}
                                              onClick={(e) => e.stopPropagation()} // Ngăn sự kiện click lan truyền
                                            />
                                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                              <span className="text-gray-400 text-xs">₫</span>
                                            </div>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Hiển thị thông tin chi tiết biến thể */}
                                      <div className="text-xs text-gray-500 mb-2 flex flex-wrap gap-2">
                                        {variant.sku && (
                                          <span className="bg-gray-50 px-2 py-0.5 rounded">
                                            SKU: {variant.sku}
                                          </span>
                                        )}
                                        {variant.options?.color && (
                                          <span className="bg-gray-50 px-2 py-0.5 rounded">
                                            Màu: {variant.options.color}
                                          </span>
                                        )}
                                        {variant.options?.sizes && variant.options.sizes.length > 0 && (
                                          <span className="bg-gray-50 px-2 py-0.5 rounded">
                                            Kích thước: {variant.options.sizes.join(', ')}
                                          </span>
                                        )}
                                        {variant.options?.shades && variant.options.shades.length > 0 && (
                                          <span className="bg-gray-50 px-2 py-0.5 rounded">
                                            Tông màu: {variant.options.shades.join(', ')}
                                          </span>
                                        )}
                                      </div>

                                      {/* Tổ hợp biến thể */}
                                      {variant.combinations && variant.combinations.length > 0 && (
                                        <div className="pl-4 border-l-2 border-pink-100 mt-3 space-y-2">
                                          <div className="text-xs font-medium text-pink-600 mb-2">Tổ hợp biến thể:</div>
                                          {variant.combinations.map((combination: any) => (
                                            <div
                                              key={combination.combinationId}
                                              className="flex flex-col bg-gray-50 p-2 rounded-md"
                                              onClick={(e) => e.stopPropagation()} // Ngăn sự kiện click lan truyền
                                            >
                                              {/* Thông tin thuộc tính tổ hợp */}
                                              <div className="flex justify-between items-center mb-2">
                                                <div className="text-xs text-gray-700">
                                                  <div className="font-medium mb-1">
                                                    Tổ hợp: {combination.combinationId.substring(0, 8)}
                                                  </div>
                                                  <div className="flex flex-wrap gap-1">
                                                    {Object.entries(combination.attributes || {}).map(([key, value]) => (
                                                      <span key={key} className="bg-white px-1.5 py-0.5 rounded text-[10px] border border-gray-100">
                                                        {key}: {String(value)}
                                                      </span>
                                                    ))}
                                                  </div>
                                                </div>
                                              </div>

                                              {/* Thông tin giá */}
                                              <div className="flex justify-between items-center mt-1">
                                                <div className="text-xs text-gray-500">
                                                  Giá gốc: {new Intl.NumberFormat('vi-VN').format(combination.price || (variant.price + (combination.additionalPrice || 0)) || 0)} ₫
                                                  {combination.additionalPrice && !combination.price && (
                                                    <span className="text-[10px] ml-1 text-pink-500">
                                                      (+{new Intl.NumberFormat('vi-VN').format(combination.additionalPrice)} ₫)
                                                    </span>
                                                  )}
                                                </div>
                                                <div className="relative">
                                                  <input
                                                    type="number"
                                                    placeholder="Giá KM"
                                                    className="w-24 border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-pink-500 focus:border-pink-500"
                                                    defaultValue={
                                                      localPrices[product.productId + `:${variant.variantId}:${combination.combinationId}`] ||
                                                      Math.round((combination.price || (variant.price + (combination.additionalPrice || 0)) || 0) * 0.7) // Giả sử giảm 30%
                                                    }
                                                    onChange={(e) => {
                                                      e.stopPropagation(); // Ngăn sự kiện lan truyền lên form
                                                      const value = parseInt(e.target.value);
                                                      if (!isNaN(value) && value >= 0) {
                                                        // Cập nhật giá trong state local
                                                        handlePriceChange(
                                                          product.productId,
                                                          value,
                                                          variant.variantId,
                                                          combination.combinationId
                                                        );
                                                      }
                                                    }}
                                                    onClick={(e) => e.stopPropagation()} // Ngăn sự kiện click lan truyền
                                                  />
                                                  <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
                                                    <span className="text-gray-400 text-xs">₫</span>
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-4 text-xs text-gray-500">
                                  Sản phẩm này không có biến thể.
                                </div>
                              )}

                              <div className="mt-3 text-xs text-gray-500 italic">
                                * Giá khuyến mãi sẽ áp dụng trong thời gian diễn ra sự kiện.
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                }

                return elements;
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