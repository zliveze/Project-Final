import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FiTrash2, FiMinus, FiPlus, FiMapPin } from 'react-icons/fi';
import { formatImageUrl } from '@/utils/imageUtils';
import BranchSelectionModal from './BranchSelectionModal';
import { useBranches } from '@/hooks/useBranches';

interface CartItemProps {
  _id: string; // This will now be the unique CartProduct ID (e.g., variantId-combinationId)
  productId: string;
  variantId: string; // This remains the actual variantId (e.g., new-123)
  name: string;
  slug: string;
  image: {
    url: string;
    alt: string;
  };
  brand: {
    name: string;
    slug: string;
  };
  price: number;
  originalPrice?: number;
  quantity: number;
  selectedOptions?: Record<string, string>; // Changed to Record to support all option types
  inStock: boolean;
  maxQuantity: number;
  branchInventory?: Array<{ branchId: string; quantity: number; branchName?: string }>; // Add branch inventory with name
  selectedBranchId?: string; // Add selected branch
  onUpdateQuantity: (itemId: string, quantity: number, showToast?: boolean, selectedBranchId?: string) => void;
  onRemove: (itemId: string) => void;
  // Selection props
  isSelected?: boolean;
  canSelect?: boolean;
  onSelect?: (itemId: string) => void;
  onUnselect?: (itemId: string) => void;
}

const CartItem: React.FC<CartItemProps> = ({
  _id, // Use the unique CartProduct ID passed as _id
  variantId, // Keep actual variantId for other uses if needed
  name,
  slug,
  image,
  brand,
  price,
  originalPrice,
  quantity,
  selectedOptions,
  inStock,
  maxQuantity,
  branchInventory = [],
  selectedBranchId,
  onUpdateQuantity,
  onRemove,
  // Selection props
  isSelected = false,
  canSelect = true,
  onSelect,
  onUnselect
}) => {
  // State for branch selection modal
  const [showBranchModal, setShowBranchModal] = React.useState(false);
  const [imageError, setImageError] = useState(false);
  
  // Use the branches hook to get branch information
  const { getBranchName, error: branchError, preloadBranches } = useBranches();

  // Handle image error
  const handleImageError = () => {
    setImageError(true);
  };

  // Preload branches when component mounts
  React.useEffect(() => {
    preloadBranches();
  }, [preloadBranches]);

  // Xử lý tăng số lượng
  const handleIncreaseQuantity = () => {
    // If we have a selected branch, check against that branch's inventory
    if (selectedBranchId) {
      const branchStock = branchInventory.find(b => b.branchId === selectedBranchId)?.quantity || 0;

      // If we can increase within this branch's inventory
      if (quantity < branchStock) {
        onUpdateQuantity(_id, quantity + 1, false, selectedBranchId); // Use _id
      } else {
        // Show branch selection modal to let user choose another branch
        setShowBranchModal(true);
      }
    }
    // If no branch is selected yet
    else if (branchInventory.length > 0) {
      // Always show branch selection modal first
      setShowBranchModal(true);
    }
    // If we're at the maximum total inventory
    else {
      // Show a toast notification when trying to exceed max quantity
      import('react-toastify').then(({ toast }) => {
        toast.info(`Số lượng tối đa có thể mua là ${maxQuantity}`, {
          position: "bottom-right",
          autoClose: 2000,
          hideProgressBar: true,
        });
      });
    }
  };

  // Xử lý giảm số lượng
  const handleDecreaseQuantity = () => {
    if (quantity > 1) {
      onUpdateQuantity(_id, quantity - 1, false); // Use _id
    }
  };

  // Tính tổng giá của sản phẩm
  const itemTotal = price * quantity;

  // Tính số tiền tiết kiệm nếu có giá gốc
  const savedAmount = originalPrice ? (originalPrice - price) * quantity : 0;
  const discountPercentage = originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

  // Handle checkbox selection
  const handleCheckboxChange = (checked: boolean) => {
    if (checked) {
      onSelect?.(_id);
    } else {
      onUnselect?.(_id);
    }
  };

  // Handle branch selection
  const handleSelectBranch = (branchId: string) => {
    setShowBranchModal(false);

    // Find the selected branch's inventory
    const selectedBranchInventory = branchInventory.find(b => b.branchId === branchId);

    if (selectedBranchInventory) {
      // Set the quantity to 1 or keep current quantity if it's within the branch's limit
      const newQuantity = Math.min(quantity || 1, selectedBranchInventory.quantity);

      // Pass the selected branch ID to the update function
      onUpdateQuantity(_id, newQuantity, false, branchId); // Use _id

      // Show a toast notification about the branch selection
      import('react-toastify').then(({ toast }) => {
        toast.success(`Đã chọn ${selectedBranchInventory.branchName || `Chi nhánh ${branchId.substring(0, 6)}...`}`, {
          position: "bottom-right",
          autoClose: 2000,
          hideProgressBar: true,
        });
      });
    }
  };

  return (
    <div className={`flex flex-col md:flex-row py-4 border-b border-gray-200 ${!inStock ? 'opacity-70' : ''}`}>
      {/* Branch Selection Modal */}
      <BranchSelectionModal
        isOpen={showBranchModal}
        onClose={() => setShowBranchModal(false)}
        branchInventory={branchInventory.map(b => ({
          ...b,
          name: b.branchName || getBranchName(b.branchId)
        }))}
        currentQuantity={quantity}
        maxQuantity={maxQuantity}
        initialBranchId={selectedBranchId}
        onSelectBranch={handleSelectBranch}
      />

      {/* Checkbox để chọn sản phẩm */}
      <div className="flex items-start mr-3 mt-1">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => handleCheckboxChange(e.target.checked)}
          disabled={!canSelect || !inStock}
          className={`w-4 h-4 rounded border-2 focus:ring-2 focus:ring-pink-500 ${
            canSelect && inStock
              ? 'text-pink-600 border-gray-300 focus:border-pink-500'
              : 'text-gray-400 border-gray-200 cursor-not-allowed'
          }`}
          title={
            !inStock
              ? 'Sản phẩm hết hàng'
              : !canSelect
                ? 'Không thể chọn sản phẩm khác chi nhánh'
                : 'Chọn sản phẩm để thanh toán'
          }
        />
      </div>

      {/* Ảnh sản phẩm */}
      <div className="md:w-24 md:h-24 w-full h-32 relative mb-3 md:mb-0 flex-shrink-0">
        <Link href={`/product/${slug}`}>
          <div className="relative w-full h-full">
            <Image
              src={imageError ? '/404.png' : formatImageUrl(image.url)}
              alt={image.alt}
              fill
              className="object-cover rounded-md"
              onError={handleImageError}
              placeholder="blur"
              blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R+h2R1X9Dp"
            />
          </div>
        </Link>
      </div>

      {/* Thông tin sản phẩm */}
      <div className="md:ml-4 flex-grow">
        <div className="flex flex-col md:flex-row justify-between">
          <div className="flex-grow">
            <Link href={`/brands/${brand.slug}`} className="text-xs text-gray-500 hover:text-pink-600">
              {brand.name}
            </Link>

            <Link href={`/product/${slug}`}>
              <h3 className="text-sm font-medium text-gray-800 line-clamp-2 hover:text-pink-600 transition-colors">
                {name}
              </h3>
            </Link>

            {/* Hiển thị chi nhánh đã chọn */}
            <div className="mt-1 flex items-center gap-2">
              {selectedBranchId ? (
                <div className="flex items-center bg-pink-50 px-2 py-1 rounded-md border border-pink-100">
                  <FiMapPin className="text-pink-500 mr-1" size={14} />
                  <span className="text-xs font-medium text-pink-700">
                    {branchInventory.find(b => b.branchId === selectedBranchId)?.branchName ||
                     getBranchName(selectedBranchId)}
                  </span>
                </div>
              ) : (
                <div className="text-xs text-orange-500 font-medium">
                  Chưa chọn chi nhánh
                </div>
              )}

              <button
                onClick={() => setShowBranchModal(true)}
                className="text-xs text-blue-500 hover:text-blue-700 hover:underline"
              >
                {selectedBranchId ? 'Thay đổi' : 'Chọn chi nhánh'}
              </button>
            </div>

            {/* Hiển thị tùy chọn đã chọn */}
            {selectedOptions && Object.keys(selectedOptions).length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                <div className="w-full text-xs text-gray-500 mb-1">Phiên bản đã chọn:</div>
                {Object.entries(selectedOptions).map(([key, value]) => {
                  // Skip selectedBranchId and combinationId if they're in the options
                  if (key === 'selectedBranchId' || key === 'combinationId') return null;

                  // Map option keys to Vietnamese labels
                  const optionLabels: Record<string, string> = {
                    'Color': 'Màu',
                    'Size': 'Dung tích',
                    'Shade': 'Tone',
                    // Add more mappings as needed
                  };

                  const label = optionLabels[key] || key;

                  // Parse color value to extract color code if available
                  let colorCode = '';
                  if (key === 'Color') {
                    const colorMatch = value.match(/^(.*?)\s*"(#[0-9a-fA-F]{6})"$/);
                    if (colorMatch && colorMatch.length === 3) {
                      colorCode = colorMatch[2];
                    }
                  }

                  return (
                    <div key={key} className="flex items-center text-xs bg-pink-50 px-2 py-1 rounded-md text-gray-700 border border-pink-100">
                      <span className="font-medium mr-1">{label}:</span>
                      {colorCode ? (
                        <div className="flex items-center">
                          <span className="mr-1">{value.split('"')[0].trim()}</span>
                          <div
                            className="w-3 h-3 rounded-full inline-block ml-1"
                            style={{ backgroundColor: colorCode }}
                            title={colorCode}
                          />
                        </div>
                      ) : (
                        <span>{value}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Trạng thái tồn kho */}
            {!inStock ? (
              <div className="mt-1">
                <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                  Hết hàng
                </span>
              </div>
            ) : (
              <div className="mt-1">
                <span className="text-xs text-gray-500">
                  {selectedBranchId ? (
                    <>
                      Số lượng kho: <span className={`font-medium ${(branchInventory.find(b => b.branchId === selectedBranchId)?.quantity || 0) < 5 ? 'text-orange-500' : 'text-green-600'}`}>
                        {branchInventory.find(b => b.branchId === selectedBranchId)?.quantity || 0}
                      </span> sản phẩm
                    </>
                  ) : (
                    <>
                      Còn lại: <span className={`font-medium ${maxQuantity < 5 ? 'text-orange-500' : 'text-green-600'}`}>{maxQuantity}</span> sản phẩm
                      {branchInventory.length > 1 && (
                        <span className="ml-1 text-xs text-blue-500">
                          (tổng từ {branchInventory.length} chi nhánh)
                        </span>
                      )}
                    </>
                  )}
                </span>
              </div>
            )}
          </div>

          {/* Giá và số lượng - hiển thị trên mobile */}
          <div className="mt-3 md:hidden">
            {/* Hiển thị giá trên mobile */}
            <div className="mb-2">
              <div className="text-pink-600 font-medium">
                {new Intl.NumberFormat('vi-VN').format(itemTotal)}đ
              </div>
              {originalPrice && originalPrice > price && (
                <div className="flex items-start">
                  <span className="text-xs text-gray-400 line-through mr-2">
                    {new Intl.NumberFormat('vi-VN').format(originalPrice * quantity)}đ
                  </span>
                  <span className="text-xs text-pink-500">
                    -Tiết kiệm {discountPercentage}%
                  </span>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <button
                  onClick={handleDecreaseQuantity}
                  disabled={quantity <= 1 || !inStock}
                  className={`w-8 h-8 flex items-center justify-center rounded-full border ${
                    quantity <= 1 || !inStock ? 'border-gray-200 text-gray-300' : 'border-gray-300 text-gray-600 hover:border-pink-500 hover:text-pink-600'
                  }`}
                >
                  <FiMinus size={14} />
                </button>
                <span className="mx-2 w-8 text-center text-sm relative">
                  {quantity}
                  {quantity >= maxQuantity && (
                    <span className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 bg-pink-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                      !
                    </span>
                  )}
                </span>
                <button
                  onClick={handleIncreaseQuantity}
                  disabled={quantity >= maxQuantity || !inStock}
                  className={`w-8 h-8 flex items-center justify-center rounded-full border ${
                    quantity >= maxQuantity || !inStock ? 'border-gray-200 text-gray-300' : 'border-gray-300 text-gray-600 hover:border-pink-500 hover:text-pink-600'
                  }`}
                >
                  <FiPlus size={14} />
                </button>
              </div>
              <button
                onClick={() => onRemove(_id)} // Use _id
                className="ml-4 p-2 text-gray-400 hover:text-pink-600 transition-colors"
                title="Xóa sản phẩm"
              >
                <FiTrash2 size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Giá và số lượng - hiển thị trên desktop */}
      <div className="hidden md:flex items-center space-x-4 ml-4">
        {/* Số lượng */}
        <div className="flex items-center">
          <button
            onClick={handleDecreaseQuantity}
            disabled={quantity <= 1 || !inStock}
            className={`w-8 h-8 flex items-center justify-center rounded-full border ${
              quantity <= 1 || !inStock ? 'border-gray-200 text-gray-300' : 'border-gray-300 text-gray-600 hover:border-pink-500 hover:text-pink-600'
            }`}
          >
            <FiMinus size={14} />
          </button>
          <span className="mx-2 w-8 text-center text-sm">{quantity}</span>
          <button
            onClick={handleIncreaseQuantity}
            disabled={quantity >= maxQuantity || !inStock}
            className={`w-8 h-8 flex items-center justify-center rounded-full border ${
              quantity >= maxQuantity || !inStock ? 'border-gray-200 text-gray-300' : 'border-gray-300 text-gray-600 hover:border-pink-500 hover:text-pink-600'
            }`}
          >
            <FiPlus size={14} />
          </button>
        </div>

        {/* Giá */}
        <div className="w-28 text-right">
          <div className="text-pink-600 font-medium">
            {new Intl.NumberFormat('vi-VN').format(itemTotal)}đ
          </div>
          {originalPrice && originalPrice > price && (
            <div className="flex flex-col items-end">
              <span className="text-xs text-gray-400 line-through">
                {new Intl.NumberFormat('vi-VN').format(originalPrice * quantity)}đ
              </span>
              <span className="text-xs text-pink-500">
                Tiết kiệm {new Intl.NumberFormat('vi-VN').format(savedAmount)}đ (-{discountPercentage}%)
              </span>
            </div>
          )}
        </div>

        {/* Nút xóa */}
        <button
          onClick={() => onRemove(_id)} // Use _id
          className="p-2 text-gray-400 hover:text-pink-600 transition-colors"
          title="Xóa sản phẩm"
        >
          <FiTrash2 size={18} />
        </button>
      </div>
    </div>
  );
};

export default CartItem;
