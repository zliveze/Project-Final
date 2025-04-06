import React, { useState, useEffect, useCallback } from 'react';
import { FiTrash2, FiPlus, FiGift, FiSearch, FiPackage, FiLoader } from 'react-icons/fi';
import { ProductFormData, GiftItem } from '../types'; // GiftItem is now exported
import { useProduct } from '@/contexts/ProductContext'; // Import useProduct hook
import { AdminProduct } from '@/hooks/useProductAdmin'; // Import AdminProduct type
import { debounce } from 'lodash'; // Import debounce for search

interface GiftsTabProps {
  formData: ProductFormData;
  handleGiftChange: (index: number, field: string, value: any) => void;
  handleRemoveGift: (index: number) => void;
  handleAddGift: () => void;
  handleGiftImageUrlChange: (index: number, url: string) => void;
  handleGiftImageAltChange: (index: number, alt: string) => void;
  handleGiftConditionChange: (index: number, conditionField: string, value: any) => void;
  hasGifts: () => boolean;
  getValidGiftsCount: () => number;
  isViewMode?: boolean;
  handleCheckboxChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

/**
 * Component tab quản lý quà tặng sản phẩm
 */
const GiftsTab: React.FC<GiftsTabProps> = ({
  formData,
  handleGiftChange,
  handleRemoveGift,
  handleAddGift,
  handleGiftImageUrlChange,
  handleGiftImageAltChange,
  handleGiftConditionChange,
  hasGifts,
  getValidGiftsCount,
  isViewMode = false,
  handleCheckboxChange
}) => {
  const { fetchAdminProductList } = useProduct(); // Use the context hook

  // State để quản lý tìm kiếm sản phẩm
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [showProductSearch, setShowProductSearch] = useState<{index: number, show: boolean}>({index: -1, show: false});
  const [availableGiftProducts, setAvailableGiftProducts] = useState<AdminProduct[]>([]);
  const [loadingGiftProducts, setLoadingGiftProducts] = useState(false);
  const [giftProductError, setGiftProductError] = useState<string | null>(null);

  // Debounce search input
  const debouncedSetSearch = useCallback(debounce((value: string) => {
    setDebouncedSearchTerm(value);
  }, 300), []); // 300ms delay

  useEffect(() => {
    debouncedSetSearch(searchTerm);
    // Cleanup debounce on unmount
    return () => {
      debouncedSetSearch.cancel();
    };
  }, [searchTerm, debouncedSetSearch]);

  // Fetch products when search modal is shown or search term changes
  useEffect(() => {
    if (showProductSearch.show) {
      const fetchProducts = async () => {
        setLoadingGiftProducts(true);
        setGiftProductError(null);
        try {
          const result = await fetchAdminProductList({
            search: debouncedSearchTerm,
            limit: 20, // Limit results for performance
            status: 'active', // Only show active products
          });
          setAvailableGiftProducts(result.products);
        } catch (error: any) {
          console.error("Error fetching products for gifts:", error);
          setGiftProductError("Không thể tải danh sách sản phẩm.");
        } finally {
          setLoadingGiftProducts(false);
        }
      };
      fetchProducts();
    }
  }, [showProductSearch.show, debouncedSearchTerm, fetchAdminProductList]);

  // Hàm chọn sản phẩm làm quà tặng
  const handleSelectProduct = (index: number, product: AdminProduct) => {
    console.log('Đã chọn sản phẩm:', product);
    
    // Cập nhật thông tin hình ảnh trước
    const imageUrl = product.image || 'https://via.placeholder.com/50';
    const imageAlt = product.name;
    
    // Cập nhật hình ảnh qua hàm riêng
    handleGiftImageUrlChange(index, imageUrl);
    handleGiftImageAltChange(index, imageAlt);
    
    // Sau đó cập nhật các thông tin khác
    handleGiftChange(index, 'name', product.name);
    handleGiftChange(index, 'value', product.currentPrice); // Use currentPrice
    handleGiftChange(index, 'productId', product.id);
    
    // Thêm mô tả mặc định
    if (!formData.gifts?.[index]?.description) {
      handleGiftChange(index, 'description', `Quà tặng kèm sản phẩm ${product.name}`);
    }
    
    // Thiết lập các giá trị mặc định khác
    if (!formData.gifts?.[index]?.quantity) {
      handleGiftChange(index, 'quantity', 1);
    }
    
    if (!formData.gifts?.[index]?.type) {
      handleGiftChange(index, 'type', 'product');
    }
    
    if (!formData.gifts?.[index]?.status) {
      handleGiftChange(index, 'status', 'active');
    }
    
    // Log để kiểm tra tất cả dữ liệu đã được cập nhật chưa
    setTimeout(() => {
      console.log('Gift data after update:', formData.gifts?.[index]);
    }, 0);
    
    // Đóng modal tìm kiếm
    setShowProductSearch({index: -1, show: false});
    setSearchTerm(''); // Reset search term
    setDebouncedSearchTerm(''); // Reset debounced search term
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Quà tặng kèm sản phẩm</h3>
        {!isViewMode && (
          <button
            type="button"
            onClick={handleAddGift}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
          >
            <FiPlus className="mr-1" /> Thêm quà tặng
          </button>
        )}
      </div>

      {/* Tổng quan quà tặng */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4 flex items-center space-x-2">
        <div className="flex items-center">
          <input
            id="hasGifts"
            name="flags.hasGifts"
            type="checkbox"
            checked={formData.flags?.hasGifts ?? false} // Add optional chaining and default value
            onChange={handleCheckboxChange}
            disabled={isViewMode}
            className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
          />
          <label htmlFor="hasGifts" className="ml-2 block text-sm text-gray-700">
            Sản phẩm này có quà tặng kèm
          </label>
        </div>
        {hasGifts() && (
          <div className="ml-4 text-sm text-gray-600">
            <span className="bg-pink-100 text-pink-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded-full">
              {getValidGiftsCount()} quà tặng
            </span>
          </div>
        )}
      </div>

      {/* Danh sách quà tặng */}
      {hasGifts() ? (
        <div className="space-y-4">
          {(formData.gifts ?? []).map((gift, index) => ( // Add default empty array
            <div key={gift.giftId || index} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm"> {/* Use giftId if available */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center">
                  <FiGift className="text-pink-500 w-5 h-5 mr-2" />
                  <h4 className="text-base font-medium text-gray-900">
                    Quà tặng #{index + 1}
                  </h4>
                </div>
                {!isViewMode && (
                  <button
                    type="button"
                    onClick={() => handleRemoveGift(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Chọn sản phẩm làm quà tặng */}
              {!isViewMode && (
                <div className="mb-4 p-3 bg-gray-50 rounded-md">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Chọn sản phẩm làm quà tặng
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowProductSearch({index, show: !showProductSearch.show || showProductSearch.index !== index})}
                      className="text-sm text-pink-600 hover:text-pink-700 flex items-center"
                    >
                      <FiPackage className="mr-1" />
                      {gift.productId ? 'Thay đổi sản phẩm' : 'Chọn sản phẩm'}
                    </button>
                  </div>
                  
                  {gift.productId && (
                    <div className="flex items-center bg-white p-2 rounded border border-gray-200">
                      <img
                        src={gift.image?.url || 'https://via.placeholder.com/50'}
                        alt={gift.name}
                        className="w-10 h-10 object-cover rounded mr-2"
                      />
                      <div>
                        <p className="text-sm font-medium">{gift.name}</p>
                        <p className="text-xs text-gray-500">Mã sản phẩm: {gift.productId}</p>
                      </div>
                    </div>
                  )}
                  
                  {showProductSearch.show && showProductSearch.index === index && (
                    <div className="mt-2 p-2 bg-white rounded border border-gray-200 absolute z-10 w-96 shadow-lg">
                      <div className="flex items-center border border-gray-300 rounded-md px-2 py-1 mb-2">
                        <FiSearch className="text-gray-400 mr-2" />
                        <input
                          type="text"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          placeholder="Tìm kiếm sản phẩm..."
                          className="w-full focus:outline-none text-sm"
                        />
                      </div>
                      <div className="max-h-60 overflow-y-auto">
                        {loadingGiftProducts ? (
                          <div className="flex justify-center items-center p-4">
                            <FiLoader className="animate-spin text-pink-500 mr-2" />
                            <p className="text-sm text-gray-500">Đang tải sản phẩm...</p>
                          </div>
                        ) : giftProductError ? (
                          <p className="text-sm text-red-500 p-2">{giftProductError}</p>
                        ) : availableGiftProducts.length > 0 ? (
                          availableGiftProducts.map(product => (
                            <div 
                              key={product.id} 
                              className="flex items-center p-2 hover:bg-gray-50 cursor-pointer"
                              onClick={() => handleSelectProduct(index, product)}
                            >
                              <img 
                                src={product.image || 'https://via.placeholder.com/50'} 
                                alt={product.name} 
                                className="w-8 h-8 object-cover rounded mr-2"
                              />
                              <div className="flex-1">
                                <p className="text-sm font-medium">{product.name}</p>
                                <p className="text-xs text-gray-500">{product.currentPrice.toLocaleString()}₫</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500 p-2">Không tìm thấy sản phẩm</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Tên quà tặng */}
                <div className="space-y-1">
                  <label htmlFor={`gift-name-${index}`} className="block text-sm font-medium text-gray-700">
                    Tên quà tặng <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id={`gift-name-${index}`}
                    value={gift.name}
                    onChange={(e) => handleGiftChange(index, 'name', e.target.value)}
                    disabled={isViewMode}
                    placeholder="Tên quà tặng"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm disabled:bg-gray-100"
                  />
                </div>

                {/* Loại quà tặng */}
                <div className="space-y-1">
                  <label htmlFor={`gift-type-${index}`} className="block text-sm font-medium text-gray-700">
                    Loại quà
                  </label>
                  <select
                    id={`gift-type-${index}`}
                    value={gift.type}
                    onChange={(e) => handleGiftChange(index, 'type', e.target.value)}
                    disabled={isViewMode}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm disabled:bg-gray-100"
                  >
                    <option value="product">Sản phẩm</option>
                    <option value="sample">Mẫu thử</option>
                    <option value="voucher">Phiếu giảm giá</option>
                    <option value="other">Khác</option>
                  </select>
                </div>

                {/* Mô tả */}
                <div className="space-y-1 md:col-span-2">
                  <label htmlFor={`gift-description-${index}`} className="block text-sm font-medium text-gray-700">
                    Mô tả
                  </label>
                  <textarea
                    id={`gift-description-${index}`}
                    value={gift.description}
                    onChange={(e) => handleGiftChange(index, 'description', e.target.value)}
                    disabled={isViewMode}
                    rows={2}
                    placeholder="Mô tả ngắn về quà tặng"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm disabled:bg-gray-100"
                  ></textarea>
                </div>

                {/* URL Hình ảnh */}
                <div className="space-y-1">
                  <label htmlFor={`gift-image-url-${index}`} className="block text-sm font-medium text-gray-700">
                    URL Hình ảnh
                  </label>
                  <input
                    type="text"
                    id={`gift-image-url-${index}`}
                    value={gift.image?.url ?? ''} // Add optional chaining and default value
                    onChange={(e) => handleGiftImageUrlChange(index, e.target.value)}
                    disabled={isViewMode}
                    placeholder="URL hình ảnh quà tặng"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm disabled:bg-gray-100"
                  />
                </div>

                {/* Alt text hình ảnh */}
                <div className="space-y-1">
                  <label htmlFor={`gift-image-alt-${index}`} className="block text-sm font-medium text-gray-700">
                    Mô tả hình ảnh
                  </label>
                  <input
                    type="text"
                    id={`gift-image-alt-${index}`}
                    value={gift.image?.alt ?? ''} // Add optional chaining and default value
                    onChange={(e) => handleGiftImageAltChange(index, e.target.value)}
                    disabled={isViewMode}
                    placeholder="Mô tả hình ảnh"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm disabled:bg-gray-100"
                  />
                </div>

                {/* Số lượng và giá trị */}
                <div className="space-y-1">
                  <label htmlFor={`gift-quantity-${index}`} className="block text-sm font-medium text-gray-700">
                    Số lượng quà tặng trên 1 đơn hàng
                  </label>
                  <input
                    type="number"
                    id={`gift-quantity-${index}`}
                    value={gift.quantity}
                    onChange={(e) => handleGiftChange(index, 'quantity', parseInt(e.target.value))}
                    disabled={isViewMode}
                    min="1"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm disabled:bg-gray-100"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor={`gift-value-${index}`} className="block text-sm font-medium text-gray-700">
                    Giá trị (VNĐ)
                  </label>
                  <input
                    type="number"
                    id={`gift-value-${index}`}
                    value={gift.value}
                    onChange={(e) => handleGiftChange(index, 'value', parseInt(e.target.value))}
                    disabled={isViewMode}
                    min="0"
                    step="1000"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm disabled:bg-gray-100"
                  />
                </div>

                {/* Trạng thái */}
                <div className="space-y-1">
                  <label htmlFor={`gift-status-${index}`} className="block text-sm font-medium text-gray-700">
                    Trạng thái
                  </label>
                  <select
                    id={`gift-status-${index}`}
                    value={gift.status}
                    onChange={(e) => handleGiftChange(index, 'status', e.target.value)}
                    disabled={isViewMode}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm disabled:bg-gray-100"
                  >
                    <option value="active">Kích hoạt</option>
                    <option value="inactive">Không kích hoạt</option>
                  </select>
                </div>
              </div>

              {/* Điều kiện áp dụng */}
              <div className="border-t border-gray-200 pt-4 mt-4">
                <h5 className="text-sm font-medium text-gray-700 mb-3">Điều kiện áp dụng</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Giá trị đơn hàng tối thiểu */}
                  <div className="space-y-1">
                    <label htmlFor={`gift-min-amount-${index}`} className="block text-sm font-medium text-gray-700">
                      Giá trị đơn hàng tối thiểu (VNĐ)
                    </label>
                    <input
                      type="number"
                      id={`gift-min-amount-${index}`}
                      value={gift.conditions?.minPurchaseAmount ?? ''} // Add optional chaining and default value
                      onChange={(e) => handleGiftConditionChange(index, 'minPurchaseAmount', parseInt(e.target.value))}
                      disabled={isViewMode}
                      min="0"
                      step="1000"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm disabled:bg-gray-100"
                    />
                  </div>

                  {/* Số lượng sản phẩm tối thiểu */}
                  <div className="space-y-1">
                    <label htmlFor={`gift-min-quantity-${index}`} className="block text-sm font-medium text-gray-700">
                      Số lượng sản phẩm tối thiểu
                    </label>
                    <input
                      type="number"
                      id={`gift-min-quantity-${index}`}
                      value={gift.conditions?.minQuantity ?? ''} // Add optional chaining and default value
                      onChange={(e) => handleGiftConditionChange(index, 'minQuantity', parseInt(e.target.value))}
                      disabled={isViewMode}
                      min="1"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm disabled:bg-gray-100"
                    />
                  </div>

                  {/* Ngày bắt đầu */}
                  <div className="space-y-1">
                    <label htmlFor={`gift-start-date-${index}`} className="block text-sm font-medium text-gray-700">
                      Ngày bắt đầu
                    </label>
                    <input
                      type="date"
                      id={`gift-start-date-${index}`}
                      // Format date to YYYY-MM-DD for input value
                      value={gift.conditions?.startDate ? new Date(gift.conditions.startDate).toISOString().split('T')[0] : ''}
                      onChange={(e) => handleGiftConditionChange(index, 'startDate', e.target.value)}
                      disabled={isViewMode}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm disabled:bg-gray-100"
                    />
                  </div>

                  {/* Ngày kết thúc */}
                  <div className="space-y-1">
                    <label htmlFor={`gift-end-date-${index}`} className="block text-sm font-medium text-gray-700">
                      Ngày kết thúc
                    </label>
                    <input
                      type="date"
                      id={`gift-end-date-${index}`}
                      // Format date to YYYY-MM-DD for input value
                      value={gift.conditions?.endDate ? new Date(gift.conditions.endDate).toISOString().split('T')[0] : ''}
                      onChange={(e) => handleGiftConditionChange(index, 'endDate', e.target.value)}
                      disabled={isViewMode}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm disabled:bg-gray-100"
                    />
                  </div>

                  {/* Số lượng giới hạn */}
                  <div className="space-y-1">
                    <label htmlFor={`gift-limited-quantity-${index}`} className="block text-sm font-medium text-gray-700">
                      Số lượng giới hạn (0 = không giới hạn)
                    </label>
                    <input
                      type="number"
                      id={`gift-limited-quantity-${index}`}
                      value={gift.conditions?.limitedQuantity ?? ''} // Add optional chaining and default value
                      onChange={(e) => handleGiftConditionChange(index, 'limitedQuantity', parseInt(e.target.value))}
                      disabled={isViewMode}
                      min="0"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm disabled:bg-gray-100"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-50 p-8 text-center rounded-lg border border-gray-200 border-dashed">
          <FiGift className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Không có quà tặng</h3>
          <p className="mt-1 text-sm text-gray-500">
            Bắt đầu thêm quà tặng kèm theo sản phẩm này.
          </p>
          {!isViewMode && (
            <div className="mt-6">
              <button
                type="button"
                onClick={handleAddGift}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
              >
                <FiPlus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                Thêm quà tặng
              </button>
            </div>
          )}
        </div>
      )}

      {/* Chú thích */}
      <div className="bg-blue-50 p-4 rounded-md mt-4">
        <h3 className="text-sm font-medium text-blue-800">Lưu ý:</h3>
        <ul className="mt-2 text-sm text-blue-700 list-disc pl-5 space-y-1">
          <li>Quà tặng sẽ được áp dụng khi khách hàng đáp ứng các điều kiện đã thiết lập</li>
          <li>Quà tặng sẽ được hiển thị trên trang sản phẩm nếu đang trong thời gian khuyến mãi</li>
          <li>Có thể thiết lập nhiều quà tặng khác nhau với các điều kiện khác nhau</li>
          <li>Sử dụng tính năng "Chọn sản phẩm" để dễ dàng thêm sản phẩm làm quà tặng</li>
        </ul>
      </div>
    </div>
  );
};

export default GiftsTab;
