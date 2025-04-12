import React, { useState, useEffect } from 'react';
import { FiHeart, FiShoppingCart, FiMinus, FiPlus, FiShare2, FiAward, FiGift, FiStar, FiMapPin } from 'react-icons/fi';
import { ToastContainer } from 'react-toastify';
import { toast } from 'react-toastify';
import ProductVariants, { Variant as ImportedVariant } from './ProductVariants'; // Import the Variant interface

// Extend the imported Variant interface to include totalStock
interface Variant extends ImportedVariant {
  totalStock?: number;
  inventory?: Array<{ branchId: string; quantity: number; branchName?: string }>;
}
import Link from 'next/link';
import Image from 'next/image';
// Remove checkAuth import if no longer needed elsewhere in the file
// import { checkAuth } from '@/utils/auth';
// import { useRouter } from 'next/router'; // Import useRouter for potential redirect

// Context Hooks
import { useCart } from '@/contexts/user/cart/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useWishlist } from '@/contexts/user/wishlist/WishlistContext'; // Import useWishlist
import { useBranches } from '@/hooks/useBranches';

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
  // Add branches prop
  branches?: Array<{ _id: string; name: string; address?: string; }>;
}

// Re-export Variant type for use in [slug].tsx
export type { Variant };

// Branch Selection Modal Component
interface BranchSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  branches: Array<{ branchId: string; branchName: string; quantity: number }>;
  currentQuantity: number;
  initialBranchId?: string | null;
  onSelectBranch: (branchId: string) => void;
}

const BranchSelectionModal: React.FC<BranchSelectionModalProps> = ({
  isOpen,
  onClose,
  branches,
  currentQuantity,
  initialBranchId,
  onSelectBranch
}) => {
  if (!isOpen) return null;

  // Use the branches hook to get branch information
  const { getBranchName } = useBranches();

  // State for selected branch - initialize with initialBranchId if provided
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(initialBranchId || null);

  // Update selectedBranchId when initialBranchId changes
  useEffect(() => {
    if (initialBranchId) {
      setSelectedBranchId(initialBranchId);
    }
  }, [initialBranchId]);

  // Sort branches by quantity (highest first)
  const sortedBranches = [...branches].sort((a, b) => b.quantity - a.quantity);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Chọn chi nhánh</h3>
        </div>

        <div className="px-6 py-4">
          <p className="text-sm text-gray-600 mb-4">
            Bạn đang muốn mua <span className="font-medium">{currentQuantity}</span> sản phẩm.
            Vui lòng chọn chi nhánh để tiếp tục.
          </p>
          <p className="text-xs text-blue-600 mb-4">
            Lưu ý: Số lượng tối đa bạn có thể mua từ mỗi chi nhánh phụ thuộc vào tồn kho của chi nhánh đó.
          </p>

          <div className="space-y-3 max-h-60 overflow-y-auto">
            {sortedBranches.map((branch) => (
              <div
                key={branch.branchId}
                className={`border rounded-md p-3 transition-colors ${branch.quantity > 0 ?
                  (branch.branchId === selectedBranchId ?
                    'border-pink-500 bg-pink-50' :
                    'border-gray-200 hover:border-pink-300 cursor-pointer') :
                  'border-gray-200 bg-gray-50 cursor-not-allowed'}`}
                onClick={() => {
                  if (branch.quantity > 0) {
                    setSelectedBranchId(branch.branchId);
                    onSelectBranch(branch.branchId);
                  }
                }}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium text-gray-800">
                      {branch.branchName || getBranchName(branch.branchId)}
                    </h4>
                    <p className="text-sm text-gray-500">
                      Còn <span className="font-medium">{branch.quantity}</span> sản phẩm
                    </p>
                  </div>
                  {branch.quantity > 0 && (
                    <span className="text-pink-500">
                      <FiMapPin />
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="px-6 py-3 bg-gray-50 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-500"
          >
            Hủy
          </button>
        </div>
      </div>
    </div>
  );
};

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
  branches = [],
}) => {
  const { addItemToCart, cartItems } = useCart();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const {
    addToWishlist,
    removeFromWishlist,
    isItemInWishlist,
    isLoading: isWishlistLoading // Get wishlist loading state
  } = useWishlist(); // Use Wishlist context
  const { getBranchName, preloadBranches } = useBranches();
  const [quantity, setQuantity] = useState(1);
  const [showGifts, setShowGifts] = useState(false);
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);

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

  // Calculate max quantity based on selected variant's inventory
  const totalStock = selectedVariant?.totalStock || 0;

  // Check if the selected variant is already in the cart
  const cartItem = selectedVariant ? cartItems.find(item => item.variantId === selectedVariant.variantId) : null;
  const cartQuantity = cartItem ? cartItem.quantity : 0;

  // Calculate available quantity (total stock minus what's already in the cart)
  const maxQuantity = Math.max(0, totalStock - cartQuantity);

  // Determine if the current variant is in stock (considering cart quantity)
  const variantInStock = selectedVariant ? maxQuantity > 0 : true;

  // Overall product availability - product is in stock AND selected variant (if any) is in stock
  const isAvailable = inStock && variantInStock;

  // For display purposes - show total stock, not just available stock
  const displayTotalStock = totalStock;

  // Use the selected variant's price if available, otherwise use the base product price
  const displayPrice = selectedVariant?.price || price;
  const displayCurrentPrice = selectedVariant?.price || currentPrice;
  const discount = displayPrice > displayCurrentPrice ? Math.round(((displayPrice - displayCurrentPrice) / displayPrice) * 100) : 0;

  // Get branch names for inventory and preload branches
  useEffect(() => {
    // Preload branches when component mounts
    preloadBranches();

    if (selectedVariant?.inventory && branches.length > 0) {
      // Update inventory with branch names
      const updatedInventory = selectedVariant.inventory.map(inv => {
        const branch = branches.find(b => b._id === inv.branchId);
        return {
          ...inv,
          branchName: branch?.name || 'Chi nhánh không xác định'
        };
      });

      // We can't directly modify selectedVariant, but we can log the updated inventory
      console.log('Updated inventory with branch names:', updatedInventory);
    }
  }, [selectedVariant, branches, preloadBranches]);

  // Xử lý thay đổi số lượng
  const handleQuantityChange = (value: number) => {
    if (value < 1) return;

    // If variant is selected but out of stock (considering cart quantity)
    if (selectedVariant && maxQuantity === 0) {
      if (cartQuantity > 0) {
        toast.warn(`Bạn đã thêm ${cartQuantity} sản phẩm này vào giỏ hàng. Không thể thêm nữa.`, {
          position: "bottom-right",
          autoClose: 2000,
          hideProgressBar: true
        });
      } else {
        toast.warn(`Phiên bản này hiện đang hết hàng`, {
          position: "bottom-right",
          autoClose: 2000,
          hideProgressBar: true
        });
      }
      return;
    }

    // If we're decreasing quantity, just do it
    if (value < quantity) {
      setQuantity(value);
      return;
    }

    // If we're increasing quantity
    if (selectedVariant && selectedVariant.inventory) {
      // Adjust branch inventory for cart quantity
      const adjustedInventory = selectedVariant.inventory.map(inv => ({
        ...inv,
        quantity: Math.max(0, inv.quantity - (cartItem?.selectedBranchId === inv.branchId ? cartQuantity : 0))
      }));

      // Find the branch with the highest adjusted inventory
      const maxBranchInventory = Math.max(...adjustedInventory.map(inv => inv.quantity || 0));

      // If the requested quantity exceeds the max in a single branch but is within available stock
      if (value > maxBranchInventory && value <= maxQuantity) {
        // Show branch selection modal
        setShowBranchModal(true);
        return;
      }

      // If the requested quantity exceeds available stock
      if (value > maxQuantity) {
        if (cartQuantity > 0) {
          toast.warn(`Bạn đã thêm ${cartQuantity} sản phẩm này vào giỏ hàng. Chỉ còn có thể thêm ${maxQuantity} sản phẩm nữa.`, {
            position: "bottom-right",
            autoClose: 3000,
            hideProgressBar: true
          });
        } else {
          toast.warn(`Số lượng tối đa cho phiên bản này là ${maxQuantity}`, {
            position: "bottom-right",
            autoClose: 2000,
            hideProgressBar: true
          });
        }
        return;
      }
    }

    setQuantity(value);
  };

  // Handle branch selection
  const handleSelectBranch = (branchId: string) => {
    setSelectedBranchId(branchId);
    setShowBranchModal(false);

    // Find the selected branch's inventory
    if (selectedVariant && selectedVariant.inventory) {
      const branchInventory = selectedVariant.inventory.find(inv => inv.branchId === branchId);
      if (branchInventory) {
        // Calculate available quantity in this branch (considering cart quantity)
        const branchCartQuantity = cartItem && cartItem.selectedBranchId === branchId ? cartQuantity : 0;
        const availableBranchQuantity = Math.max(0, branchInventory.quantity - branchCartQuantity);

        // Only adjust quantity if current selection exceeds available quantity
        if (quantity > availableBranchQuantity) {
          setQuantity(availableBranchQuantity);
          toast.info(`Số lượng đã được điều chỉnh theo tồn kho của chi nhánh ${getBranchName(branchId)}`, {
            position: "bottom-right",
            autoClose: 3000,
            hideProgressBar: true
          });
        }
        // Otherwise, keep the user's selected quantity
      }
    }
  };

  // Xử lý thêm vào giỏ hàng - Use context function
  const handleAddToCart = async () => {
    // Check if product or selected variant is out of stock
    if (!inStock) {
       toast.error('Sản phẩm hiện đang hết hàng', {
        position: "bottom-right",
        autoClose: 3000,
        theme: "light",
        style: { backgroundColor: '#f8d7da', color: '#721c24', borderLeft: '4px solid #721c24' }
      });
       return;
    }

    // Check if selected variant is out of stock or if trying to add more than available
    if (selectedVariant && maxQuantity === 0) {
      const selectedBranchName = selectedBranchId ?
        (selectedVariant.inventory?.find(inv => inv.branchId === selectedBranchId)?.branchName || getBranchName(selectedBranchId)) :
        'chi nhánh này';

      if (cartQuantity > 0) {
        toast.error(`Bạn đã thêm ${cartQuantity} sản phẩm này vào giỏ hàng. Không thể thêm nữa từ ${selectedBranchName}.`, {
          position: "bottom-right",
          autoClose: 3000,
          theme: "light",
          style: { backgroundColor: '#f8d7da', color: '#721c24', borderLeft: '4px solid #721c24' }
        });
      } else {
        toast.error(`Phiên bản này hiện đang hết hàng từ ${selectedBranchName}`, {
          position: "bottom-right",
          autoClose: 3000,
          theme: "light",
          style: { backgroundColor: '#f8d7da', color: '#721c24', borderLeft: '4px solid #721c24' }
        });
      }
      return;
    }

    // Check if trying to add more than available quantity
    if (selectedVariant && quantity > maxQuantity) {
      const selectedBranchName = selectedBranchId ?
        (selectedVariant.inventory?.find(inv => inv.branchId === selectedBranchId)?.branchName || getBranchName(selectedBranchId)) :
        'chi nhánh này';

      toast.error(`Chỉ còn có thể thêm ${maxQuantity} sản phẩm nữa vào giỏ hàng từ ${selectedBranchName}.`, {
        position: "bottom-right",
        autoClose: 3000,
        theme: "light",
        style: { backgroundColor: '#f8d7da', color: '#721c24', borderLeft: '4px solid #721c24' }
      });
      return;
    }

    // If we have inventory in multiple branches but no branch selected, show branch selection modal
    if (selectedVariant && selectedVariant.inventory && selectedVariant.inventory.length > 0 && !selectedBranchId) {
      setShowBranchModal(true);
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

    // Add branch selection to options if a branch is selected
    if (selectedBranchId) {
        optionsForBackend['selectedBranchId'] = selectedBranchId;
    }

    // Add variant options
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

    // Don't reset branch selection after adding to cart
    // This allows users to continue adding items from the same branch
    // setSelectedBranchId(null);

    // Toast messages are handled by the context
    // Optional: Add specific UI feedback here if needed, e.g., button loading state
    // if (success) {
    //   // Optional: Dispatch event if header needs separate update mechanism
    //   const event = new CustomEvent('cart:updated');
    //   window.dispatchEvent(event);
    // }
  };

  // Xử lý thêm/xóa khỏi danh sách yêu thích using WishlistContext
  const handleToggleWishlist = async () => {
    // Check login status
    if (!isAuthLoading && !isAuthenticated) {
      toast.info('Vui lòng đăng nhập để quản lý danh sách yêu thích.');
      return;
    }

    // Check if a variant needs to be selected
    if (variants && variants.length > 0 && !selectedVariant) {
      toast.warn('Vui lòng chọn một phiên bản sản phẩm để thêm/xóa khỏi yêu thích.', {
        position: "bottom-right",
        autoClose: 3000,
        theme: "light",
      });
      return;
    }

    // Get the required IDs
    const productId = _id;
    const variantId = selectedVariant?.variantId;

    // Check if variantId is required but missing
    if (variants && variants.length > 0 && !variantId) {
        console.error("Lỗi logic: Thiếu variantId khi cần thiết cho wishlist.");
        toast.error('Vui lòng chọn lại phiên bản sản phẩm.');
        return;
    }

    // Use the actual variantId (which is a string from the schema)
    const targetVariantId = variantId as string; // Assert as string based on previous checks

    const isInWishlist = isItemInWishlist(productId, targetVariantId);

    // Disable button while processing
    // Consider adding a specific loading state for the wishlist button if needed
    if (isWishlistLoading) return;

    if (isInWishlist) {
      // Remove from wishlist
      await removeFromWishlist(productId, targetVariantId);
    } else {
      // Add to wishlist
      await addToWishlist(productId, targetVariantId);
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

  // Determine if the current selected variant is in the wishlist
  const isCurrentVariantInWishlist = selectedVariant ? isItemInWishlist(_id, selectedVariant.variantId) : false;


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
        <span className="text-sm text-gray-600">SKU: {selectedVariant?.sku || sku}</span> {/* Show variant SKU if selected */}
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
        <div className="flex flex-col">
          <div className={`flex items-center h-12 border rounded-md overflow-hidden ${!isAvailable ? 'border-gray-200 bg-gray-100' : 'border-gray-300'}`}>
            <button
              onClick={() => handleQuantityChange(quantity - 1)}
              disabled={quantity <= 1 || !isAvailable}
              className="w-12 h-full flex items-center justify-center text-gray-600 hover:text-[#d53f8c] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiMinus />
            </button>
            <div className={`flex-1 h-full flex items-center justify-center ${!isAvailable ? 'text-gray-400' : 'text-gray-800 font-medium'}`}>{quantity}</div>
            <button
              onClick={() => handleQuantityChange(quantity + 1)}
              disabled={!isAvailable || (maxQuantity > 0 && quantity >= maxQuantity)}
              className="w-12 h-full flex items-center justify-center text-gray-600 hover:text-[#d53f8c] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiPlus />
            </button>
          </div>
          {selectedVariant && (
            <div className="flex flex-col space-y-1 mt-1">
              <div className="flex flex-col space-y-1">
                <div className={`text-xs text-center ${displayTotalStock > 0 ? 'text-gray-500' : 'text-red-500 font-medium'}`}>
                  {displayTotalStock > 0 ? `Tổng còn ${displayTotalStock} sản phẩm` : 'Hết hàng'}
                </div>
                {cartQuantity > 0 && (
                  <div className="text-xs text-blue-500 text-center">
                    Đã thêm {cartQuantity} sản phẩm vào giỏ hàng
                  </div>
                )}
                {maxQuantity > 0 && cartQuantity > 0 && (
                  <div className="text-xs text-green-500 text-center">
                    Còn có thể thêm {maxQuantity} sản phẩm nữa
                  </div>
                )}
              </div>
              {selectedVariant.inventory && selectedVariant.inventory.length > 0 && (
                <div className="text-xs text-center mt-2">
                  {selectedBranchId ? (
                    <div className="flex flex-col items-center">
                      <div className="flex items-center bg-pink-50 px-2 py-1 rounded-md border border-pink-100 mb-1">
                        <FiMapPin className="text-pink-500 mr-1" size={12} />
                        <span className="font-medium text-pink-700">
                          {selectedVariant.inventory.find(inv => inv.branchId === selectedBranchId)?.branchName || getBranchName(selectedBranchId)}
                        </span>
                      </div>
                      <button
                        onClick={() => setShowBranchModal(true)}
                        className="text-blue-500 hover:text-blue-700 hover:underline"
                      >
                        Thay đổi chi nhánh
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowBranchModal(true)}
                      className="text-blue-500 hover:text-blue-700 hover:underline flex items-center justify-center mx-auto"
                    >
                      <FiMapPin className="mr-1" size={12} />
                      Chọn chi nhánh
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Button thêm vào giỏ hàng */}
        <button
          onClick={handleAddToCart}
          disabled={!isAvailable}
          className={`lg:col-span-2 h-12 rounded-md font-medium text-white ${isAvailable ? 'bg-gradient-to-r from-[#d53f8c] to-[#805ad5] hover:from-[#b83280] hover:to-[#6b46c1]' : 'bg-gray-300 cursor-not-allowed'} transition-colors duration-300 flex items-center justify-center space-x-2`}
        >
          <FiShoppingCart className="w-4 h-4" />
          <span>
            {!inStock ? 'Hết hàng' :
             (selectedVariant && maxQuantity === 0) ? 'Hết hàng' :
             'Thêm vào giỏ hàng'}
          </span>
        </button>

        {/* Branch Selection Modal */}
        {selectedVariant && selectedVariant.inventory && (
          <BranchSelectionModal
            isOpen={showBranchModal}
            onClose={() => setShowBranchModal(false)}
            branches={selectedVariant.inventory.map(inv => ({
              branchId: inv.branchId,
              branchName: inv.branchName || getBranchName(inv.branchId),
              quantity: inv.quantity
            }))}
            currentQuantity={quantity}
            initialBranchId={selectedBranchId}
            onSelectBranch={handleSelectBranch}
          />
        )}

        <ToastContainer />

        {/* Button yêu thích */}
        <button
          onClick={handleToggleWishlist} // Updated onClick handler
          disabled={isWishlistLoading || (variants.length > 0 && !selectedVariant)} // Disable if loading or variant needed but not selected
          className={`h-12 border rounded-md font-medium transition-colors duration-300 flex items-center justify-center
            ${isCurrentVariantInWishlist
              ? 'border-pink-500 bg-pink-50 text-pink-600 hover:bg-pink-100'
              : 'border-gray-300 text-gray-700 hover:text-pink-600 hover:border-pink-600'}
            ${(variants.length > 0 && !selectedVariant) ? 'opacity-50 cursor-not-allowed' : ''}
            ${isWishlistLoading ? 'opacity-50 cursor-wait' : ''}
          `}
          title={isCurrentVariantInWishlist ? "Xóa khỏi yêu thích" : "Thêm vào yêu thích"}
        >
          <FiHeart className={`w-4 h-4 ${isCurrentVariantInWishlist ? 'fill-current' : ''}`} />
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
