import React, { useState, useEffect, useCallback, Fragment } from 'react'; // Import Fragment
import { Disclosure, Transition } from '@headlessui/react'; // Import Disclosure and Transition
import { FiTrash2, FiPlus, FiGift, FiSearch, FiPackage, FiLoader, FiChevronUp, FiChevronDown } from 'react-icons/fi'; // Import Chevron icons
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
          // Ensure result.products is always an array
          setAvailableGiftProducts(Array.isArray(result.products) ? result.products : []);
        } catch (error: any) {
          console.error("Error fetching products for gifts:", error);
          setGiftProductError("Không thể tải danh sách sản phẩm.");
          setAvailableGiftProducts([]); // Reset on error
        } finally {
          setLoadingGiftProducts(false);
        }
      };
      fetchProducts();
    } else {
       // Clear results when search is hidden
       setAvailableGiftProducts([]);
       setGiftProductError(null);
    }
  }, [showProductSearch.show, debouncedSearchTerm, fetchAdminProductList]);

  // Hàm chọn sản phẩm làm quà tặng
  const handleSelectProduct = (index: number, product: AdminProduct) => {
    console.log(`[GiftsTab] Selecting product for gift index ${index}:`, product);

    // Chuẩn bị dữ liệu cập nhật cho quà tặng
    const giftUpdateData = {
      productId: product.id,
      name: product.name,
      value: product.currentPrice, // Sử dụng giá hiện tại
      // Giữ lại giá trị hiện có hoặc đặt mặc định nếu chưa có
      type: formData.gifts?.[index]?.type || 'product',
      description: formData.gifts?.[index]?.description || `Quà tặng kèm sản phẩm ${product.name}`,
      quantity: formData.gifts?.[index]?.quantity || 1,
      status: formData.gifts?.[index]?.status || 'active',
      image: {
          url: product.image || '', // Use product image or empty string
          alt: product.name // Alt text là tên sản phẩm
      }
    };

    console.log(`[GiftsTab] Prepared update data for index ${index}:`, giftUpdateData);

    // Gọi các hàm cập nhật state từ component cha
    handleGiftChange(index, 'productId', giftUpdateData.productId);
    handleGiftChange(index, 'name', giftUpdateData.name);
    handleGiftChange(index, 'value', giftUpdateData.value);
    handleGiftChange(index, 'type', giftUpdateData.type);
    handleGiftChange(index, 'description', giftUpdateData.description);
    handleGiftChange(index, 'quantity', giftUpdateData.quantity);
    handleGiftChange(index, 'status', giftUpdateData.status);
    // Cập nhật hình ảnh qua các hàm riêng
    handleGiftImageUrlChange(index, giftUpdateData.image.url);
    handleGiftImageAltChange(index, giftUpdateData.image.alt);

    // Đóng modal tìm kiếm và reset trạng thái tìm kiếm
    setShowProductSearch({index: -1, show: false});
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setAvailableGiftProducts([]); // Clear search results
    setGiftProductError(null);
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

      {/* Danh sách quà tặng (sử dụng Disclosure và Grid) */}
      {hasGifts() ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(formData.gifts ?? []).map((gift, index) => (
            <Disclosure as="div" key={gift.giftId || index} defaultOpen={index === 0} className="w-full">
              {/* Remove explicit type annotation */}
              {({ open }) => ( 
                <>
                  <div className="border border-gray-200 rounded-lg hover:shadow-sm">
                    <Disclosure.Button className="flex justify-between items-center w-full px-4 py-3 text-left text-sm font-medium text-gray-900 bg-gray-50 rounded-t-lg hover:bg-gray-100 focus:outline-none focus-visible:ring focus-visible:ring-pink-500 focus-visible:ring-opacity-75">
                      <div className="flex items-center flex-1 min-w-0 mr-2"> {/* Added flex-1 and min-w-0 */}
                        <FiGift className="text-pink-500 w-5 h-5 mr-2 flex-shrink-0" /> {/* Added flex-shrink-0 */}
                        <span className="truncate">Quà tặng #{index + 1}: {gift.name || '(Chưa có tên)'}</span> {/* Added truncate */}
                        {gift.productId && <FiPackage className="w-4 h-4 ml-2 text-green-600 flex-shrink-0" title="Đã chọn sản phẩm" />}
                      </div>
                      <div className="flex items-center flex-shrink-0"> {/* Added flex-shrink-0 */}
                        {!isViewMode && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation(); // Ngăn không cho Disclosure toggle khi bấm nút xóa
                              handleRemoveGift(index);
                            }}
                            className="text-red-500 hover:text-red-700 mr-3 p-1 rounded hover:bg-red-100"
                            title="Xóa quà tặng"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        )}
                        {open ? <FiChevronUp className="w-5 h-5 text-gray-500" /> : <FiChevronDown className="w-5 h-5 text-gray-500" />}
                      </div>
                    </Disclosure.Button>

                    <Transition
                      as={Fragment}
                      enter="transition ease-out duration-100"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-75"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      <Disclosure.Panel className="px-4 pt-4 pb-2 text-sm text-gray-500 border-t border-gray-200">
                        {/* Nội dung chi tiết của quà tặng */}

                        {/* Chọn sản phẩm làm quà tặng */}
                        {!isViewMode && (
                          <div className="mb-4 p-3 bg-gray-50 rounded-md relative"> {/* Thêm relative positioning */}
                            <div className="flex justify-between items-center mb-2">
                              <label className="block text-sm font-medium text-gray-700">
                                Chọn sản phẩm làm quà tặng
                              </label>
                              <button
                                type="button"
                                onClick={() => {
                                  // Toggle ô tìm kiếm cho gift hiện tại
                                  setShowProductSearch(prev => ({
                                    index,
                                    show: !(prev.show && prev.index === index) // Chỉ đóng nếu đang mở chính nó
                                  }));
                                  // Reset search term only when opening
                                  if (!(showProductSearch.show && showProductSearch.index === index)) {
                                    setSearchTerm('');
                                    setDebouncedSearchTerm('');
                                  }
                                }}
                                className="text-sm text-pink-600 hover:text-pink-700 flex items-center"
                              >
                                <FiPackage className="mr-1" />
                                {gift.productId ? 'Thay đổi sản phẩm' : 'Chọn sản phẩm'}
                              </button>
                            </div>

                            {/* Hiển thị thông tin sản phẩm đã chọn làm quà */}
                            {gift.productId && (
                              <div className="flex items-center bg-white p-2 rounded border border-gray-200">
                                <img
                                  src={gift.image?.url || 'https://via.placeholder.com/50'} // Placeholder if no image
                                  alt={gift.image?.alt || gift.name}
                                  className="w-10 h-10 object-cover rounded mr-2"
                                  onError={(e) => { // Handle image loading errors
                                    const target = e.target as HTMLImageElement;
                                    target.onerror = null; // Prevent infinite loop
                                    target.src = 'https://via.placeholder.com/50'; // Fallback image
                                  }}
                                />
                                <div>
                                  <p className="text-sm font-medium">{gift.name}</p>
                                  <p className="text-xs text-gray-500">Mã sản phẩm: {gift.productId}</p>
                                </div>
                              </div>
                            )}

                            {/* Modal tìm kiếm sản phẩm */}
                            {showProductSearch.show && showProductSearch.index === index && (
                              <div className="mt-2 p-2 bg-white rounded border border-gray-200 absolute z-20 w-full sm:w-96 shadow-lg right-0">
                                <div className="flex items-center border border-gray-300 rounded-md px-2 py-1 mb-2">
                                  <FiSearch className="text-gray-400 mr-2" />
                                  <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Tìm kiếm sản phẩm..."
                                    className="w-full focus:outline-none text-sm"
                                    autoFocus // Focus input when modal opens
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
                                        className="flex items-center p-2 hover:bg-gray-50 cursor-pointer rounded" // Added rounded
                                        onClick={() => handleSelectProduct(index, product)}
                                      >
                                        <img
                                          src={product.image || 'https://via.placeholder.com/40'} // Smaller placeholder
                                          alt={product.name}
                                          className="w-8 h-8 object-cover rounded mr-2"
                                          onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.onerror = null;
                                            target.src = 'https://via.placeholder.com/40';
                                          }}
                                        />
                                        <div className="flex-1 min-w-0"> {/* Added min-w-0 */}
                                          <p className="text-sm font-medium truncate">{product.name}</p> {/* Added truncate */}
                                          <p className="text-xs text-gray-500">{product.currentPrice.toLocaleString()}₫</p>
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-sm text-gray-500 p-2">Không tìm thấy sản phẩm phù hợp.</p>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Các trường thông tin khác của quà tặng */}
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
                              value={gift.image?.url ?? ''}
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
                              value={gift.image?.alt ?? ''}
                              onChange={(e) => handleGiftImageAltChange(index, e.target.value)}
                              disabled={isViewMode}
                              placeholder="Mô tả hình ảnh (alt text)"
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm disabled:bg-gray-100"
                            />
                          </div>

                          {/* Số lượng và giá trị */}
                          <div className="space-y-1">
                            <label htmlFor={`gift-quantity-${index}`} className="block text-sm font-medium text-gray-700">
                              Số lượng quà / đơn hàng
                            </label>
                            <input
                              type="number"
                              id={`gift-quantity-${index}`}
                              value={gift.quantity}
                              onChange={(e) => handleGiftChange(index, 'quantity', parseInt(e.target.value) || 1)} // Default to 1 if parsing fails
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
                              onChange={(e) => handleGiftChange(index, 'value', parseInt(e.target.value) || 0)} // Default to 0
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
                                value={gift.conditions?.minPurchaseAmount ?? ''}
                                onChange={(e) => handleGiftConditionChange(index, 'minPurchaseAmount', parseInt(e.target.value) || 0)}
                                disabled={isViewMode}
                                min="0"
                                step="1000"
                                placeholder="Bỏ trống nếu không áp dụng"
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
                                value={gift.conditions?.minQuantity ?? ''}
                                onChange={(e) => handleGiftConditionChange(index, 'minQuantity', parseInt(e.target.value) || 1)}
                                disabled={isViewMode}
                                min="1"
                                placeholder="Bỏ trống nếu không áp dụng"
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
                                value={gift.conditions?.startDate ? new Date(gift.conditions.startDate).toISOString().split('T')[0] : ''}
                                onChange={(e) => handleGiftConditionChange(index, 'startDate', e.target.value || null)} // Send null if empty
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
                                value={gift.conditions?.endDate ? new Date(gift.conditions.endDate).toISOString().split('T')[0] : ''}
                                onChange={(e) => handleGiftConditionChange(index, 'endDate', e.target.value || null)} // Send null if empty
                                disabled={isViewMode}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm disabled:bg-gray-100"
                              />
                            </div>

                            {/* Số lượng giới hạn */}
                            <div className="space-y-1 md:col-span-2"> {/* Make it full width */}
                              <label htmlFor={`gift-limited-quantity-${index}`} className="block text-sm font-medium text-gray-700">
                                Số lượng giới hạn (0 = không giới hạn)
                              </label>
                              <input
                                type="number"
                                id={`gift-limited-quantity-${index}`}
                                value={gift.conditions?.limitedQuantity ?? ''}
                                onChange={(e) => handleGiftConditionChange(index, 'limitedQuantity', parseInt(e.target.value) || 0)}
                                disabled={isViewMode}
                                min="0"
                                placeholder="Nhập 0 nếu không giới hạn số lượng"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm disabled:bg-gray-100"
                              />
                            </div>
                          </div>
                        </div>
                      </Disclosure.Panel>
                    </Transition>
                  </div>
                </>
              )}
            </Disclosure>
          ))}
        </div>
      ) : (
        // Phần hiển thị khi không có quà tặng nào
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
