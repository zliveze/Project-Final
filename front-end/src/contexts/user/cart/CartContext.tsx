import React, { createContext, useState, useContext, useEffect, useCallback, ReactNode, useRef } from 'react';
import { toast } from 'react-toastify';
// Import dependencies thực tế
import { useAuth } from '@/contexts/AuthContext'; // Điều chỉnh đường dẫn nếu cần
import { useUserVoucher, VoucherApplyResult } from '@/hooks/useUserVoucher';
import axios from '@/lib/axios';

// Define API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Interface cho chi tiết Variant nhúng trong Product (từ product.schema.ts)
// Cần khớp với cấu trúc ProductVariant trong product.schema.ts và dữ liệu populate
interface EmbeddedVariant {
    variantId: string; // Hoặc Types.ObjectId nếu dùng trực tiếp
    sku?: string;
    options: {
        color?: string;
        shades?: string[];
        sizes?: string[];
    };
    price: number;
    images?: { url: string; alt?: string; isPrimary?: boolean }[];
    combinations?: Combination[]; // Thêm trường combinations
    // Thêm các trường khác nếu có trong ProductVariant schema
}

// Interface cho Combination (dựa trên dữ liệu sản phẩm mẫu)
interface Combination {
    combinationId: string;
    attributes: Record<string, string>; // e.g., { shade: 'Đỏ', size: '15ml' }
    price?: number; // Giá riêng cho combination
    additionalPrice?: number; // Giá cộng thêm vào giá variant
}

// Interface cho Product được populate trong Cart Item
// Cần khớp với select và populate trong carts.service.ts
interface PopulatedProduct {
    _id: string;
    name: string;
    slug: string;
    price: number; // Base price for products without variants
    currentPrice?: number; // Discounted price if available
    images: { url: string; alt?: string; isPrimary?: boolean }[];
    variants: EmbeddedVariant[]; // Mảng các biến thể nhúng
    inventory: { branchId: string; quantity: number }[]; // Mảng tồn kho
    brandId: { // Brand đã được populate
        _id: string;
        name: string;
        slug: string;
    };
    // Thêm cosmetic_info vào PopulatedProduct
    cosmetic_info?: {
        volume?: {
            value?: number;
            unit?: string;
        };
        // Thêm các trường khác nếu có
    };
}


// --- Helper function to get Auth Headers ---
const getAuthHeaders = (): HeadersInit => {
    // Ensure this runs only on the client-side
    if (typeof window === 'undefined') return {};
    const token = localStorage.getItem('accessToken');
    if (!token) return {};
    return { 'Authorization': `Bearer ${token}` };
};

// Remove the separate getVariantDetails function as we get data from populated product


// Interface cho CartItem từ backend (giữ lại hoặc điều chỉnh)
interface BackendCartItem {
  productId: string; // ID của Product gốc
  variantId: string; // ID của Variant cụ thể
  quantity: number;
  price: number; // Giá tại thời điểm thêm vào giỏ hàng
  selectedOptions?: Record<string, string>; // Lưu trữ dưới dạng { "Color": "Red", "Size": "XL" }
}

// Interface cho Cart từ backend
interface BackendCart {
  _id: string;
  userId: string;
  items: BackendCartItem[];
  totalAmount: number; // Tổng tiền (có thể được tính ở backend)
}

// Interface cho CartProduct đầy đủ chi tiết ở frontend
// Kết hợp BackendCartItem và chi tiết lấy từ PopulatedProduct và EmbeddedVariant
export interface CartProduct {
  _id: string; // Sử dụng variantId làm key duy nhất trong state frontend
  productId: string; // ID product gốc
  variantId: string; // ID variant
  name: string; // Tên product (từ PopulatedProduct)
  slug: string; // Slug product (từ PopulatedProduct)
  price: number; // Giá trong giỏ hàng (từ BackendCartItem)
  originalPrice?: number; // Giá gốc của variant (từ EmbeddedVariant - cần thêm vào schema nếu muốn)
  quantity: number; // Số lượng trong giỏ hàng
  selectedOptions?: Record<string, string>; // Tùy chọn đã chọn
  image: { // Lấy ảnh đầu tiên của variant hoặc product
    url: string;
    alt: string;
  };
  brand: { // Thông tin brand (từ PopulatedProduct.brandId)
    name: string;
    slug: string;
  };
  inStock: boolean; // Trạng thái tồn kho (tính từ PopulatedProduct.inventory)
  maxQuantity: number; // Số lượng tối đa có thể mua (tính từ PopulatedProduct.inventory)
  branchInventory?: Array<{ branchId: string; quantity: number }>; // Tồn kho theo chi nhánh
  selectedBranchId?: string; // Chi nhánh đã chọn (nếu có)
  isProductWithoutVariants?: boolean; // Flag to identify products without variants
  // Thêm trường để lưu thông tin cosmetic_info
  cosmetic_info?: {
    volume?: {
      value?: number;
      unit?: string;
    };
    // Thêm các trường khác của cosmetic_info nếu cần
  };
}

interface CartContextType {
  cartItems: CartProduct[];
  selectedItems: string[]; // Array of selected item IDs
  itemCount: number;
  selectedItemCount: number; // Count of selected items
  subtotal: number;
  selectedSubtotal: number; // Subtotal of selected items only
  isLoading: boolean;
  error: string | null;
  appliedVoucher: VoucherApplyResult | null;
  discount: number;
  shipping: number;
  total: number;
  selectedTotal: number; // Total of selected items only
  voucherCode: string;
  voucherId: string;
  fetchCart: () => Promise<void>;
  addItemToCart: (productId: string, variantId: string | undefined | null | '', quantity: number, options?: Record<string, string>, price?: number) => Promise<boolean>; // Allow undefined, null, or empty string variantId
  updateCartItem: (itemId: string, quantity: number, showToast?: boolean, selectedBranchId?: string, price?: number) => Promise<boolean>; // Changed variantId to itemId
  debouncedUpdateCartItem: (itemId: string, quantity: number, showToast?: boolean, selectedBranchId?: string, price?: number) => void; // Changed variantId to itemId
  removeCartItem: (itemId: string) => Promise<boolean>; // Changed variantId to itemId
  clearCart: () => Promise<boolean>;
  applyVoucher: (code: string) => Promise<boolean>;
  clearVoucher: () => void;
  updateShipping: (amount: number) => void;
  // Selection functions
  selectItem: (itemId: string) => boolean; // Returns true if selection is allowed
  unselectItem: (itemId: string) => void;
  selectAllItemsInBranch: (branchId: string) => boolean; // Returns true if selection is allowed
  unselectAllItemsInBranch: (branchId: string) => void;
  clearSelection: () => void;
  canSelectItem: (itemId: string) => boolean; // Check if item can be selected based on branch rules
  getSelectedBranchId: () => string | null; // Get the branch ID of selected items
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartProduct[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [voucherCode, setVoucherCode] = useState<string>('');
  const [voucherId, setVoucherId] = useState<string>('');
  const [shipping, setShipping] = useState<number>(0);
  const { isAuthenticated } = useAuth(); // Chỉ cần isAuthenticated từ context
  const {
    applyVoucher: applyVoucherApi,
    appliedVoucher,
    clearAppliedVoucher
  } = useUserVoucher();

  // Hàm fetch và kết hợp chi tiết sản phẩm
  const fetchAndPopulateCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCartItems([]);
      setIsLoading(false);
      return; // Không fetch nếu chưa đăng nhập
    }
    setIsLoading(true);
    setError(null);
    try {
      // 1. Gọi API lấy giỏ hàng cơ bản bằng fetch
      const response = await fetch(`${API_URL}/carts`, {
          method: 'GET',
          headers: {
              'Content-Type': 'application/json',
              ...getAuthHeaders(), // Get token from localStorage
          },
      });

      if (!response.ok) {
          // Handle errors like 401 Unauthorized
          if (response.status === 401) {
              console.warn("Unauthorized fetching cart. User might need to log in.");
              setCartItems([]); // Clear cart if unauthorized
              setIsLoading(false);
              return;
          }
          const errorData = await response.json().catch(() => ({ message: response.statusText }));
          throw new Error(errorData.message || 'Failed to fetch cart');
      }

      const backendCart: BackendCart = await response.json();

      if (!backendCart || !backendCart.items || backendCart.items.length === 0) {
        setCartItems([]);
        setIsLoading(false);
        return;
      }

      // 2. Lấy chi tiết cho từng variant từ dữ liệu Product đã populate
      const populatedItemsPromises = backendCart.items.map(async (item) => {
        try {
          // Ensure productId is populated and is an object
          if (!item.productId || typeof item.productId !== 'object' || !('_id' in item.productId)) {
              console.warn(`Product data not populated correctly for cart item with variantId: ${item.variantId}. Skipping.`);
              return null;
          }
          // Cast to the populated product type (adjust if your actual populated type differs)
          const productData = item.productId as PopulatedProduct;

          // Check if this is a product without variants (empty variantId)
          const isProductWithoutVariants = !item.variantId || item.variantId === '';

          // For products with variants, find the specific variant
          // For products without variants, we'll use the product's data directly
          let embeddedVariant = null;

          if (!isProductWithoutVariants) {
            // Find the specific embedded variant within the populated product data
            embeddedVariant = productData.variants?.find(v => {
              // So sánh cả string và ObjectId
              const variantIdStr = v.variantId?.toString();
              const itemVariantIdStr = item.variantId?.toString();
              return variantIdStr === itemVariantIdStr;
            });

            if (!embeddedVariant) {
              // Ghi log chi tiết hơn về lỗi
              // Kiểm tra xem có phải là ID tạm thời không (new-timestamp)
              if (item.variantId && item.variantId.toString().startsWith('new-')) {
                console.warn(`Detected temporary ID format: ${item.variantId}. This may be a newly created variant that hasn't been properly saved.`);
              }

              return null; // Bỏ qua item nếu không lấy được chi tiết
            }
          } else {

          }

          // Calculate stock by summing inventory across all branches
          const totalStock = productData.inventory?.reduce((sum, inv) => sum + inv.quantity, 0) || 0;

          // Store branch-specific inventory for later use
          const branchInventory = productData.inventory?.map(inv => ({
            branchId: inv.branchId.toString(),
            quantity: inv.quantity
          })) || [];

          // 3. Kết hợp dữ liệu từ BackendCartItem, PopulatedProduct, và EmbeddedVariant

          // Enhance selectedOptions with more detailed information from the variant if not provided
          let enhancedOptions = item.selectedOptions || {};

          // If we have variant options but no selectedOptions from the cart item,
          // create a more detailed selectedOptions object from the variant data
          // Thêm kiểm tra null cho embeddedVariant
          if (Object.keys(enhancedOptions).length === 0 && embeddedVariant && embeddedVariant.options) {
            if (embeddedVariant.options.color) {
              enhancedOptions['Color'] = embeddedVariant.options.color;
            }

            // Thêm kiểm tra null cho embeddedVariant
            if (embeddedVariant && embeddedVariant.options.sizes && embeddedVariant.options.sizes.length > 0) {
              enhancedOptions['Size'] = embeddedVariant.options.sizes[0];
            }
            // Thêm kiểm tra null cho embeddedVariant
            if (embeddedVariant && embeddedVariant.options.shades && embeddedVariant.options.shades.length > 0) {
              enhancedOptions['Shade'] = embeddedVariant.options.shades[0];
            }
          }

          // Extract selectedBranchId from selectedOptions if it exists
          const selectedBranchId = item.selectedOptions?.selectedBranchId;

          // Create a copy of enhancedOptions without selectedBranchId
          const displayOptions = { ...enhancedOptions };
          delete displayOptions.selectedBranchId;

          // Determine the correct price based on product type and selected combination
          let originalPrice;

          // For products without variants, use the product's price
          if (isProductWithoutVariants) {
            originalPrice = productData.currentPrice || productData.price;
          } else {
          // For products with variants, use the variant's price (Thêm kiểm tra null)
          originalPrice = embeddedVariant?.price || productData.price; // Fallback to product price if variant price missing

          // If there's a combinationId in selectedOptions, find the combination and use its price
          const combinationId = item.selectedOptions?.combinationId;
          // Thêm kiểm tra null cho embeddedVariant và combinations
          if (combinationId && embeddedVariant && embeddedVariant.combinations) {
            // Thêm kiểu dữ liệu cho 'c'
            const combination = embeddedVariant.combinations.find((c: Combination) => c.combinationId === combinationId);
            if (combination) {


                // If combination has a direct price, use it
                if (combination.price) {
                  originalPrice = combination.price;
                }
              // If combination has additionalPrice, add it to the variant price (Thêm kiểm tra null)
              else if (combination.additionalPrice && embeddedVariant?.price) {
                originalPrice = embeddedVariant.price + combination.additionalPrice;
              }
            } else {

              }
            }
          }

          // For products without variants, use the product's images
          // For products with variants, use the variant's images if available (Thêm kiểm tra null)
          const imageUrl = isProductWithoutVariants
            ? productData.images?.[0]?.url || '/404.png'
            : embeddedVariant?.images?.[0]?.url || productData.images?.[0]?.url || '/404.png';

          // Thêm kiểm tra null
          const imageAlt = isProductWithoutVariants
            ? productData.images?.[0]?.alt || productData.name
            : embeddedVariant?.images?.[0]?.alt || productData.name;

          // Generate a unique ID for the cart item
          // For products with variants, use the variantId combined with combinationId if available
          // For products without variants, use the productId with a prefix
          let itemId;
          if (isProductWithoutVariants) {
            itemId = `product-${productData._id}`;
          } else {
            // If there's a combinationId, include it in the itemId to make it unique per combination
            const combinationId = item.selectedOptions?.combinationId;
            if (combinationId) {
              itemId = `${item.variantId}-${combinationId}`;
            } else {
              itemId = item.variantId;
            }
          }

          return {
            _id: itemId,
            productId: productData._id,
            variantId: item.variantId,
            name: productData.name, // Lấy tên từ product
            slug: productData.slug, // Lấy slug từ product
            price: item.price, // Giá tại thời điểm thêm
            originalPrice: originalPrice, // Giá gốc của variant hoặc product
            quantity: item.quantity,
            selectedOptions: displayOptions,
            image: { // Lấy ảnh đầu tiên của variant hoặc product
              url: imageUrl,
              alt: imageAlt,
            },
            brand: { // Lấy brand từ product đã populate
              name: productData.brandId.name,
              slug: productData.brandId.slug,
            },
            // Store inventory information
            inStock: totalStock > 0,
            maxQuantity: totalStock,
            branchInventory: branchInventory,
            selectedBranchId: selectedBranchId, // Add selectedBranchId from options
            isProductWithoutVariants: isProductWithoutVariants, // Flag to identify products without variants
            // Gán cosmetic_info từ productData
            cosmetic_info: productData.cosmetic_info,
          } as CartProduct;
        } catch (err: any) {
          console.error(`Lỗi khi lấy hoặc xử lý chi tiết variant ${item.variantId}:`, err.message);
          // Có thể thông báo lỗi cụ thể cho item này nếu cần
          return null; // Bỏ qua item nếu có lỗi
        }
      });

      // Lọc bỏ các item bị lỗi (null)
      const populatedItems = (await Promise.all(populatedItemsPromises)).filter((item): item is CartProduct => item !== null);

      // Kiểm tra nếu có item bị loại bỏ do lỗi
      if (populatedItems.length < backendCart.items.length) {
          const missingCount = backendCart.items.length - populatedItems.length;
          console.error(`${missingCount} sản phẩm trong giỏ hàng không thể hiển thị do lỗi dữ liệu.`);

          // Tìm các item bị lỗi để ghi log chi tiết
          const validVariantIds = populatedItems.map(item => item.variantId);
          const missingItems = backendCart.items.filter(item => {
              // Với sản phẩm không có biến thể, variantId có thể là '' hoặc null
              const itemVariantId = item.variantId || '';
              return !validVariantIds.includes(itemVariantId);
          });

          console.error('Chi tiết các sản phẩm bị lỗi:', missingItems);

          // Hiển thị thông báo cho người dùng
          toast.warn(`${missingCount} sản phẩm trong giỏ hàng không thể hiển thị do lỗi dữ liệu.`);

          // Tự động xóa các item không hợp lệ khỏi giỏ hàng sau 2 giây
          setTimeout(async () => {
              try {
                  for (const item of missingItems) {
                      const apiVariantId = item.variantId || 'none';
                      const encodedVariantId = encodeURIComponent(apiVariantId);
                      await fetch(`${API_URL}/carts/items/${encodedVariantId}`, {
                          method: 'DELETE',
                          headers: {
                              ...getAuthHeaders(),
                          },
                      });

                  }
                  // Không cần fetch lại giỏ hàng vì chúng ta đã lọc các item lỗi
              } catch (cleanupErr) {
                  console.error('Lỗi khi tự động dọn dẹp giỏ hàng:', cleanupErr);
              }
          }, 2000);
      }

      setCartItems(populatedItems);

    } catch (err: any) {
      console.error('Error fetching cart:', err.message);
      const message = err.message || 'Không thể tải giỏ hàng. Vui lòng thử lại.';
      setError(message);
      setCartItems([]); // Clear cart on UI if there's a critical fetch error
      // toast.error(message); // Optionally show toast error here
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]); // Dependency is only isAuthenticated now

  // Fetch giỏ hàng khi component mount hoặc khi trạng thái đăng nhập thay đổi
  useEffect(() => {
    fetchAndPopulateCart();
  }, [fetchAndPopulateCart, isAuthenticated]); // Thêm isAuthenticated

  const addItemToCart = async (productId: string, variantId: string | undefined | null | '', quantity: number, options?: Record<string, string>, price?: number): Promise<boolean> => {

    if (!isAuthenticated) {
      toast.info('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng.');
      return false;
    }
    // Optional: Add loading state specific to this action
    // setIsLoadingAdd(true);
    try {
      const dto = { productId, variantId, quantity, selectedOptions: options, price };
      // Gọi API POST bằng fetch
      const response = await fetch(`${API_URL}/carts/items`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              ...getAuthHeaders(),
          },
          body: JSON.stringify(dto),
      });

      if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: response.statusText }));
          throw new Error(errorData.message || 'Failed to add item to cart');
      }

      // const responseData: BackendCart = await response.json(); // Backend returns the updated cart

      // API thành công, fetch lại toàn bộ giỏ hàng để cập nhật UI với dữ liệu mới nhất
      await fetchAndPopulateCart();
      toast.success('Đã thêm sản phẩm vào giỏ hàng');

      // Ghi lại hoạt động thêm vào giỏ hàng
      try {
        await axios.post(`/recommendations/log/add-to-cart/${productId}`, {
          variantId: variantId || undefined
        });
      } catch (error) {
        console.error('Error logging add to cart activity:', error);
      }

      return true;

     } catch (err: any) {
      console.error('Lỗi khi thêm vào giỏ hàng:', err);
      console.error('Chi tiết sản phẩm gặp lỗi:', { productId, variantId, quantity, options });

      // Xử lý các trường hợp lỗi cụ thể
      let message = err.message || 'Thêm vào giỏ hàng thất bại. Có thể sản phẩm đã hết hàng hoặc số lượng không hợp lệ.';

      // Kiểm tra các lỗi cụ thể và cung cấp thông báo hữu ích hơn
      if (err.message?.includes('not found') || err.message?.includes('không tìm thấy')) {
        message = 'Sản phẩm không tồn tại hoặc đã bị xóa khỏi hệ thống.';
      } else if (err.message?.includes('out of stock') || err.message?.includes('hết hàng')) {
        message = 'Sản phẩm đã hết hàng. Vui lòng chọn sản phẩm khác.';
      } else if (err.message?.includes('invalid') || err.message?.includes('không hợp lệ')) {
        message = 'Thông tin sản phẩm không hợp lệ. Vui lòng thử lại sau.';
      }

      toast.error(message);
      setError(message); // Cập nhật lỗi chung nếu cần
      return false;
    } finally {
       // setIsLoadingAdd(false);
    }
  };

  // Debounce function to prevent rapid API calls
  const debounce = (callback: Function, delay: number) => {
    const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

    return (...args: any[]) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    };
  };

  // Queue for pending updates to prevent conflicting API calls
  const pendingUpdates = useRef<Record<string, number>>({});

  const updateCartItem = async (itemId: string, quantity: number, showToast: boolean = false, selectedBranchId?: string, price?: number): Promise<boolean> => { // Changed variantId to itemId
     if (!isAuthenticated) return false;

     // Tìm item hiện tại bằng itemId (là _id của CartProduct)
     const currentItem = cartItems.find(item => item._id === itemId);

     if (!currentItem) {
       console.error(`Could not find cart item with itemId: ${itemId}`);
       return false; // Không tìm thấy item
     }

     // Ensure quantity is within valid range
     const validQuantity = Math.max(1, Math.min(quantity, currentItem.maxQuantity));

     // If requested quantity exceeds max, show a warning
     if (quantity > currentItem.maxQuantity && showToast) {
       toast.info(`Số lượng tối đa có thể mua là ${currentItem.maxQuantity}`, {
         position: "bottom-right",
         autoClose: 2000,
         hideProgressBar: true,
       });
     }

     // If quantity hasn't changed, do nothing
     if (currentItem.quantity === validQuantity && currentItem.selectedBranchId === selectedBranchId && !price) return true; // Check selectedBranchId too

     // Kiểm tra nếu chi nhánh thay đổi và có sản phẩm đã được chọn
     const isChangingBranch = selectedBranchId && currentItem.selectedBranchId !== selectedBranchId;
     let updatedSelectedItems = [...selectedItems];

     if (isChangingBranch && selectedItems.length > 0) {
       // Nếu đang thay đổi chi nhánh và có sản phẩm đã chọn
       const currentSelectedBranchId = getSelectedBranchId();

       if (currentSelectedBranchId && currentSelectedBranchId !== selectedBranchId) {
         // Nếu chi nhánh mới khác với chi nhánh đã chọn, bỏ chọn tất cả sản phẩm
         updatedSelectedItems = [];
         toast.info('Đã bỏ chọn các sản phẩm khác chi nhánh do thay đổi chi nhánh', {
           position: "bottom-right",
           autoClose: 3000,
           hideProgressBar: true,
         });
       }
     }

     // Store this update in the pending queue
     pendingUpdates.current[itemId] = validQuantity; // Use itemId as key

     // Optimistic UI update: Cập nhật state ngay lập tức
     const originalItems = [...cartItems];
     const originalSelectedItems = [...selectedItems];

     // Cập nhật selectedItems nếu có thay đổi
     if (updatedSelectedItems.length !== selectedItems.length) {
       setSelectedItems(updatedSelectedItems);
     }

     setCartItems(prevItems =>
       prevItems.map(item => {
         if (item._id === itemId) { // Match by itemId
           return {
             ...item,
             quantity: validQuantity,
             selectedBranchId: selectedBranchId || item.selectedBranchId,
             price: price || item.price
           }; // Đảm bảo số lượng hợp lệ và lưu chi nhánh đã chọn
         }
         return item;
       })
     );

    try {
      // Create DTO with quantity, selectedBranchId, and price if provided
      const dto: any = { quantity: validQuantity };

      // Add price to DTO if provided
      if (price) {
        dto.price = price;
      }

      // Prepare selectedOptions for the DTO
      // Start with current item's selectedOptions to preserve combinationId
      let selectedOptions = currentItem.selectedOptions ? { ...currentItem.selectedOptions } : {};

      // Add or update selectedBranchId if provided
      if (selectedBranchId) {
        selectedOptions.selectedBranchId = selectedBranchId;
      }

      // Add selectedOptions to the DTO if we have any
      if (Object.keys(selectedOptions).length > 0) {
        dto.selectedOptions = selectedOptions;
      }

      // For products with variants and combinations, format as "variantId:combinationId"
      let apiVariantId;
      if (currentItem.isProductWithoutVariants) {
        apiVariantId = 'none';
      } else if (currentItem.selectedOptions && currentItem.selectedOptions.combinationId) {
        // If there's a combinationId, use it with the actual variantId
        apiVariantId = `${currentItem.variantId}:${currentItem.selectedOptions.combinationId}`;
      } else {
        // Otherwise, just use the variantId
        apiVariantId = currentItem.variantId;
      }

      // Gọi API PATCH bằng fetch - encode variantId to handle special characters
      const encodedVariantId = encodeURIComponent(apiVariantId);
      const response = await fetch(`${API_URL}/carts/items/${encodedVariantId}`, {
          method: 'PATCH',
          headers: {
              'Content-Type': 'application/json',
              ...getAuthHeaders(),
          },
          body: JSON.stringify(dto),
      });

      // Remove from pending updates after API call completes
      delete pendingUpdates.current[itemId]; // Use itemId as key

      if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: response.statusText }));
          throw new Error(errorData.message || 'Failed to update cart item');
      }

      // Only show toast if explicitly requested
      if (showToast) {
        toast.success('Đã cập nhật số lượng sản phẩm', {
          autoClose: 2000,
          hideProgressBar: true,
          position: "bottom-right"
        });
      }

      return true;

    } catch (err: any) {
      console.error('Lỗi khi cập nhật giỏ hàng:', err.message);
      const message = err.message || 'Cập nhật giỏ hàng thất bại. Số lượng có thể không hợp lệ.';
      toast.error(message);
      setError(message);
      // Rollback optimistic update nếu API thất bại
      setCartItems(originalItems);
      setSelectedItems(originalSelectedItems);
      return false;
    }
  };

  // Create a debounced version of updateCartItem
  const debouncedUpdateCartItem = useCallback(
    debounce((itemId: string, quantity: number, showToast: boolean = false, selectedBranchId?: string, price?: number) => { // Changed variantId to itemId
      updateCartItem(itemId, quantity, showToast, selectedBranchId, price); // Changed variantId to itemId
    }, 500), // 500ms debounce delay
    [updateCartItem]
  );

  const removeCartItem = async (itemId: string): Promise<boolean> => { // Changed variantId to itemId
    if (!isAuthenticated) return false;

    // Optimistic UI update
    const originalItems = [...cartItems];
    setCartItems(prevItems => prevItems.filter(item => item._id !== itemId)); // Filter by itemId

    try {
      // Find the item to get its variantId and combinationId for the API call
      const currentItem = originalItems.find(item => item._id === itemId);
      if (!currentItem) {
        console.warn(`Item with ID ${itemId} not found for removal, possibly already removed.`);
        return true; // Consider it successful if item is already gone
      }

      let apiVariantId;
      if (currentItem.isProductWithoutVariants) {
        apiVariantId = 'none';
      } else if (currentItem.selectedOptions && currentItem.selectedOptions.combinationId) {
        apiVariantId = `${currentItem.variantId}:${currentItem.selectedOptions.combinationId}`;
      } else {
        apiVariantId = currentItem.variantId;
      }



      // Gọi API DELETE bằng fetch - encode variantId to handle special characters
      const encodedVariantId = encodeURIComponent(apiVariantId);
      const response = await fetch(`${API_URL}/carts/items/${encodedVariantId}`, {
          method: 'DELETE',
          headers: {
              ...getAuthHeaders(),
          },
      });

      // API có thể trả về giỏ hàng mới (status 200) hoặc không (status 204)
      if (response.ok) { // Checks for 2xx status codes


        // Fetch lại giỏ hàng để đảm bảo đồng bộ
        await fetchAndPopulateCart();
        toast.info('Đã xóa sản phẩm khỏi giỏ hàng');
        return true;
      } else {
        // Xử lý các trường hợp lỗi cụ thể
        if (response.status === 404) {

          // Vẫn trả về true vì mục tiêu là xóa sản phẩm khỏi giỏ hàng
          return true;
        }

        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || 'Failed to remove cart item');
      }
    } catch (err: any) {
      console.error('Lỗi khi xóa sản phẩm:', err.message);
      const message = err.message || 'Xóa sản phẩm thất bại. Vui lòng thử lại.';
      toast.error(message);
      setError(message);
      // Rollback optimistic update
      setCartItems(originalItems);
      return false;
    }
  };

  const clearCart = async (): Promise<boolean> => {
    if (!isAuthenticated) return false;

    // Optimistic UI update
    const originalItems = [...cartItems];
    setCartItems([]);
    // setIsLoading(true); // Có thể thêm loading indicator

    try {
      // Gọi API DELETE bằng fetch
      const response = await fetch(`${API_URL}/carts`, {
          method: 'DELETE',
          headers: {
              ...getAuthHeaders(),
          },
      });

      if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: response.statusText }));
          throw new Error(errorData.message || 'Failed to clear cart');
      }

      // Không cần fetch lại vì giỏ hàng đã trống
      toast.info('Đã xóa toàn bộ giỏ hàng');
      // setIsLoading(false);
      return true;
    } catch (err: any) {
      console.error('Lỗi khi xóa giỏ hàng:', err.message);
      const message = err.message || 'Xóa giỏ hàng thất bại. Vui lòng thử lại.';
      toast.error(message);
      setError(message);
      // Rollback optimistic update
      setCartItems(originalItems);
      // setIsLoading(false);
      return false;
    }
  };

  // Tính toán các giá trị phụ thuộc từ state cartItems
  // Fix 'any' type errors by specifying the type for 'item'
  const itemCount = cartItems.reduce((sum: number, item: CartProduct) => sum + item.quantity, 0);
  // Subtotal tính dựa trên giá LÚC THÊM VÀO GIỎ (price từ BackendCartItem đã được map vào CartProduct)
  const subtotal = cartItems.reduce((sum: number, item: CartProduct) => sum + item.price * item.quantity, 0);

  // Tính toán cho sản phẩm được chọn
  const selectedCartItems = cartItems.filter(item => selectedItems.includes(item._id));
  const selectedItemCount = selectedCartItems.reduce((sum: number, item: CartProduct) => sum + item.quantity, 0);
  const selectedSubtotal = selectedCartItems.reduce((sum: number, item: CartProduct) => sum + item.price * item.quantity, 0);

  // Tính toán giảm giá từ voucher đã áp dụng
  const discount = appliedVoucher ? appliedVoucher.discountAmount : 0;

  // Tính tổng tiền sau khi áp dụng giảm giá (phí vận chuyển sẽ được tính ở trang thanh toán)
  const total = subtotal - discount;
  const selectedTotal = selectedSubtotal - discount;

  // Hàm áp dụng voucher
  const applyVoucher = async (code: string): Promise<boolean> => {
    if (!code.trim()) {
      toast.error('Vui lòng nhập mã giảm giá');
      return false;
    }

    try {
      // Lấy danh sách ID sản phẩm - ưu tiên sản phẩm được chọn nếu có
      const relevantItems = selectedItems.length > 0
        ? cartItems.filter(item => selectedItems.includes(item._id))
        : cartItems;

      const productIds = relevantItems.map(item => item.productId);
      const relevantSubtotal = selectedItems.length > 0 ? selectedSubtotal : subtotal;

      // Gọi API áp dụng voucher
      const result = await applyVoucherApi(code, relevantSubtotal, productIds);

      if (result) {
        setVoucherCode(code);
        // Lưu voucherId từ kết quả API
        if (result.voucherId) {
          setVoucherId(result.voucherId);
          console.log(`Applied voucher with ID: ${result.voucherId}`);
        }

        // Không cập nhật phí vận chuyển ở đây nữa, phí vận chuyển sẽ được tính ở trang thanh toán

        return true;
      }
      return false;
    } catch (err) {
      console.error('Lỗi khi áp dụng voucher:', err);
      return false;
    }
  };

  // Hàm xóa voucher đã áp dụng
  const clearVoucher = () => {
    clearAppliedVoucher();
    setVoucherCode('');
    setVoucherId(''); // Reset voucherId
    // Không cập nhật phí vận chuyển ở đây nữa
  };

  // Hàm cập nhật phí vận chuyển
  const updateShipping = (amount: number) => {
    setShipping(amount);
  };

  // Selection functions
  const getSelectedBranchId = (): string | null => {
    if (selectedItems.length === 0) return null;

    const selectedItem = cartItems.find(item => selectedItems.includes(item._id));
    return selectedItem?.selectedBranchId || null;
  };

  const canSelectItem = (itemId: string): boolean => {
    const item = cartItems.find(i => i._id === itemId);
    if (!item || !item.selectedBranchId) return false;

    const selectedBranchId = getSelectedBranchId();

    // Nếu chưa có item nào được chọn, có thể chọn item này
    if (!selectedBranchId) return true;

    // Nếu đã có item được chọn, chỉ có thể chọn item cùng chi nhánh
    return item.selectedBranchId === selectedBranchId;
  };

  const selectItem = (itemId: string): boolean => {
    const item = cartItems.find(i => i._id === itemId);
    if (!item || !item.selectedBranchId) {
      toast.warn('Vui lòng chọn chi nhánh cho sản phẩm trước khi thêm vào đơn hàng');
      return false;
    }

    const currentSelectedBranchId = getSelectedBranchId();

    // Nếu đã có sản phẩm được chọn từ chi nhánh khác
    if (currentSelectedBranchId && currentSelectedBranchId !== item.selectedBranchId) {
      // Bỏ chọn tất cả sản phẩm hiện tại và chọn sản phẩm mới
      setSelectedItems([itemId]);
      toast.info('Đã bỏ chọn sản phẩm khác chi nhánh và chọn sản phẩm mới', {
        position: "bottom-right",
        autoClose: 3000,
        hideProgressBar: true,
      });
      return true;
    }

    // Nếu chưa có sản phẩm nào được chọn hoặc cùng chi nhánh
    setSelectedItems(prev => {
      if (!prev.includes(itemId)) {
        return [...prev, itemId];
      }
      return prev;
    });
    return true;
  };

  const unselectItem = (itemId: string): void => {
    setSelectedItems(prev => prev.filter(id => id !== itemId));
  };

  const selectAllItemsInBranch = (branchId: string): boolean => {
    const branchItems = cartItems.filter(item =>
      item.selectedBranchId === branchId && item.inStock
    );

    if (branchItems.length === 0) return false;

    // Kiểm tra xem có thể chọn tất cả items trong branch này không
    const selectedBranchId = getSelectedBranchId();
    if (selectedBranchId && selectedBranchId !== branchId) {
      // Bỏ chọn tất cả sản phẩm hiện tại và chọn tất cả sản phẩm trong chi nhánh mới
      const branchItemIds = branchItems.map(item => item._id);
      setSelectedItems(branchItemIds);
      toast.info('Đã bỏ chọn sản phẩm khác chi nhánh và chọn tất cả sản phẩm trong chi nhánh mới', {
        position: "bottom-right",
        autoClose: 3000,
        hideProgressBar: true,
      });
      return true;
    }

    const branchItemIds = branchItems.map(item => item._id);
    setSelectedItems(prev => {
      const newSelected = [...prev];
      branchItemIds.forEach(id => {
        if (!newSelected.includes(id)) {
          newSelected.push(id);
        }
      });
      return newSelected;
    });
    return true;
  };

  const unselectAllItemsInBranch = (branchId: string): void => {
    const branchItemIds = cartItems
      .filter(item => item.selectedBranchId === branchId)
      .map(item => item._id);

    setSelectedItems(prev => prev.filter(id => !branchItemIds.includes(id)));
  };

  const clearSelection = (): void => {
    setSelectedItems([]);
  };

  // Hàm helper để kiểm tra và làm sạch selection khi có thay đổi chi nhánh
  const validateAndCleanSelection = useCallback(() => {
    if (selectedItems.length === 0) return;

    const validSelectedItems = selectedItems.filter(itemId => {
      const item = cartItems.find(i => i._id === itemId);
      return item && item.selectedBranchId;
    });

    if (validSelectedItems.length === 0) {
      setSelectedItems([]);
      return;
    }

    // Kiểm tra xem tất cả sản phẩm được chọn có cùng chi nhánh không
    const firstItemBranchId = cartItems.find(i => i._id === validSelectedItems[0])?.selectedBranchId;
    const allSameBranch = validSelectedItems.every(itemId => {
      const item = cartItems.find(i => i._id === itemId);
      return item?.selectedBranchId === firstItemBranchId;
    });

    if (!allSameBranch) {
      // Nếu không cùng chi nhánh, chỉ giữ lại sản phẩm đầu tiên
      setSelectedItems([validSelectedItems[0]]);
      toast.info('Đã bỏ chọn các sản phẩm khác chi nhánh', {
        position: "bottom-right",
        autoClose: 2000,
        hideProgressBar: true,
      });
    } else if (validSelectedItems.length !== selectedItems.length) {
      // Nếu có sản phẩm không hợp lệ, cập nhật lại danh sách
      setSelectedItems(validSelectedItems);
    }
  }, [selectedItems, cartItems]);

  // Chạy validation khi cartItems thay đổi
  useEffect(() => {
    validateAndCleanSelection();
  }, [cartItems, validateAndCleanSelection]);

  // Không cập nhật phí vận chuyển ở đây nữa, phí vận chuyển sẽ được tính ở trang thanh toán

  return (
    <CartContext.Provider value={{
        cartItems,
        selectedItems,
        itemCount,
        selectedItemCount,
        subtotal,
        selectedSubtotal,
        isLoading,
        error,
        appliedVoucher,
        discount,
        shipping,
        total,
        selectedTotal,
        voucherCode,
        voucherId,
        fetchCart: fetchAndPopulateCart,
        addItemToCart,
        updateCartItem,
        debouncedUpdateCartItem,
        removeCartItem,
        clearCart,
        applyVoucher,
        clearVoucher,
        updateShipping,
        selectItem,
        unselectItem,
        selectAllItemsInBranch,
        unselectAllItemsInBranch,
        clearSelection,
        canSelectItem,
        getSelectedBranchId
    }}>
      {children}
    </CartContext.Provider>
  );
};

// Hook tùy chỉnh để sử dụng CartContext
export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart phải được sử dụng bên trong CartProvider');
  }
  return context;
};
