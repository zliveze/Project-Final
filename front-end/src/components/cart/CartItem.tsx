import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FiTrash2, FiMinus, FiPlus } from 'react-icons/fi';
import { formatImageUrl } from '@/utils/imageUtils';
import BranchSelectionModal from './BranchSelectionModal';

interface CartItemProps {
  _id: string; // Keep _id if CartPage still passes variantId as _id
  productId: string;
  variantId: string; // Make variantId required
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
  branchInventory?: Array<{ branchId: string; quantity: number }>; // Add branch inventory
  selectedBranchId?: string; // Add selected branch
  onUpdateQuantity: (id: string, quantity: number, showToast?: boolean, selectedBranchId?: string) => void;
  onRemove: (id: string) => void;
}

const CartItem: React.FC<CartItemProps> = ({
  // _id and productId are available but not directly used in this component
  variantId, // Destructure variantId
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
  onRemove
}) => {
  // State for branch selection modal
  const [showBranchModal, setShowBranchModal] = React.useState(false);
  const [selectedBranch, setSelectedBranch] = React.useState<string | null>(selectedBranchId || null);
  // Calculate the maximum quantity available in a single branch
  const maxSingleBranchQuantity = branchInventory.length > 0
    ? Math.max(...branchInventory.map(b => b.quantity))
    : maxQuantity;

  // Xử lý tăng số lượng - Pass variantId
  const handleIncreaseQuantity = () => {
    // If we're within the limits of a single branch, just increase
    if (quantity < maxSingleBranchQuantity) {
      onUpdateQuantity(variantId, quantity + 1, false);
    }
    // If we're exceeding a single branch but still within total inventory
    else if (quantity < maxQuantity) {
      // Show branch selection modal without automatically increasing quantity
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

  // Xử lý giảm số lượng - Pass variantId
  const handleDecreaseQuantity = () => {
    if (quantity > 1) {
      onUpdateQuantity(variantId, quantity - 1, false); // Use variantId, don't show toast
    }
  };

  // Tính tổng giá của sản phẩm
  const itemTotal = price * quantity;

  // Tính số tiền tiết kiệm nếu có giá gốc
  const savedAmount = originalPrice ? (originalPrice - price) * quantity : 0;
  const discountPercentage = originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

  // Handle branch selection
  const handleSelectBranch = (branchId: string) => {
    setSelectedBranch(branchId);
    setShowBranchModal(false);

    // Find the selected branch's inventory
    const selectedBranchInventory = branchInventory.find(b => b.branchId === branchId);

    if (selectedBranchInventory) {
      // Only increase quantity if it's within the selected branch's limit
      const newQuantity = Math.min(quantity + 1, selectedBranchInventory.quantity);

      // Only update if the quantity actually changes
      if (newQuantity > quantity) {
        // Pass the selected branch ID to the update function
        onUpdateQuantity(variantId, newQuantity, false, branchId);
      } else {
        // Show a toast notification if we can't increase the quantity
        import('react-toastify').then(({ toast }) => {
          toast.info(`Chi nhánh này chỉ còn ${selectedBranchInventory.quantity} sản phẩm`, {
            position: "bottom-right",
            autoClose: 2000,
            hideProgressBar: true,
          });
        });
      }
    }
  };

  return (
    <div className={`flex flex-col md:flex-row py-4 border-b border-gray-200 ${!inStock ? 'opacity-70' : ''}`}>
      {/* Branch Selection Modal */}
      <BranchSelectionModal
        isOpen={showBranchModal}
        onClose={() => setShowBranchModal(false)}
        branchInventory={branchInventory.map(b => ({ ...b, name: `Chi nhánh ${b.branchId.substring(0, 6)}...` }))}
        currentQuantity={quantity}
        maxQuantity={maxQuantity}
        onSelectBranch={handleSelectBranch}
      />
      {/* Ảnh sản phẩm */}
      <div className="md:w-24 md:h-24 w-full h-32 relative mb-3 md:mb-0 flex-shrink-0">
        <Link href={`/product/${slug}`}>
          <div className="relative w-full h-full">
            <Image
              src={formatImageUrl(image.url)}
              alt={image.alt}
              fill
              className="object-cover rounded-md"
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

            {/* Hiển thị tùy chọn đã chọn */}
            {selectedOptions && Object.keys(selectedOptions).length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                <div className="w-full text-xs text-gray-500 mb-1">Phiên bản đã chọn:</div>
                {Object.entries(selectedOptions).map(([key, value]) => {
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
                  Còn lại: <span className={`font-medium ${maxQuantity < 5 ? 'text-orange-500' : 'text-green-600'}`}>{maxQuantity}</span> sản phẩm
                  {branchInventory.length > 1 && (
                    <span className="ml-1 text-xs text-blue-500">
                      (tổng từ {branchInventory.length} chi nhánh)
                    </span>
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
                onClick={() => onRemove(variantId)} // Use variantId
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
          onClick={() => onRemove(variantId)} // Use variantId
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
