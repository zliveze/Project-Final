import React, { useState } from 'react';
import { FiHeart, FiShoppingCart, FiMinus, FiPlus, FiShare2, FiAward, FiGift, FiStar } from 'react-icons/fi';
import { toast } from 'react-toastify';
import ProductVariants, { Variant } from './ProductVariants'; // Variant is already imported
import Link from 'next/link';
import Image from 'next/image';
// Remove checkAuth import if no longer needed elsewhere in the file
// import { checkAuth } from '@/utils/auth';
// import { useRouter } from 'next/router'; // Import useRouter for potential redirect

// Context Hooks
import { useCart } from '@/contexts/user/cart/CartContext'; // Import useCart
import { useAuth } from '@/contexts/AuthContext'; // Import useAuth

// Define Image structure for logo
interface ImageType {
  url: string;
  alt?: string;
  publicId?: string;
}

// Define and Export BrandWithLogo
export interface BrandWithLogo {
  _id: string;
  name: string;
  slug: string;
  logo?: ImageType; // Add optional logo
}

interface Gift {
  giftId: string;
  name: string;
  description: string;
  image: {
    url: string;
    alt: string;
  };
  quantity: number;
  value: number;
  type: string;
  conditions: {
    minPurchaseAmount: number;
    minQuantity: number;
    startDate: string;
    endDate: string;
    limitedQuantity: number;
  };
  status: string;
}

interface ProductInfoProps {
  _id: string;
  name: string;
  sku: string;
  description: {
    short: string;
  };
  price: number;
  currentPrice: number;
  status: string;
  brand: BrandWithLogo; // Use the new interface
  cosmetic_info: {
    skinType: string[];
    concerns: string[];
    ingredients: string[];
    volume: {
      value: number;
      unit: string;
    };
    madeIn: string;
  };
  variants: Variant[];
  flags: {
    isBestSeller: boolean;
    isNew: boolean;
    isOnSale: boolean;
    hasGifts: boolean;
  };
  gifts: Gift[];
  reviews: {
    averageRating: number;
    reviewCount: number;
  };
  // Add props for selected variant state management
  selectedVariant: Variant | null;
  onSelectVariant: (variant: Variant | null) => void;
}

// Re-export Variant type for use in [slug].tsx
export type { Variant };

const ProductInfo: React.FC<ProductInfoProps> = ({
  _id,
  name,
  sku,
  description,
  price,
  currentPrice,
  status,
  brand,
  // cosmetic_info not used directly in this component
  variants,
  flags,
  gifts,
  reviews,
  // Destructure the new props
  selectedVariant,
  onSelectVariant,
}) => {
  const { addItemToCart } = useCart(); // Get addItemToCart from context
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth(); // Get isAuthenticated and isLoading
  const [quantity, setQuantity] = useState(1);
  const [showGifts, setShowGifts] = useState(false);

  // Helper to parse color string (duplicate from ProductVariants for now, consider moving to utils)
  const parseColorString = (colorString?: string): { name: string, code: string } => {
    if (!colorString) return { name: '', code: '' };
    const regex = /^(.*?)(?:\s*"(#[0-9a-fA-F]{6})")?$/;
    const match = colorString.match(regex);
    if (match) {
      return { name: match[1].trim(), code: match[2] || '' };
    }
    return { name: colorString, code: '' };
  };

  const inStock = status === 'active';

  // Use the selected variant's price if available, otherwise use the base product price
  const displayPrice = selectedVariant?.price || price;
  const displayCurrentPrice = selectedVariant?.price || currentPrice;
  const discount = displayPrice > displayCurrentPrice ? Math.round(((displayPrice - displayCurrentPrice) / displayPrice) * 100) : 0;

  // Xử lý thay đổi số lượng
  const handleQuantityChange = (value: number) => {
    if (value < 1) return;
    // Add check against max quantity if available from selectedVariant (needs stock in Variant interface)
    // if (selectedVariant && value > selectedVariant.stock) {
    //   toast.warn(`Số lượng tối đa cho phiên bản này là ${selectedVariant.stock}`);
    //   return;
    // }
    setQuantity(value);
  };

  // Xử lý thêm vào giỏ hàng - Use context function
  const handleAddToCart = async () => {
    // Basic check based on overall product status
    if (!inStock) {
       toast.error('Sản phẩm hiện đang hết hàng', {
        position: "bottom-right",
        autoClose: 3000,
        theme: "light",
        style: { backgroundColor: '#f8d7da', color: '#721c24', borderLeft: '4px solid #721c24' }
      });
       return;
    }

    // Note: Detailed stock check for the specific variant should happen in the backend/context.

    // Kiểm tra đăng nhập bằng isAuthenticated từ context, chỉ khi không còn loading
    if (!isAuthLoading && !isAuthenticated) {
        toast.info('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng');
        // Optional: Redirect to login page
        // router.push('/auth/login');
        return;
    }

    // Ensure a variant is selected if variants exist
    if (variants && variants.length > 0 && !selectedVariant) {
        toast.warn('Vui lòng chọn một phiên bản sản phẩm (màu sắc, kích thước,...)', {
            position: "bottom-right",
            autoClose: 3000,
            theme: "light",
        });
        return;
    }

    // Get the correct variantId to add
    const variantIdToAdd = selectedVariant?.variantId;

    // Double-check variantId requirement if variants exist
    if (variants && variants.length > 0 && !variantIdToAdd) {
        console.error("Lỗi logic: Có variants nhưng không có selectedVariant.variantId");
        toast.error('Đã xảy ra lỗi, không thể xác định phiên bản sản phẩm.');
        return;
    }

    // Construct options object for the backend DTO based on selectedVariant
    const optionsForBackend: Record<string, string> = {};
    if (selectedVariant?.options?.color) {
        const { name: colorName } = parseColorString(selectedVariant.options.color);
        if (colorName) optionsForBackend['Color'] = colorName;
    }
    // Assuming the first selected size/shade is what we send (adjust if multiple selections are possible)
    if (selectedVariant?.options?.sizes && selectedVariant.options.sizes.length > 0) {
        optionsForBackend['Size'] = selectedVariant.options.sizes[0];
    }
    if (selectedVariant?.options?.shades && selectedVariant.options.shades.length > 0) {
        optionsForBackend['Shade'] = selectedVariant.options.shades[0];
    }

    // Call the context function based on whether variants exist

    if (variants && variants.length > 0) {
        // Variants exist, variantIdToAdd must be a string here due to earlier check
        if (variantIdToAdd) {
             // Explicitly ensure variantIdToAdd is not undefined before passing
             await addItemToCart(
                _id, // productId
                variantIdToAdd as string, // Assert as string to satisfy TypeScript
                quantity,
                optionsForBackend
            );
        } else {
             // This case should ideally not be reached due to the check above, but added for safety
             console.error("Lỗi logic: Không thể thêm vào giỏ hàng vì thiếu variantId dù có variants.");
             toast.error('Vui lòng chọn lại phiên bản sản phẩm.');
             return; // Exit if variantId is missing when required
        }
    } else {
        // No variants exist, explicitly pass undefined
        await addItemToCart(
            _id, // productId
            undefined, // Explicitly pass undefined for variantId
            quantity,
            optionsForBackend // Options might be empty, which is fine
        );
    }

    // Toast messages are handled by the context
    // Optional: Add specific UI feedback here if needed, e.g., button loading state
    // if (success) {
    //   // Optional: Dispatch event if header needs separate update mechanism
    //   const event = new CustomEvent('cart:updated');
    //   window.dispatchEvent(event);
    // }
  };

  // Xử lý thêm vào danh sách yêu thích (Keep existing logic, but use isAuthenticated and isLoading)
  const handleAddToWishlist = async () => {
    // Kiểm tra đăng nhập bằng isAuthenticated từ context, chỉ khi không còn loading
    if (!isAuthLoading && !isAuthenticated) {
        toast.info('Vui lòng đăng nhập để thêm sản phẩm vào danh sách yêu thích');
        // Optional: Redirect to login page
        // router.push('/auth/login');
        return;
    }

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
      const response = await fetch(`${API_URL}/wishlist/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ productId: _id })
      });
      if (response.ok) {
        toast.success('Đã thêm sản phẩm vào danh sách yêu thích', { /* ...styles */ });
        window.dispatchEvent(new CustomEvent('wishlist:updated'));
      } else {
        const errorData = await response.json();
        if (response.status === 409) {
          toast.info('Sản phẩm đã có trong danh sách yêu thích của bạn', { /* ...styles */ });
        } else {
          toast.error(errorData.message || 'Không thể thêm vào danh sách yêu thích', { /* ...styles */ });
        }
      }
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      toast.error('Đã xảy ra lỗi khi thêm vào danh sách yêu thích', { /* ...styles */ });
    }
  };

  // Xử lý chia sẻ sản phẩm (Keep existing logic)
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: name, text: description.short, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Đã sao chép đường dẫn sản phẩm', { /* ...styles */ });
    }
  };

  return (
    <div className="space-y-6">
      {/* Thương hiệu */}
      <div className="flex items-center space-x-2">
        {brand.logo?.url && (
          <div className="relative h-6 w-6 flex-shrink-0">
            <Image src={brand.logo.url} alt={brand.logo.alt || brand.name} fill className="object-contain rounded-sm" />
          </div>
        )}
        <Link href={`/brands/${brand.slug}`} className="text-[#d53f8c] text-sm font-medium hover:underline">
          {brand.name}
        </Link>
        {flags.isBestSeller && ( <div className="ml-3 flex items-center text-amber-500 bg-amber-50 px-2 py-1 rounded-full text-xs font-medium"><FiAward className="mr-1" /><span>Bán chạy nhất</span></div> )}
        {flags.isNew && ( <div className="ml-3 flex items-center text-blue-500 bg-blue-50 px-2 py-1 rounded-full text-xs font-medium"><span>Mới</span></div> )}
      </div>

      {/* Tên sản phẩm */}
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800 leading-tight">{name}</h1>

      {/* Mô tả ngắn */}
      <p className="text-gray-600 leading-relaxed">{description.short}</p>

      {/* Đánh giá */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center">
          <div className="flex items-center text-amber-400">
            {[...Array(5)].map((_, i) => ( <FiStar key={i} className={`w-4 h-4 ${i < Math.floor(reviews.averageRating) ? 'fill-current' : ''}`} /> ))}
          </div>
          <span className="ml-2 text-gray-600 text-sm">{reviews.averageRating.toFixed(1)}</span>
        </div>
        <span className="text-gray-400">|</span>
        <Link href="#reviews" className="text-sm text-gray-600 hover:text-[#d53f8c] hover:underline">
          {reviews.reviewCount} đánh giá
        </Link>
        <span className="text-gray-400">|</span>
        <span className="text-sm text-gray-600">SKU: {sku}</span>
      </div>

      {/* Giá */}
      <div className="flex items-end space-x-3 mt-2">
        <span className="text-2xl md:text-3xl font-bold text-[#d53f8c]">
          {displayCurrentPrice.toLocaleString('vi-VN')}đ
        </span>
        {discount > 0 && (
          <>
            <span className="text-lg text-gray-400 line-through">{displayPrice.toLocaleString('vi-VN')}đ</span>
            <span className="text-sm font-medium text-red-500 bg-red-50 px-2 py-1 rounded-full">-{discount}%</span>
          </>
        )}
      </div>

      {/* Biến thể sản phẩm */}
      {variants.length > 0 && (
        <div className="pt-4">
          <ProductVariants
            variants={variants}
            selectedVariant={selectedVariant}
            onSelectVariant={onSelectVariant}
          />
        </div>
      )}

      {/* Quà tặng */}
      {flags.hasGifts && gifts.length > 0 && (
        <div className="border border-[#fdf2f8] rounded-lg p-4 bg-[#fdf2f8] bg-opacity-20">
          <div className="flex justify-between items-center cursor-pointer" onClick={() => setShowGifts(!showGifts)}>
            <div className="flex items-center text-[#d53f8c] font-medium"><FiGift className="mr-2" /><span>Quà tặng kèm khi mua sản phẩm</span></div>
            <span className="text-[#d53f8c]">{showGifts ? '−' : '+'}</span>
          </div>
          {showGifts && (
            <div className="mt-3 space-y-2">
              {gifts.map((gift) => (
                <div key={gift.giftId} className="flex items-center space-x-3 bg-white p-2 rounded-md">
                  <div className="w-10 h-10 min-w-[40px] flex items-center justify-center rounded-md overflow-hidden border border-gray-200">
                    <Image src={gift.image.url} alt={gift.image.alt} width={40} height={40} className="object-cover" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-800">{gift.name}</div>
                    <div className="text-xs text-gray-500 leading-tight">{gift.description}</div>
                  </div>
                  <div className="text-xs font-medium text-[#d53f8c]">{gift.value.toLocaleString('vi-VN')}đ</div>
                </div>
              ))}
              <div className="text-xs text-gray-500 pt-1">* Áp dụng cho đơn hàng từ {gifts[0].conditions.minPurchaseAmount.toLocaleString('vi-VN')}đ</div>
            </div>
          )}
        </div>
      )}

      {/* Số lượng và nút mua hàng */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 pt-2">
        {/* Số lượng */}
        <div className="flex items-center h-12 border border-gray-300 rounded-md overflow-hidden">
          <button onClick={() => handleQuantityChange(quantity - 1)} disabled={quantity <= 1} className="w-12 h-full flex items-center justify-center text-gray-600 hover:text-[#d53f8c] disabled:opacity-50 disabled:cursor-not-allowed"><FiMinus /></button>
          <div className="flex-1 h-full flex items-center justify-center text-gray-800 font-medium">{quantity}</div>
          <button onClick={() => handleQuantityChange(quantity + 1)} className="w-12 h-full flex items-center justify-center text-gray-600 hover:text-[#d53f8c]"><FiPlus /></button>
        </div>

        {/* Button thêm vào giỏ hàng */}
        <button
          onClick={handleAddToCart}
          disabled={!inStock}
          className={`lg:col-span-2 h-12 rounded-md font-medium text-white ${inStock ? 'bg-gradient-to-r from-[#d53f8c] to-[#805ad5] hover:from-[#b83280] hover:to-[#6b46c1]' : 'bg-gray-300 cursor-not-allowed'} transition-colors duration-300 flex items-center justify-center space-x-2`}
        >
          <FiShoppingCart className="w-4 h-4" />
          <span>{inStock ? 'Thêm vào giỏ hàng' : 'Hết hàng'}</span>
        </button>

        {/* Button yêu thích */}
        <button
          onClick={handleAddToWishlist}
          className="h-12 border border-gray-300 rounded-md font-medium text-gray-700 hover:text-[#d53f8c] hover:border-[#d53f8c] transition-colors duration-300 flex items-center justify-center"
        >
          <FiHeart className="w-4 h-4" />
        </button>
      </div>

      {/* Nút chia sẻ */}
      <button onClick={handleShare} className="text-gray-600 hover:text-[#d53f8c] flex items-center text-sm font-medium">
        <FiShare2 className="mr-1" />
        <span>Chia sẻ sản phẩm</span>
      </button>
    </div>
  );
};

export default ProductInfo;
