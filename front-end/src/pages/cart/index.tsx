import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Context
import { useCart } from '@/contexts/user/cart/CartContext'; // Import useCart

// Components
import CartItem from '@/components/cart/CartItem';
import CartSummary from '@/components/cart/CartSummary';
import EmptyCart from '@/components/cart/EmptyCart';
import RecommendedProducts from '@/components/common/RecommendedProducts';
import DefaultLayout from '@/layout/DefaultLayout';

// Hooks
import { useBranches } from '@/hooks/useBranches';

// Import CartProduct interface from CartContext
import { CartProduct } from '@/contexts/user/cart/CartContext';

// Extend CartProduct interface to include branchName
interface ExtendedCartProduct extends CartProduct {
  branchInventory?: Array<{ branchId: string; quantity: number; branchName?: string }>;
}

// Định nghĩa kiểu dữ liệu cho sản phẩm gợi ý (Keep for RecommendedProducts)
interface RecommendedProduct {
  _id: string;
  name: string;
  slug: string;
  price: number;
  currentPrice: number;
  image: {
    url: string;
    alt: string;
  };
  brand: {
    name: string;
    slug: string;
  };
  inStock: boolean;
}

const CartPage: NextPage = () => {
  const router = useRouter();
  const {
    cartItems,
    isLoading,
    error, // Get error state from context
    subtotal, // Get subtotal directly from context
    itemCount, // Get itemCount directly from context
    debouncedUpdateCartItem,
    removeCartItem,
    // addItemToCart // Keep if needed for RecommendedProducts later
  } = useCart();

  // Use the branches hook to get branch information
  const { branches, loading: branchesLoading } = useBranches();

  // Combined loading state
  const isPageLoading = isLoading || branchesLoading;

  // State for voucher and shipping (keep local for now)
  const [voucherCode, setVoucherCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [shipping, setShipping] = useState(0);

  // State for recommended products (temporary, fetch later)
  const [recommendedProducts, setRecommendedProducts] = useState<RecommendedProduct[]>([]);

  // Fetch recommended products (example, replace with actual API call)
  useEffect(() => {
    const fetchRecommended = async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      // Set temporary recommended products data here if needed for UI
      setRecommendedProducts([
        // Add some sample RecommendedProduct data if you want to display them
        // Example:
        { _id: 'rec1', name: 'Recommended Item 1', slug: 'rec-item-1', price: 100000, currentPrice: 90000, image: { url: '/placeholder.jpg', alt: 'Rec 1'}, brand: { name: 'Brand Rec', slug: 'brand-rec'}, inStock: true },
      ]);
    };
    fetchRecommended();
  }, []);


  // Calculate shipping based on subtotal from context
  useEffect(() => {
    // Only calculate shipping if not using FREESHIP voucher and cart is loaded
    if (!isLoading && voucherCode.toUpperCase() !== 'FREESHIP') {
      setShipping(subtotal > 500000 ? 0 : 30000);
    } else if (voucherCode.toUpperCase() === 'FREESHIP') {
      setShipping(0); // Ensure shipping is 0 if FREESHIP is applied
    }
  }, [subtotal, voucherCode, isLoading]);


  // Xử lý cập nhật số lượng sản phẩm - Use debounced context function
  // Note: CartItem component should pass variantId as 'id' prop
  const handleUpdateQuantity = (variantId: string, quantity: number, showToast: boolean = false, selectedBranchId?: string) => {
    debouncedUpdateCartItem(variantId, quantity, showToast, selectedBranchId);
    // Toast messages are handled within the context now
  };

  // Xử lý xóa sản phẩm khỏi giỏ hàng - Use context function
  // Note: CartItem component should pass variantId as 'id' prop
  const handleRemoveItem = (variantId: string) => {
    removeCartItem(variantId);
    // Toast messages are handled within the context now
  };

  // Xử lý áp dụng mã giảm giá (Keep local logic for now)
  const handleApplyVoucher = (code: string) => {
    // Trong thực tế, mã này sẽ được gửi đến server để kiểm tra tính hợp lệ
    // Đây chỉ là mã mẫu để demo
    if (code.toUpperCase() === 'YUMIN10') {
      // Giảm 10% cho toàn bộ đơn hàng - Use subtotal from context
      setDiscount(Math.round(subtotal * 0.1));
      setVoucherCode(code);
      // Recalculate shipping if discount changes subtotal boundary
      setShipping((subtotal * 0.9) > 500000 ? 0 : 30000);
      toast.success('Đã áp dụng mã giảm giá YUMIN10', {
        position: "bottom-right",
        autoClose: 3000,
        theme: "light",
        style: { backgroundColor: '#fdf2f8', color: '#db2777', borderLeft: '4px solid #db2777' }
      });
    } else if (code.toUpperCase() === 'FREESHIP') {
      // Miễn phí vận chuyển
      setShipping(0); // Set shipping directly
      setVoucherCode(code);
      setDiscount(0); // Reset other discounts if applying freeship
      toast.success('Đã áp dụng mã miễn phí vận chuyển', {
        position: "bottom-right",
        autoClose: 3000,
        theme: "light",
        style: { backgroundColor: '#fdf2f8', color: '#db2777', borderLeft: '4px solid #db2777' }
      });
    } else {
      // Reset discount and voucher if invalid
      setDiscount(0);
      setVoucherCode('');
      // Recalculate shipping based on original subtotal
      setShipping(subtotal > 500000 ? 0 : 30000);
      toast.error('Mã giảm giá không hợp lệ hoặc đã hết hạn', {
        position: "bottom-right",
        autoClose: 3000,
        theme: "light",
        style: { backgroundColor: '#f8d7da', color: '#721c24', borderLeft: '4px solid #721c24' }
      });
    }
  };

  // Xử lý nút thanh toán (Keep as is)
  const handleProceedToCheckout = () => {
    if (itemCount === 0) {
        toast.warn('Giỏ hàng của bạn đang trống.');
        return;
    }
    // Check if any item is out of stock
    const outOfStockItems = cartItems.filter(item => !item.inStock);
    if (outOfStockItems.length > 0) {
        toast.error(`Sản phẩm "${outOfStockItems[0].name}" đã hết hàng. Vui lòng xóa khỏi giỏ hàng để tiếp tục.`);
        return;
    }

    router.push('/payments'); // Navigate to payments page
    // Optional: Add success toast after navigation if needed, but usually handled on the next page
    // toast.success('Đang chuyển đến trang thanh toán...', { ... });
  };

  // Tính toán tổng tiền (sử dụng subtotal từ context)
  const total = subtotal - discount + shipping;

  // Define interface for grouped cart items
  interface CartItemGroup {
    branchId: string;
    branchName: string;
    address?: string;
    items: ExtendedCartProduct[];
  }

  // Branch information is already fetched at the top of the component
  // If there's an error loading branches, we'll still show the cart with fallback branch names

  // Group cart items by branch
  const groupedCartItems = React.useMemo<CartItemGroup[]>(() => {
    // Create a map to store items by branch
    const branchMap = new Map<string, CartItemGroup>();

    // Add a "No Branch" group for items without a branch
    branchMap.set('no-branch', {
      branchId: 'no-branch',
      branchName: 'Sản phẩm chưa chọn chi nhánh',
      items: []
    });

    // Group items by branch
    cartItems.forEach(item => {
      if (item.selectedBranchId) {
        // Find branch from API data
        const branch = branches.find(b => b._id === item.selectedBranchId);

        // Find branch name from item's branchInventory as fallback
        const branchInfo = item.branchInventory?.find(b => b.branchId === item.selectedBranchId);
        let branchNameStr = `Chi nhánh ${item.selectedBranchId.substring(0, 6)}...`;

        if (branch?.name) {
          branchNameStr = branch.name;
        } else if (branchInfo && 'branchName' in branchInfo && typeof branchInfo.branchName === 'string') {
          branchNameStr = branchInfo.branchName;
        }

        // Check if this branch already exists in the map
        if (!branchMap.has(item.selectedBranchId)) {
          branchMap.set(item.selectedBranchId, {
            branchId: item.selectedBranchId,
            branchName: branch?.name || branchNameStr,
            address: branch?.address || '',
            items: []
          });
        }

        // Add item to the branch group
        branchMap.get(item.selectedBranchId)!.items.push(item);
      } else {
        // Add item to the "No Branch" group
        branchMap.get('no-branch')!.items.push(item);
      }
    });

    // Convert map to array and filter out empty groups
    return Array.from(branchMap.values())
      .filter(group => group.items.length > 0);
  }, [cartItems, branches]);

  // Render UI
  return (
    <DefaultLayout>
      <Head>
        <title>Giỏ hàng | YUMIN Beauty</title>
        <meta name="description" content="Giỏ hàng của bạn tại YUMIN Beauty - Mỹ phẩm chính hãng" />
      </Head>

      {/* Toast Container is now in DefaultLayout */}

      <div className="bg-gray-50 min-h-screen py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Giỏ hàng</h1>

          {/* Display general error message from context */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
              <strong className="font-bold">Lỗi!</strong>
              <span className="block sm:inline"> {error}</span>
            </div>
          )}

          {isPageLoading ? (
            // Loading state
            <div className="flex justify-center items-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
            </div>
          ) : itemCount === 0 ? ( // Use itemCount from context
            // Empty cart
            <EmptyCart />
          ) : (
            // Cart with items
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Cart Items Section */}
              <div className="lg:col-span-2">
                {groupedCartItems.map(group => (
                  <div key={group.branchId} className="bg-white rounded-lg shadow-sm p-4 md:p-6 mb-4">
                    <div className="mb-4 pb-2 border-b border-gray-200">
                      <div className="flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-gray-800">
                          {group.branchId === 'no-branch' ? (
                            <span className="text-gray-700">Sản phẩm chưa chọn chi nhánh</span>
                          ) : (
                            <div className="flex flex-col">
                              <div className="flex items-center bg-pink-50 px-3 py-1.5 rounded-md">
                                <span className="text-pink-600 mr-2">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                  </svg>
                                </span>
                                <span className="text-pink-700">{group.branchName}</span>
                              </div>
                              {group.address && (
                                <span className="text-xs text-gray-500 mt-1 ml-7">{group.address}</span>
                              )}
                            </div>
                          )}
                        </h2>
                        <span className="text-sm bg-gray-100 px-2 py-1 rounded-md text-gray-600 font-medium">
                          {group.items.length} sản phẩm
                        </span>
                      </div>
                    </div>

                    {/* List of cart items in this branch */}
                    <div className="space-y-1">
                      {group.items.map(item => (
                        <CartItem
                          key={item.variantId} // Use variantId as key
                          _id={item.variantId} // Pass variantId as _id prop for CartItem internal use if needed
                          productId={item.productId}
                          variantId={item.variantId}
                          name={item.name}
                          slug={item.slug}
                          image={item.image}
                          brand={item.brand}
                          price={item.price}
                          originalPrice={item.originalPrice}
                          quantity={item.quantity}
                          selectedOptions={item.selectedOptions}
                          inStock={item.inStock}
                          maxQuantity={item.maxQuantity}
                          branchInventory={item.branchInventory || []}
                          selectedBranchId={item.selectedBranchId}
                          onUpdateQuantity={handleUpdateQuantity} // Pass context function
                          onRemove={handleRemoveItem} // Pass context function
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Cart Summary Section */}
              <div className="lg:col-span-1">
                <CartSummary
                  subtotal={subtotal} // Use subtotal from context
                  discount={discount} // Use local state discount
                  shipping={shipping} // Use local state shipping
                  total={total} // Use calculated total
                  itemCount={itemCount} // Use itemCount from context
                  voucherCode={voucherCode} // Use local state voucherCode
                  onApplyVoucher={handleApplyVoucher} // Pass local handler
                  onProceedToCheckout={handleProceedToCheckout} // Pass local handler
                />
              </div>
            </div>
          )}

          {/* Recommended Products Section */}
          {/* Consider fetching recommended products based on cart items */}
          {!isLoading && recommendedProducts.length > 0 && (
            <div className="mt-16">
              <RecommendedProducts
                products={recommendedProducts as any[]}
                // Remove onAddToWishlist prop if not supported by the component
                // onAddToWishlist={handleAddToWishlist}
              />
            </div>
          )}
        </div>
      </div>
    </DefaultLayout>
  );
};

export default CartPage;
