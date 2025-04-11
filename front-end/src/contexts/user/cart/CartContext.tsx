import React, { createContext, useState, useContext, useEffect, useCallback, ReactNode } from 'react';
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
}

interface CartContextType {
  cartItems: CartProduct[];
  itemCount: number;
  subtotal: number;
  isLoading: boolean;
  error: string | null;
  fetchCart: () => Promise<void>;
  addItemToCart: (productId: string, variantId: string | undefined, quantity: number, options?: Record<string, string>) => Promise<boolean>; // Allow undefined variantId
  updateCartItem: (variantId: string, quantity: number) => Promise<boolean>;
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

          // Find the specific embedded variant within the populated product data
          const embeddedVariant = productData.variants?.find(v => v.variantId?.toString() === item.variantId);

          if (!embeddedVariant) {
            console.warn(`Could not find embedded variant details for variantId: ${item.variantId} in product ${productData._id}. Item will be skipped.`);
            return null; // Bỏ qua item nếu không lấy được chi tiết
          }
          
          // Calculate stock (example: sum inventory across all branches for this product)
          // TODO: Refine stock logic based on specific requirements (e.g., specific branch)
          const totalStock = productData.inventory?.reduce((sum, inv) => sum + inv.quantity, 0) || 0;

          // 3. Kết hợp dữ liệu từ BackendCartItem, PopulatedProduct, và EmbeddedVariant
          return {
            _id: item.variantId, 
            productId: productData._id, 
            variantId: item.variantId,
            name: productData.name, // Lấy tên từ product
            slug: productData.slug, // Lấy slug từ product
            price: item.price, // Giá tại thời điểm thêm
            originalPrice: embeddedVariant.price, // Giá gốc của variant (có thể cần thêm trường originalPrice vào schema ProductVariant)
            quantity: item.quantity,
            selectedOptions: item.selectedOptions,
            image: { // Lấy ảnh đầu tiên của variant hoặc product
              url: embeddedVariant.images?.[0]?.url || productData.images?.[0]?.url || '/placeholder.jpg',
              alt: embeddedVariant.images?.[0]?.alt || productData.name,
            },
            brand: { // Lấy brand từ product đã populate
              name: productData.brandId.name,
              slug: productData.brandId.slug,
            },
            // TODO: Refine inStock and maxQuantity based on actual inventory logic
            inStock: totalStock > 0, 
            maxQuantity: totalStock, 
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

  const addItemToCart = async (productId: string, variantId: string | undefined, quantity: number, options?: Record<string, string>): Promise<boolean> => {
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

  const updateCartItem = async (variantId: string, quantity: number): Promise<boolean> => {
     if (!isAuthenticated) return false;
     
     // Tìm item hiện tại để lấy thông tin gốc (nếu cần rollback)
     const currentItem = cartItems.find(item => item.variantId === variantId);
     if (!currentItem) return false; // Không tìm thấy item

     // Optimistic UI update: Cập nhật state ngay lập tức
     const originalItems = [...cartItems];
     setCartItems(prevItems =>
       prevItems.map(item =>
         item.variantId === variantId 
           ? { ...item, quantity: Math.max(1, Math.min(quantity, item.maxQuantity)) } // Đảm bảo số lượng hợp lệ
           : item
       )
     );

    try {
      const dto = { quantity };
      // Gọi API PATCH bằng fetch
      const response = await fetch(`${API_URL}/carts/items/${variantId}`, {
          method: 'PATCH',
          headers: {
              'Content-Type': 'application/json',
              ...getAuthHeaders(),
          },
          body: JSON.stringify(dto),
      });
       
       if (!response.ok) {
           const errorData = await response.json().catch(() => ({ message: response.statusText }));
           throw new Error(errorData.message || 'Failed to update cart item');
       }
       
       // const responseData: BackendCart = await response.json(); // Backend returns the updated cart

       // API thành công, fetch lại giỏ hàng để đảm bảo đồng bộ hoàn toàn
       await fetchAndPopulateCart(); 
       toast.success('Đã cập nhật số lượng sản phẩm');
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

  const removeCartItem = async (variantId: string): Promise<boolean> => {
    if (!isAuthenticated) return false;
    
    // Optimistic UI update
    const originalItems = [...cartItems];
    setCartItems(prevItems => prevItems.filter(item => item.variantId !== variantId));

    try {
      // Gọi API DELETE bằng fetch
      const response = await fetch(`${API_URL}/carts/items/${variantId}`, {
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
