import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Context
import { useCart, CartProduct } from '@/contexts/user/cart/CartContext'; // Import useCart and CartProduct

// Components
import CartItem from '@/components/cart/CartItem';
import CartSummary from '@/components/cart/CartSummary';
import EmptyCart from '@/components/cart/EmptyCart';
import RecommendedProducts from '@/components/common/RecommendedProducts';
import DefaultLayout from '@/layout/DefaultLayout';

// Interface CartProduct is now imported from CartContext

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
    updateCartItem, 
    removeCartItem,
    // addItemToCart // Keep if needed for RecommendedProducts later
  } = useCart();

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


  // Xử lý cập nhật số lượng sản phẩm - Use context function
  // Note: CartItem component should pass variantId as 'id' prop
  const handleUpdateQuantity = (variantId: string, quantity: number) => {
    updateCartItem(variantId, quantity); 
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

  // Render UI
  return (
    <DefaultLayout>
      <Head>
        <title>Giỏ hàng | YUMIN Beauty</title>
        <meta name="description" content="Giỏ hàng của bạn tại YUMIN Beauty - Mỹ phẩm chính hãng" />
      </Head>

      <ToastContainer />

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

          {isLoading ? (
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
                <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
                  <div className="mb-4 pb-2 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                      <h2 className="text-lg font-semibold text-gray-800">Sản phẩm</h2>
                      <span className="text-sm text-gray-600">
                        {itemCount} sản phẩm {/* Use itemCount from context */}
                      </span>
                    </div>
                  </div>

                  {/* List of cart items */}
                  <div className="space-y-1">
                    {cartItems.map(item => (
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
                        onUpdateQuantity={handleUpdateQuantity} // Pass context function
                        onRemove={handleRemoveItem} // Pass context function
                      />
                    ))}
                  </div>
                </div>
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
