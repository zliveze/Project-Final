import React, { useState, useEffect } from 'react';
import { FiHeart, FiShoppingCart, FiMinus, FiPlus, FiShare2, FiAward, FiGift, FiStar, FiMapPin } from 'react-icons/fi';
// Use standardized toast utility
import { showSuccessToast, showErrorToast, showInfoToast, showWarningToast } from '@/utils/toast';
import ProductVariants, { Variant as ImportedVariant, VariantCombination } from './ProductVariants'; // Import the Variant and VariantCombination interfaces

// Extend the imported Variant interface to include totalStock
interface Variant extends ImportedVariant {
  totalStock?: number;
  inventory?: Array<{ branchId: string; quantity: number; branchName?: string }>;
  combinationInventory?: Array<{ branchId: string; variantId: string; combinationId: string; quantity: number; branchName?: string }>;
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
  onSelectVariant: (variant: Variant | null, combination?: VariantCombination | null) => void;
  // Add branches prop
  branches?: Array<{ _id: string; name: string; address?: string; }>;
  // Add product inventory for products without variants
  product?: {
    inventory?: Array<{ branchId: string; quantity: number; branchName?: string; }>;
    combinationInventory?: Array<{ branchId: string; variantId: string; combinationId: string; quantity: number; branchName?: string; }>;
  };
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden animate-fade-in">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-800">Chọn chi nhánh</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            &times;
          </button>
        </div>

        <div className="px-6 py-4">
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-4">
            <p className="text-sm text-blue-800">
              Bạn đang muốn mua <span className="font-medium">{currentQuantity}</span> sản phẩm.
              Vui lòng chọn chi nhánh để tiếp tục.
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Lưu ý: Số lượng tối đa bạn có thể mua từ mỗi chi nhánh phụ thuộc vào tồn kho của chi nhánh đó.
            </p>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {sortedBranches.map((branch) => (
              <div
                key={branch.branchId}
                className={`rounded-lg p-3 transition-all duration-200 ${branch.quantity > 0 ?
                  (branch.branchId === selectedBranchId ?
                    'bg-gradient-to-r from-pink-50 to-white border border-pink-200 shadow-sm' :
                    'border border-gray-200 hover:border-pink-200 hover:bg-pink-50/30 cursor-pointer') :
                  'border border-gray-100 bg-gray-50 cursor-not-allowed'}`}
                onClick={() => {
                  if (branch.quantity > 0) {
                    setSelectedBranchId(branch.branchId);
                    onSelectBranch(branch.branchId);
                  }
                }}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className={`font-medium ${branch.branchId === selectedBranchId ? 'text-pink-700' : 'text-gray-800'}`}>
                      {branch.branchName || getBranchName(branch.branchId)}
                    </h4>
                    <p className="text-sm text-gray-500 mt-1">
                      Còn <span className="font-medium">{branch.quantity}</span> sản phẩm
                    </p>
                  </div>
                  {branch.quantity > 0 && (
                    <span className={`${branch.branchId === selectedBranchId ? 'text-pink-500' : 'text-gray-400'}`}>
                      <FiMapPin size={18} />
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-500 mr-2"
          >
            Hủy
          </button>
          <button
            onClick={() => {
              if (selectedBranchId) {
                onSelectBranch(selectedBranchId);
                onClose();
              }
            }}
            disabled={!selectedBranchId}
            className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-pink-500 to-pink-600 rounded-md hover:from-pink-600 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Xác nhận
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
  product = { inventory: [], combinationInventory: [] },
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
  const [selectedCombination, setSelectedCombination] = useState<VariantCombination | null>(null);

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

  // Calculate total stock based on product inventory, selected variant's inventory, or selected combination's inventory
  const hasVariants = variants && variants.length > 0;
  const hasCombinations = selectedVariant?.combinations && selectedVariant.combinations.length > 0;

  // Calculate total stock for products without variants
  const productTotalStock = !hasVariants ?
    (product?.inventory?.reduce((sum, inv) => sum + (inv.quantity || 0), 0) || 0) : 0;

  // Calculate total stock for products with variants but no combinations
  const variantTotalStock = selectedVariant?.totalStock || 0;

  // Calculate total stock for the selected combination
  let combinationTotalStock = 0;
  if (hasCombinations && selectedCombination && selectedVariant?.combinationInventory) {
    // Filter inventory for the selected combination
    const combinationInventory = selectedVariant.combinationInventory.filter(
      inv => inv.combinationId === selectedCombination.combinationId
    );

    // Calculate total stock for the selected combination
    combinationTotalStock = combinationInventory.reduce(
      (sum, inv) => sum + (inv.quantity || 0),
      0
    );

    console.log(`Selected combination ${selectedCombination.combinationId} has totalStock: ${combinationTotalStock}`);
  }

  // Use the appropriate total stock based on whether the product has variants and combinations
  const totalStock = hasCombinations && selectedCombination ? combinationTotalStock : (hasVariants ? variantTotalStock : productTotalStock);

  // Check if the product/variant/combination is already in the cart
  const cartItem = hasVariants && selectedVariant ?
    (hasCombinations && selectedCombination ?
      cartItems.find(item =>
        item.variantId === selectedVariant.variantId &&
        item.options?.combinationId === selectedCombination.combinationId
      ) :
      cartItems.find(item => item.variantId === selectedVariant.variantId)
    ) :
    cartItems.find(item => item.productId === _id && !item.variantId);

  const cartQuantity = cartItem ? cartItem.quantity : 0;

  // Calculate available quantity (total stock minus what's already in the cart)
  const maxQuantity = Math.max(0, totalStock - cartQuantity);

  // Determine if the current variant/product is in stock (considering cart quantity)
  const variantInStock = hasVariants ?
    (selectedVariant ? maxQuantity > 0 : false) :
    maxQuantity > 0;

  // Overall product availability - product is in stock AND selected variant (if any) is in stock
  const isAvailable = inStock && variantInStock;

  // For display purposes - show total stock, not just available stock
  const displayTotalStock = totalStock;

  // Use the selected combination's price if available, otherwise use the selected variant's price or base product price
  const displayPrice = selectedCombination?.price || selectedVariant?.price || price;
  const displayCurrentPrice = selectedCombination?.price || selectedVariant?.price || currentPrice;
  // If combination has additionalPrice, add it to the variant price
  const combinationPrice = selectedCombination?.additionalPrice && selectedVariant?.price
    ? selectedVariant.price + selectedCombination.additionalPrice
    : displayCurrentPrice;
  // Use combinationPrice if it exists
  const finalDisplayPrice = selectedCombination?.additionalPrice ? combinationPrice : displayCurrentPrice;
  const discount = displayPrice > finalDisplayPrice ? Math.round(((displayPrice - finalDisplayPrice) / displayPrice) * 100) : 0;

  // Get product inventory for products without variants
  const productInventory = !hasVariants ? product?.inventory || [] : [];

  // Get branch names for inventory and preload branches
  useEffect(() => {
    // Preload branches when component mounts
    preloadBranches();

    // For products with variants
    if (hasVariants && selectedVariant?.inventory && branches.length > 0) {
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

      // If there's a selected combination, update its inventory with branch names
      if (selectedCombination && selectedVariant.combinationInventory) {
        const combinationInventory = selectedVariant.combinationInventory.filter(
          inv => inv.combinationId === selectedCombination.combinationId
        );

        if (combinationInventory.length > 0) {
          const updatedCombinationInventory = combinationInventory.map(inv => {
            const branch = branches.find(b => b._id === inv.branchId);
            return {
              ...inv,
              branchName: branch?.name || 'Chi nhánh không xác định'
            };
          });

          console.log('Updated combination inventory with branch names:', updatedCombinationInventory);
        }
      }
    }

    // For products without variants
    if (!hasVariants && productInventory.length > 0 && branches.length > 0) {
      // Update inventory with branch names
      const updatedInventory = productInventory.map(inv => {
        const branch = branches.find(b => b._id === inv.branchId);
        return {
          ...inv,
          branchName: branch?.name || 'Chi nhánh không xác định'
        };
      });

      console.log('Updated product inventory with branch names:', updatedInventory);
    }
  }, [selectedVariant, selectedCombination, branches, preloadBranches, hasVariants, productInventory]);

  // Xử lý thay đổi số lượng
  const handleQuantityChange = (value: number) => {
    if (value < 1) return;

    // If variant is selected but out of stock (considering cart quantity)
    if (selectedVariant && maxQuantity === 0) {
      if (cartQuantity > 0) {
        showWarningToast(`Bạn đã thêm ${cartQuantity} sản phẩm này vào giỏ hàng. Không thể thêm nữa.`);
      } else {
        showWarningToast(`Phiên bản này hiện đang hết hàng`);
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

    // For products with variants
    if (hasVariants && selectedVariant && selectedVariant.inventory) {
      const branchInventory = selectedVariant.inventory.find(inv => inv.branchId === branchId);
      if (branchInventory) {
        // Calculate available quantity in this branch (considering cart quantity)
        const branchCartQuantity = cartItem && cartItem.selectedBranchId === branchId ? cartQuantity : 0;
        const availableBranchQuantity = Math.max(0, branchInventory.quantity - branchCartQuantity);

        // Only adjust quantity if current selection exceeds available quantity
        if (quantity > availableBranchQuantity) {
          setQuantity(availableBranchQuantity);
          showInfoToast(`Số lượng đã được điều chỉnh theo tồn kho của chi nhánh ${getBranchName(branchId)}`);
        }
        // Otherwise, keep the user's selected quantity
      }
    }

    // For products without variants
    if (!hasVariants && productInventory.length > 0) {
      const branchInventory = productInventory.find(inv => inv.branchId === branchId);
      if (branchInventory) {
        // Calculate available quantity in this branch (considering cart quantity)
        const branchCartItem = cartItems.find(item =>
          item.productId === _id &&
          !item.variantId &&
          item.selectedBranchId === branchId
        );
        const branchCartQuantity = branchCartItem ? branchCartItem.quantity : 0;
        const availableBranchQuantity = Math.max(0, branchInventory.quantity - branchCartQuantity);

        // Only adjust quantity if current selection exceeds available quantity
        if (quantity > availableBranchQuantity) {
          setQuantity(availableBranchQuantity);
          showInfoToast(`Số lượng đã được điều chỉnh theo tồn kho của chi nhánh ${getBranchName(branchId)}`);
        }
        // Otherwise, keep the user's selected quantity
      }
    }
  };

  // Xử lý thêm vào giỏ hàng - Use context function
  const handleAddToCart = async () => {
    // Check if product or selected variant is out of stock
    if (!inStock) {
       showErrorToast('Sản phẩm hiện đang hết hàng');
       return;
    }

    // Check if selected variant is out of stock or if trying to add more than available
    if (selectedVariant && maxQuantity === 0) {
      const selectedBranchName = selectedBranchId ?
        (selectedVariant.inventory?.find(inv => inv.branchId === selectedBranchId)?.branchName || getBranchName(selectedBranchId)) :
        'chi nhánh này';

      if (cartQuantity > 0) {
        showErrorToast(`Bạn đã thêm ${cartQuantity} sản phẩm này vào giỏ hàng. Không thể thêm nữa từ ${selectedBranchName}.`);
      } else {
        showErrorToast(`Phiên bản này hiện đang hết hàng từ ${selectedBranchName}`);
      }
      return;
    }

    // Check if trying to add more than available quantity
    if (selectedVariant && quantity > maxQuantity) {
      const selectedBranchName = selectedBranchId ?
        (selectedVariant.inventory?.find(inv => inv.branchId === selectedBranchId)?.branchName || getBranchName(selectedBranchId)) :
        'chi nhánh này';

      showErrorToast(`Chỉ còn có thể thêm ${maxQuantity} sản phẩm nữa vào giỏ hàng từ ${selectedBranchName}.`);
      return;
    }

    // If we have inventory in multiple branches but no branch selected, show branch selection modal
    if (hasVariants && selectedVariant && selectedVariant.inventory && selectedVariant.inventory.length > 0 && !selectedBranchId) {
      setShowBranchModal(true);
      return;
    }

    // For products without variants, check if branch selection is needed
    if (!hasVariants && productInventory.length > 0 && !selectedBranchId) {
      setShowBranchModal(true);
      return;
    }

    // Note: Detailed stock check for the specific variant should happen in the backend/context.

    // Kiểm tra đăng nhập bằng isAuthenticated từ context, chỉ khi không còn loading
    if (!isAuthLoading && !isAuthenticated) {
        showInfoToast('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng');
        // Optional: Redirect to login page
        // router.push('/auth/login');
        return;
    }

    // Ensure a variant is selected if variants exist
    if (variants && variants.length > 0 && !selectedVariant) {
        showWarningToast('Vui lòng chọn một phiên bản sản phẩm (màu sắc, kích thước,...)');
        return;
    }

    // Get the correct variantId to add
    const variantIdToAdd = selectedVariant?.variantId;

    // Get the correct combinationId to add if available
    const combinationIdToAdd = selectedCombination?.combinationId;

    // Double-check variantId requirement if variants exist
    if (variants && variants.length > 0 && !variantIdToAdd) {
        console.error("Lỗi logic: Có variants nhưng không có selectedVariant.variantId");
        showErrorToast('Đã xảy ra lỗi, không thể xác định phiên bản sản phẩm.');
        return;
    }

    // Check if combination is required but missing
    if (selectedVariant?.combinations && selectedVariant.combinations.length > 0 && !combinationIdToAdd) {
        showWarningToast('Vui lòng chọn một tổ hợp sản phẩm');
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

    // If there's a selected combination, use its attributes
    if (selectedCombination) {
        // Add combinationId to options
        optionsForBackend['combinationId'] = selectedCombination.combinationId;

        // Add combination attributes
        Object.entries(selectedCombination.attributes).forEach(([key, value]) => {
            optionsForBackend[key.charAt(0).toUpperCase() + key.slice(1)] = value;
        });
    } else {
        // Assuming the first selected size/shade is what we send (adjust if multiple selections are possible)
        if (selectedVariant?.options?.sizes && selectedVariant.options.sizes.length > 0) {
            optionsForBackend['Size'] = selectedVariant.options.sizes[0];
        }
        if (selectedVariant?.options?.shades && selectedVariant.options.shades.length > 0) {
            optionsForBackend['Shade'] = selectedVariant.options.shades[0];
        }
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
             showErrorToast('Vui lòng chọn lại phiên bản sản phẩm.');
             return; // Exit if variantId is missing when required
        }
    } else {
        // No variants exist, explicitly pass empty string for variantId
        await addItemToCart(
            _id, // productId
            '', // Pass empty string for variantId for products without variants
            quantity,
            optionsForBackend // Options might be empty, which is fine
        );
        console.log('Added product without variants to cart with empty string variantId');
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
      showInfoToast('Vui lòng đăng nhập để quản lý danh sách yêu thích.');
      return;
    }

    // Check if a variant needs to be selected
    if (variants && variants.length > 0 && !selectedVariant) {
      showWarningToast('Vui lòng chọn một phiên bản sản phẩm để thêm/xóa khỏi yêu thích.');
      return;
    }

    // Get the required IDs
    const productId = _id;

    // For products with variants, use the selected variant ID
    // For products without variants, use empty string
    let variantId: string | undefined;

    if (variants && variants.length > 0) {
      // Product has variants, so we need a selected variant
      variantId = selectedVariant?.variantId;

      // Check if variantId is required but missing
      if (!variantId) {
          console.error("Lỗi logic: Thiếu variantId khi cần thiết cho wishlist.");
          showErrorToast('Vui lòng chọn lại phiên bản sản phẩm.');
          return;
      }
    } else {
      // Product has no variants, use empty string
      variantId = '';
    }

    const isInWishlist = isItemInWishlist(productId, variantId);

    // Disable button while processing
    // Consider adding a specific loading state for the wishlist button if needed
    if (isWishlistLoading) return;

    if (isInWishlist) {
      // Remove from wishlist
      await removeFromWishlist(productId, variantId);
    } else {
      // Add to wishlist
      await addToWishlist(productId, variantId);
    }
  };

  // Xử lý chia sẻ sản phẩm (Keep existing logic)
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: name, text: description.short, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      showSuccessToast('Đã sao chép đường dẫn sản phẩm');
    }
  };

  // Determine if the current selected variant is in the wishlist
  const isCurrentVariantInWishlist = variants && variants.length > 0
    ? (selectedVariant ? isItemInWishlist(_id, selectedVariant.variantId) : false)
    : isItemInWishlist(_id, ''); // For products without variants, use empty string


  return (
    <div className="space-y-5">
      {/* Thương hiệu và badges */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center">
          {brand.logo?.url && (
            <div className="relative h-6 w-6 flex-shrink-0 mr-2">
              <Image src={brand.logo.url} alt={brand.logo.alt || brand.name} fill className="object-contain rounded-sm" />
            </div>
          )}
          <Link href={`/brands/${brand.slug}`} className="text-[#d53f8c] text-sm font-medium hover:underline">
            {brand.name}
          </Link>
        </div>

        {flags.isBestSeller && (
          <div className="flex items-center text-amber-500 bg-amber-50 px-2 py-1 rounded-full text-xs font-medium">
            <FiAward className="mr-1" />
            <span>Bán chạy nhất</span>
          </div>
        )}

        {flags.isNew && (
          <div className="flex items-center text-blue-500 bg-blue-50 px-2 py-1 rounded-full text-xs font-medium">
            <span>Mới</span>
          </div>
        )}
      </div>

      {/* Tên sản phẩm */}
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800 leading-tight">{name}</h1>

      {/* Mô tả ngắn */}
      <p className="text-gray-600 leading-relaxed text-sm md:text-base">{description.short}</p>

      {/* Đánh giá và SKU */}
      <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 pb-4">
        <div className="flex items-center bg-gray-50 px-3 py-1.5 rounded-md">
          <div className="flex items-center text-amber-400">
            {[...Array(5)].map((_, i) => (
              <FiStar key={i} className={`w-4 h-4 ${i < Math.floor(reviews.averageRating) ? 'fill-current' : ''}`} />
            ))}
          </div>
          <span className="ml-2 text-gray-600 text-sm font-medium">{reviews.averageRating.toFixed(1)}</span>
        </div>

        <Link href="#reviews" className="text-sm text-gray-600 hover:text-[#d53f8c] hover:underline flex items-center">
          <span className="mr-1">{reviews.reviewCount}</span> đánh giá
        </Link>

        <div className="text-sm text-gray-500 flex items-center">
          <span className="font-medium mr-1">SKU:</span> {selectedVariant?.sku || sku}
        </div>
      </div>

      {/* Giá */}
      <div className="flex flex-wrap items-end gap-3 pt-2">
        <span className="text-2xl md:text-3xl font-bold text-[#d53f8c]">
          {finalDisplayPrice.toLocaleString('vi-VN')}đ
        </span>
        {discount > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-lg text-gray-400 line-through">{displayPrice.toLocaleString('vi-VN')}đ</span>
            <span className="text-sm font-medium text-white bg-gradient-to-r from-pink-500 to-pink-600 px-2 py-1 rounded-full">-{discount}%</span>
          </div>
        )}
      </div>

      {/* Biến thể sản phẩm */}
      {variants.length > 0 && (
        <div className="pt-4">
          <ProductVariants
            variants={variants}
            selectedVariant={selectedVariant}
            selectedCombination={selectedCombination}
            onSelectVariant={(variant, combination) => {
              onSelectVariant(variant, combination);
              setSelectedCombination(combination || null);
            }}
          />
        </div>
      )}

      {/* Quà tặng */}
      {flags.hasGifts && gifts.length > 0 && (
        <div className="border border-pink-100 rounded-lg overflow-hidden bg-gradient-to-r from-pink-50 to-white">
          <div
            className="flex justify-between items-center cursor-pointer px-4 py-3 hover:bg-pink-50/50 transition-colors"
            onClick={() => setShowGifts(!showGifts)}
          >
            <div className="flex items-center text-[#d53f8c] font-medium">
              <FiGift className="mr-2" />
              <span>Quà tặng kèm khi mua sản phẩm</span>
            </div>
            <span className="text-[#d53f8c] text-lg">{showGifts ? '−' : '+'}</span>
          </div>

          {showGifts && (
            <div className="px-4 py-3 border-t border-pink-100 space-y-3">
              {gifts.map((gift) => (
                <div key={gift.giftId} className="flex items-center gap-3 bg-white p-3 rounded-md shadow-sm">
                  <div className="w-12 h-12 min-w-[48px] flex items-center justify-center rounded-md overflow-hidden border border-gray-100">
                    <Image src={gift.image.url} alt={gift.image.alt} width={48} height={48} className="object-cover" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-800">{gift.name}</div>
                    <div className="text-xs text-gray-500 leading-tight">{gift.description}</div>
                  </div>
                  <div className="text-xs font-medium text-white bg-gradient-to-r from-pink-500 to-pink-600 px-2 py-1 rounded-full">
                    {gift.value.toLocaleString('vi-VN')}đ
                  </div>
                </div>
              ))}
              <div className="text-xs text-gray-500 pt-1 italic">
                * Áp dụng cho đơn hàng từ {gifts[0].conditions.minPurchaseAmount.toLocaleString('vi-VN')}đ
              </div>
            </div>
          )}
        </div>
      )}

      {/* Số lượng và nút mua hàng */}
      <div className="mt-6 border-t border-gray-100 pt-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Số lượng */}
          <div className="w-full md:w-1/4">
            <div className="mb-2 text-sm font-medium text-gray-700">Số lượng:</div>
            <div className="flex">
              <div className={`flex items-center h-12 border rounded-md overflow-hidden w-full ${!isAvailable ? 'border-gray-200 bg-gray-100' : 'border-gray-300'}`}>
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
            </div>

            {/* Thông tin tồn kho */}
            <div className="mt-2">
              <div className={`text-xs ${displayTotalStock > 0 ? 'text-gray-500' : 'text-red-500 font-medium'}`}>
                {displayTotalStock > 0 ? (
                  hasCombinations && selectedCombination ?
                    `Tổ hợp này còn ${displayTotalStock} sản phẩm` :
                    `Tổng còn ${displayTotalStock} sản phẩm`
                ) : 'Hết hàng'}
              </div>
              {cartQuantity > 0 && (
                <div className="text-xs text-blue-500 mt-1">
                  Đã thêm {cartQuantity} sản phẩm vào giỏ hàng
                </div>
              )}
            </div>
          </div>

          {/* Chi nhánh */}
          <div className="w-full md:w-1/4">
            <div className="mb-2 text-sm font-medium text-gray-700">Chi nhánh:</div>
            {/* Branch selection for products with variants */}
            {hasVariants && selectedVariant && (
              <div>
                {/* If there's a selected combination, show combination inventory */}
                {hasCombinations && selectedCombination && selectedVariant.combinationInventory &&
                 selectedVariant.combinationInventory.filter(inv => inv.combinationId === selectedCombination.combinationId).length > 0 ? (
                  <div>
                    {selectedBranchId ? (
                      <div className="flex flex-col">
                        <div className="flex items-center bg-pink-50 px-3 py-2 rounded-md border border-pink-100">
                          <FiMapPin className="text-pink-500 mr-2" size={14} />
                          <span className="font-medium text-pink-700">
                            {selectedVariant.combinationInventory
                              .filter(inv => inv.combinationId === selectedCombination.combinationId)
                              .find(inv => inv.branchId === selectedBranchId)?.branchName || getBranchName(selectedBranchId)}
                          </span>
                        </div>
                        <button
                          onClick={() => setShowBranchModal(true)}
                          className="text-blue-500 hover:text-blue-700 hover:underline text-xs mt-2"
                        >
                          Thay đổi chi nhánh
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowBranchModal(true)}
                        className="flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md hover:border-pink-300 hover:bg-pink-50 transition-colors w-full"
                      >
                        <FiMapPin className="mr-2 text-gray-500" />
                        <span>Chọn chi nhánh</span>
                      </button>
                    )}
                  </div>
                ) : (
                  /* If there's no selected combination or no combination inventory, show variant inventory */
                  selectedVariant.inventory && selectedVariant.inventory.length > 0 && (
                    <div>
                      {selectedBranchId ? (
                        <div className="flex flex-col">
                          <div className="flex items-center bg-pink-50 px-3 py-2 rounded-md border border-pink-100">
                            <FiMapPin className="text-pink-500 mr-2" size={14} />
                            <span className="font-medium text-pink-700">
                              {selectedVariant.inventory.find(inv => inv.branchId === selectedBranchId)?.branchName || getBranchName(selectedBranchId)}
                            </span>
                          </div>
                          <button
                            onClick={() => setShowBranchModal(true)}
                            className="text-blue-500 hover:text-blue-700 hover:underline text-xs mt-2"
                          >
                            Thay đổi chi nhánh
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowBranchModal(true)}
                          className="flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md hover:border-pink-300 hover:bg-pink-50 transition-colors w-full"
                        >
                          <FiMapPin className="mr-2 text-gray-500" />
                          <span>Chọn chi nhánh</span>
                        </button>
                      )}
                    </div>
                  )
                )}
              </div>
            )}

            {/* Branch selection for products without variants */}
            {!hasVariants && productInventory.length > 0 && (
              <div>
                {selectedBranchId ? (
                  <div className="flex flex-col">
                    <div className="flex items-center bg-pink-50 px-3 py-2 rounded-md border border-pink-100">
                      <FiMapPin className="text-pink-500 mr-2" size={14} />
                      <span className="font-medium text-pink-700">
                        {productInventory.find(inv => inv.branchId === selectedBranchId)?.branchName || getBranchName(selectedBranchId)}
                      </span>
                    </div>
                    <button
                      onClick={() => setShowBranchModal(true)}
                      className="text-blue-500 hover:text-blue-700 hover:underline text-xs mt-2"
                    >
                      Thay đổi chi nhánh
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowBranchModal(true)}
                    className="flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md hover:border-pink-300 hover:bg-pink-50 transition-colors w-full"
                  >
                    <FiMapPin className="mr-2 text-gray-500" />
                    <span>Chọn chi nhánh</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Các nút hành động */}
          <div className="w-full md:w-1/2 flex flex-col md:flex-row gap-3">
            {/* Button thêm vào giỏ hàng */}
            <button
              onClick={handleAddToCart}
              disabled={!isAvailable}
              className={`h-12 rounded-md font-medium text-white flex-1 ${isAvailable ? 'bg-gradient-to-r from-[#d53f8c] to-[#805ad5] hover:from-[#b83280] hover:to-[#6b46c1]' : 'bg-gray-300 cursor-not-allowed'} transition-colors duration-300 flex items-center justify-center gap-2`}
            >
              <FiShoppingCart className="w-4 h-4" />
              <span>
                {!inStock ? 'Hết hàng' :
                 (selectedVariant && maxQuantity === 0) ? 'Hết hàng' :
                 'Thêm vào giỏ hàng'}
              </span>
            </button>

            {/* Button yêu thích */}
            <button
              onClick={handleToggleWishlist}
              disabled={isWishlistLoading || (variants.length > 0 && !selectedVariant)}
              className={`h-12 w-12 border rounded-md font-medium transition-colors duration-300 flex items-center justify-center
                ${isCurrentVariantInWishlist
                  ? 'border-pink-500 bg-pink-50 text-pink-600 hover:bg-pink-100'
                  : 'border-gray-300 text-gray-700 hover:text-pink-600 hover:border-pink-600'}
                ${(variants.length > 0 && !selectedVariant) ? 'opacity-50 cursor-not-allowed' : ''}
                ${isWishlistLoading ? 'opacity-50 cursor-wait' : ''}
              `}
              title={isCurrentVariantInWishlist ? "Xóa khỏi yêu thích" : "Thêm vào yêu thích"}
            >
              <FiHeart className={`w-5 h-5 ${isCurrentVariantInWishlist ? 'fill-current' : ''}`} />
            </button>

            {/* Nút chia sẻ */}
            <button
              onClick={handleShare}
              className="h-12 w-12 border border-gray-300 rounded-md text-gray-700 hover:text-[#d53f8c] hover:border-pink-300 transition-colors duration-300 flex items-center justify-center"
              title="Chia sẻ sản phẩm"
            >
              <FiShare2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Branch Selection Modal for products with variants */}
        {hasVariants && selectedVariant && (
          <BranchSelectionModal
            isOpen={showBranchModal}
            onClose={() => setShowBranchModal(false)}
            branches={
              // If there's a selected combination, show combination inventory
              hasCombinations && selectedCombination && selectedVariant.combinationInventory ?
                selectedVariant.combinationInventory
                  .filter(inv => inv.combinationId === selectedCombination.combinationId)
                  .map(inv => ({
                    branchId: inv.branchId,
                    branchName: inv.branchName || getBranchName(inv.branchId),
                    quantity: inv.quantity
                  })) :
                // Otherwise, show variant inventory
                selectedVariant.inventory ?
                  selectedVariant.inventory.map(inv => ({
                    branchId: inv.branchId,
                    branchName: inv.branchName || getBranchName(inv.branchId),
                    quantity: inv.quantity
                  })) : []
            }
            currentQuantity={quantity}
            initialBranchId={selectedBranchId}
            onSelectBranch={handleSelectBranch}
          />
        )}

        {/* Branch Selection Modal for products without variants */}
        {!hasVariants && productInventory.length > 0 && (
          <BranchSelectionModal
            isOpen={showBranchModal}
            onClose={() => setShowBranchModal(false)}
            branches={productInventory.map(inv => ({
              branchId: inv.branchId,
              branchName: inv.branchName || getBranchName(inv.branchId),
              quantity: inv.quantity
            }))}
            currentQuantity={quantity}
            initialBranchId={selectedBranchId}
            onSelectBranch={handleSelectBranch}
          />
        )}
      </div>
    </div>
  );
};

export default ProductInfo;
