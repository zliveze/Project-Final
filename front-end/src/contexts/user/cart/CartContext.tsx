import React, { createContext, useState, useContext, useEffect, useCallback, ReactNode, useRef } from 'react';
import { toast } from 'react-toastify';
// Import dependencies thực tế
import { useAuth } from '@/contexts/AuthContext'; // Điều chỉnh đường dẫn nếu cần

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
    // Thêm các trường khác nếu có trong ProductVariant schema
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
}

interface CartContextType {
  cartItems: CartProduct[];
  itemCount: number;
  subtotal: number;
  isLoading: boolean;
  error: string | null;
  fetchCart: () => Promise<void>;
  addItemToCart: (productId: string, variantId: string | undefined | null | '', quantity: number, options?: Record<string, string>) => Promise<boolean>; // Allow undefined, null, or empty string variantId
  updateCartItem: (variantId: string, quantity: number, showToast?: boolean, selectedBranchId?: string) => Promise<boolean>;
  debouncedUpdateCartItem: (variantId: string, quantity: number, showToast?: boolean, selectedBranchId?: string) => void;
  removeCartItem: (variantId: string) => Promise<boolean>;
  clearCart: () => Promise<boolean>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth(); // Chỉ cần isAuthenticated từ context

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
            embeddedVariant = productData.variants?.find(v => v.variantId?.toString() === item.variantId);

            if (!embeddedVariant) {
              console.warn(`Could not find embedded variant details for variantId: ${item.variantId} in product ${productData._id}. Item will be skipped.`);
              return null; // Bỏ qua item nếu không lấy được chi tiết
            }
          } else {
            console.log(`Processing product without variants: ${productData.name} (${productData._id})`);
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
          if (Object.keys(enhancedOptions).length === 0 && embeddedVariant?.options) {
            if (embeddedVariant.options.color) {
              enhancedOptions['Color'] = embeddedVariant.options.color;
            }

            if (embeddedVariant.options.sizes && embeddedVariant.options.sizes.length > 0) {
              enhancedOptions['Size'] = embeddedVariant.options.sizes[0];
            }

            if (embeddedVariant.options.shades && embeddedVariant.options.shades.length > 0) {
              enhancedOptions['Shade'] = embeddedVariant.options.shades[0];
            }
          }

          // Extract selectedBranchId from selectedOptions if it exists
          const selectedBranchId = item.selectedOptions?.selectedBranchId;

          // Create a copy of enhancedOptions without selectedBranchId
          const displayOptions = { ...enhancedOptions };
          delete displayOptions.selectedBranchId;

          // For products without variants, use the product's price
          // For products with variants, use the variant's price
          const originalPrice = isProductWithoutVariants
            ? (productData.currentPrice || productData.price)
            : embeddedVariant.price;

          // For products without variants, use the product's images
          // For products with variants, use the variant's images if available
          const imageUrl = isProductWithoutVariants
            ? productData.images?.[0]?.url || '/404.png'
            : embeddedVariant.images?.[0]?.url || productData.images?.[0]?.url || '/404.png';

          const imageAlt = isProductWithoutVariants
            ? productData.images?.[0]?.alt || productData.name
            : embeddedVariant.images?.[0]?.alt || productData.name;

          // Generate a unique ID for the cart item
          // For products with variants, use the variantId
          // For products without variants, use the productId with a prefix
          const itemId = isProductWithoutVariants
            ? `product-${productData._id}`
            : item.variantId;

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
          toast.warn('Một vài sản phẩm trong giỏ hàng không thể hiển thị do lỗi dữ liệu.');
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

  const addItemToCart = async (productId: string, variantId: string | undefined | null | '', quantity: number, options?: Record<string, string>): Promise<boolean> => {
    console.log(`[CartContext] addItemToCart called with productId: ${productId}, variantId: ${variantId} (${typeof variantId}), quantity: ${quantity}`, options);
    if (!isAuthenticated) {
      toast.info('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng.');
      return false;
    }
    // Optional: Add loading state specific to this action
    // setIsLoadingAdd(true);
    try {
      const dto = { productId, variantId, quantity, selectedOptions: options };
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
      return true;

     } catch (err: any) {
      console.error('Lỗi khi thêm vào giỏ hàng:', err.message);
      const message = err.message || 'Thêm vào giỏ hàng thất bại. Có thể sản phẩm đã hết hàng hoặc số lượng không hợp lệ.';
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

  const updateCartItem = async (variantId: string, quantity: number, showToast: boolean = false, selectedBranchId?: string): Promise<boolean> => {
     if (!isAuthenticated) return false;

     // Tìm item hiện tại để lấy thông tin gốc (nếu cần rollback)
     // For products without variants, variantId will be empty string
     const currentItem = cartItems.find(item =>
       item.isProductWithoutVariants
         ? (item.variantId === '' && variantId === '')
         : item.variantId === variantId
     );

     if (!currentItem) {
       console.error(`Could not find cart item with variantId: ${variantId}`);
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
     if (currentItem.quantity === validQuantity && !selectedBranchId) return true;

     // Store this update in the pending queue
     pendingUpdates.current[variantId] = validQuantity;

     // Optimistic UI update: Cập nhật state ngay lập tức
     const originalItems = [...cartItems];
     setCartItems(prevItems =>
       prevItems.map(item =>
         item.variantId === variantId
           ? {
               ...item,
               quantity: validQuantity,
               selectedBranchId: selectedBranchId || item.selectedBranchId
             } // Đảm bảo số lượng hợp lệ và lưu chi nhánh đã chọn
           : item
       )
     );

    try {
      // Create DTO with quantity and selectedBranchId if provided
      const dto: any = { quantity: validQuantity };

      // Add selectedBranchId to the DTO if it's provided
      if (selectedBranchId) {
        dto.selectedOptions = { selectedBranchId };
      }

      // Gọi API PATCH bằng fetch - encode variantId to handle special characters
      const encodedVariantId = encodeURIComponent(variantId);
      const response = await fetch(`${API_URL}/carts/items/${encodedVariantId}`, {
          method: 'PATCH',
          headers: {
              'Content-Type': 'application/json',
              ...getAuthHeaders(),
          },
          body: JSON.stringify(dto),
      });

      // Remove from pending updates after API call completes
      delete pendingUpdates.current[variantId];

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
      return false;
    }
  };

  // Create a debounced version of updateCartItem
  const debouncedUpdateCartItem = useCallback(
    debounce((variantId: string, quantity: number, showToast: boolean = false, selectedBranchId?: string) => {
      updateCartItem(variantId, quantity, showToast, selectedBranchId);
    }, 500), // 500ms debounce delay
    [updateCartItem]
  );

  const removeCartItem = async (variantId: string): Promise<boolean> => {
    if (!isAuthenticated) return false;

    // Optimistic UI update
    const originalItems = [...cartItems];

    // For products without variants, variantId will be empty string
    setCartItems(prevItems => prevItems.filter(item =>
      item.isProductWithoutVariants
        ? !(item.variantId === '' && variantId === '')
        : item.variantId !== variantId
    ));

    try {
      // For products without variants, use 'none' as the variantId in the API call
      const apiVariantId = variantId === '' ? 'none' : variantId;

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

  return (
    <CartContext.Provider value={{
        cartItems,
        itemCount,
        subtotal,
        isLoading,
        error,
        fetchCart: fetchAndPopulateCart,
        addItemToCart,
        updateCartItem,
        debouncedUpdateCartItem,
        removeCartItem,
        clearCart
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
