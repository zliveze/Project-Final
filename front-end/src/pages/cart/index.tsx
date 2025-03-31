import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Components
import CartItem from '@/components/cart/CartItem';
import CartSummary from '@/components/cart/CartSummary';
import EmptyCart from '@/components/cart/EmptyCart';
import RecommendedProducts from '@/components/common/RecommendedProducts';
import DefaultLayout from '@/layout/DefaultLayout';

// Định nghĩa kiểu dữ liệu cho sản phẩm trong giỏ hàng
interface CartProduct {
  _id: string;
  productId: string;
  variantId?: string;
  name: string;
  slug: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  selectedOptions?: {
    color?: string;
    size?: string;
  };
  image: {
    url: string;
    alt: string;
  };
  brand: {
    name: string;
    slug: string;
  };
  inStock: boolean;
  maxQuantity: number;
}

// Định nghĩa kiểu dữ liệu cho sản phẩm gợi ý
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

// Dữ liệu mẫu cho giỏ hàng
const sampleCartData: CartProduct[] = [
  {
    _id: '1',
    productId: 'p1',
    name: 'Kem Chống Nắng La Roche-Posay Anthelios UVMune 400',
    slug: 'kem-chong-nang-la-roche-posay-anthelios-uvmune-400',
    price: 405000,
    originalPrice: 450000,
    quantity: 1,
    selectedOptions: {
      size: '50ml',
    },
    image: {
      url: 'https://product.hstatic.net/1000006063/product/1_9b2a8d9c4e8c4e7a9a3e270d8d0c4c0d_1024x1024.jpg',
      alt: 'Kem Chống Nắng La Roche-Posay'
    },
    brand: {
      name: 'La Roche-Posay',
      slug: 'la-roche-posay'
    },
    inStock: true,
    maxQuantity: 5
  },
  {
    _id: '2',
    productId: 'p2',
    name: 'Serum Vitamin C Klairs Freshly Juiced Vitamin Drop',
    slug: 'serum-vitamin-c-klairs-freshly-juiced-vitamin-drop',
    price: 320000,
    quantity: 2,
    selectedOptions: {
      size: '35ml',
    },
    image: {
      url: 'https://product.hstatic.net/1000006063/product/1_9b2a8d9c4e8c4e7a9a3e270d8d0c4c0d_1024x1024.jpg',
      alt: 'Serum Vitamin C Klairs'
    },
    brand: {
      name: 'Klairs',
      slug: 'klairs'
    },
    inStock: true,
    maxQuantity: 10
  },
  {
    _id: '3',
    productId: 'p3',
    name: 'Nước Tẩy Trang Bioderma Sensibio H2O',
    slug: 'nuoc-tay-trang-bioderma-sensibio-h2o',
    price: 350000,
    originalPrice: 390000,
    quantity: 1,
    selectedOptions: {
      size: '500ml',
    },
    image: {
      url: 'https://product.hstatic.net/1000006063/product/1_9b2a8d9c4e8c4e7a9a3e270d8d0c4c0d_1024x1024.jpg',
      alt: 'Nước Tẩy Trang Bioderma'
    },
    brand: {
      name: 'Bioderma',
      slug: 'bioderma'
    },
    inStock: false,
    maxQuantity: 5
  }
];

// Dữ liệu mẫu cho sản phẩm gợi ý
const sampleRecommendedProducts: RecommendedProduct[] = [
  {
    _id: '4',
    name: 'Kem Dưỡng Ẩm CeraVe Moisturizing Cream',
    slug: 'kem-duong-am-cerave-moisturizing-cream',
    price: 350000,
    currentPrice: 315000,
    image: {
      url: 'https://product.hstatic.net/1000006063/product/1_9b2a8d9c4e8c4e7a9a3e270d8d0c4c0d_1024x1024.jpg',
      alt: 'Kem Dưỡng Ẩm CeraVe'
    },
    brand: {
      name: 'CeraVe',
      slug: 'cerave'
    },
    inStock: true
  },
  {
    _id: '5',
    name: 'Sữa Rửa Mặt Cosrx Low pH Good Morning Gel Cleanser',
    slug: 'sua-rua-mat-cosrx-low-ph-good-morning-gel-cleanser',
    price: 220000,
    currentPrice: 198000,
    image: {
      url: 'https://product.hstatic.net/1000006063/product/1_9b2a8d9c4e8c4e7a9a3e270d8d0c4c0d_1024x1024.jpg',
      alt: 'Sữa Rửa Mặt Cosrx'
    },
    brand: {
      name: 'COSRX',
      slug: 'cosrx'
    },
    inStock: true
  },
  {
    _id: '6',
    name: 'Toner Some By Mi AHA-BHA-PHA 30 Days Miracle',
    slug: 'toner-some-by-mi-aha-bha-pha-30-days-miracle',
    price: 280000,
    currentPrice: 252000,
    image: {
      url: 'https://product.hstatic.net/1000006063/product/1_9b2a8d9c4e8c4e7a9a3e270d8d0c4c0d_1024x1024.jpg',
      alt: 'Toner Some By Mi'
    },
    brand: {
      name: 'Some By Mi',
      slug: 'some-by-mi'
    },
    inStock: true
  },
  {
    _id: '7',
    name: 'Mặt Nạ Ngủ Môi Laneige Lip Sleeping Mask',
    slug: 'mat-na-ngu-moi-laneige-lip-sleeping-mask',
    price: 290000,
    currentPrice: 290000,
    image: {
      url: 'https://product.hstatic.net/1000006063/product/1_9b2a8d9c4e8c4e7a9a3e270d8d0c4c0d_1024x1024.jpg',
      alt: 'Mặt Nạ Ngủ Môi Laneige'
    },
    brand: {
      name: 'Laneige',
      slug: 'laneige'
    },
    inStock: false
  }
];

const CartPage: NextPage = () => {
  const router = useRouter();
  
  // State để lưu trữ danh sách sản phẩm trong giỏ hàng
  const [cartItems, setCartItems] = useState<CartProduct[]>([]);
  const [recommendedProducts, setRecommendedProducts] = useState<RecommendedProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [voucherCode, setVoucherCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [shipping, setShipping] = useState(0);

  // Giả lập việc tải dữ liệu từ API
  useEffect(() => {
    // Trong thực tế, đây sẽ là một API call để lấy giỏ hàng của người dùng
    const fetchCart = async () => {
      try {
        // Giả lập thời gian tải
        await new Promise(resolve => setTimeout(resolve, 800));
        setCartItems(sampleCartData);
        setRecommendedProducts(sampleRecommendedProducts);
        
        // Tính phí vận chuyển (miễn phí nếu tổng giá trị > 500.000đ)
        const subtotal = sampleCartData.reduce((sum, item) => sum + item.price * item.quantity, 0);
        setShipping(subtotal > 500000 ? 0 : 30000);
      } catch (error) {
        console.error('Lỗi khi tải giỏ hàng:', error);
        toast.error('Không thể tải giỏ hàng. Vui lòng thử lại sau.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCart();
  }, []);

  // Xử lý cập nhật số lượng sản phẩm
  const handleUpdateQuantity = (id: string, quantity: number) => {
    setCartItems(prevItems =>
      prevItems.map(item =>
        item._id === id ? { ...item, quantity } : item
      )
    );
    
    // Cập nhật phí vận chuyển
    updateShippingFee();
    
    toast.success('Đã cập nhật số lượng sản phẩm', {
      position: "bottom-right",
      autoClose: 2000,
      theme: "light",
      style: { backgroundColor: '#fdf2f8', color: '#db2777', borderLeft: '4px solid #db2777' }
    });
  };

  // Xử lý xóa sản phẩm khỏi giỏ hàng
  const handleRemoveItem = (id: string) => {
    setCartItems(prevItems => prevItems.filter(item => item._id !== id));
    
    // Cập nhật phí vận chuyển
    updateShippingFee();
    
    toast.info('Đã xóa sản phẩm khỏi giỏ hàng', {
      position: "bottom-right",
      autoClose: 2000,
      theme: "light",
      style: { backgroundColor: '#f3e8ff', color: '#8b5cf6', borderLeft: '4px solid #8b5cf6' }
    });
  };

  // Xử lý áp dụng mã giảm giá
  const handleApplyVoucher = (code: string) => {
    // Trong thực tế, mã này sẽ được gửi đến server để kiểm tra tính hợp lệ
    // Đây chỉ là mã mẫu để demo
    if (code.toUpperCase() === 'YUMIN10') {
      // Giảm 10% cho toàn bộ đơn hàng
      const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      setDiscount(Math.round(subtotal * 0.1));
      setVoucherCode(code);
      
      toast.success('Đã áp dụng mã giảm giá YUMIN10', {
        position: "bottom-right",
        autoClose: 3000,
        theme: "light",
        style: { backgroundColor: '#fdf2f8', color: '#db2777', borderLeft: '4px solid #db2777' }
      });
    } else if (code.toUpperCase() === 'FREESHIP') {
      // Miễn phí vận chuyển
      setShipping(0);
      setVoucherCode(code);
      
      toast.success('Đã áp dụng mã miễn phí vận chuyển', {
        position: "bottom-right",
        autoClose: 3000,
        theme: "light",
        style: { backgroundColor: '#fdf2f8', color: '#db2777', borderLeft: '4px solid #db2777' }
      });
    } else {
      toast.error('Mã giảm giá không hợp lệ hoặc đã hết hạn', {
        position: "bottom-right",
        autoClose: 3000,
        theme: "light",
        style: { backgroundColor: '#f8d7da', color: '#721c24', borderLeft: '4px solid #721c24' }
      });
    }
  };

  // Xử lý thêm vào giỏ hàng từ phần sản phẩm đề xuất
  const handleAddToCart = (product: RecommendedProduct) => {
    // Kiểm tra xem sản phẩm đã có trong giỏ hàng chưa
    const existingItemIndex = cartItems.findIndex(item => item.productId === product._id);
    
    if (existingItemIndex >= 0) {
      // Nếu đã có, tăng số lượng
      const updatedItems = [...cartItems];
      updatedItems[existingItemIndex] = {
        ...updatedItems[existingItemIndex],
        quantity: Math.min(updatedItems[existingItemIndex].quantity + 1, 10) // Giả sử tối đa 10 sản phẩm
      };
      setCartItems(updatedItems);
    } else {
      // Nếu chưa có, thêm mới sản phẩm vào giỏ hàng
      const newItem: CartProduct = {
        _id: `temp_${Date.now()}`, // ID tạm thời, trong thực tế sẽ từ server
        productId: product._id,
        name: product.name,
        slug: product.slug,
        price: product.currentPrice,
        originalPrice: product.price > product.currentPrice ? product.price : undefined,
        quantity: 1,
        image: {
          url: product.image.url,
          alt: product.image.alt
        },
        brand: {
          name: product.brand.name,
          slug: product.brand.slug
        },
        inStock: product.inStock,
        maxQuantity: 10 // Giả định tối đa 10 sản phẩm
      };
      
      setCartItems(prevItems => [...prevItems, newItem]);
    }
    
    // Cập nhật phí vận chuyển
    updateShippingFee();
    
    toast.success('Đã thêm sản phẩm vào giỏ hàng', {
      position: "bottom-right",
      autoClose: 2000,
      theme: "light",
      style: { backgroundColor: '#fdf2f8', color: '#db2777', borderLeft: '4px solid #db2777' }
    });
  };

  // Xử lý thêm vào wishlist
  const handleAddToWishlist = (product: RecommendedProduct) => {
    toast.success('Đã thêm sản phẩm vào danh sách yêu thích', {
      position: "bottom-right",
      autoClose: 2000,
      theme: "light",
      style: { backgroundColor: '#fdf2f8', color: '#db2777', borderLeft: '4px solid #db2777' }
    });
  };

  // Cập nhật phí vận chuyển
  const updateShippingFee = () => {
    const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    setShipping(subtotal > 500000 ? 0 : 30000);
  };

  // Xử lý nút thanh toán
  const handleProceedToCheckout = () => {
    router.push('/payments');
    toast.success('Đang chuyển đến trang thanh toán...', {
      position: "bottom-right",
      autoClose: 2000,
      theme: "light",
      style: { backgroundColor: '#fdf2f8', color: '#db2777', borderLeft: '4px solid #db2777' }
    });
  };

  // Tính toán tổng tiền
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
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

          {isLoading ? (
            // Loading state
            <div className="flex justify-center items-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
            </div>
          ) : cartItems.length === 0 ? (
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
                        {cartItems.length} sản phẩm
                      </span>
                    </div>
                  </div>

                  {/* List of cart items */}
                  <div className="space-y-1">
                    {cartItems.map(item => (
                      <CartItem
                        key={item._id}
                        {...item}
                        onUpdateQuantity={handleUpdateQuantity}
                        onRemove={handleRemoveItem}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Cart Summary Section */}
              <div className="lg:col-span-1">
                <CartSummary
                  subtotal={subtotal}
                  discount={discount}
                  shipping={shipping}
                  total={total}
                  itemCount={cartItems.length}
                  voucherCode={voucherCode}
                  onApplyVoucher={handleApplyVoucher}
                  onProceedToCheckout={handleProceedToCheckout}
                />
              </div>
            </div>
          )}

          {/* Recommended Products Section */}
          {!isLoading && (
            <div className="mt-16">
              <RecommendedProducts
                products={recommendedProducts as any[]}
                onAddToWishlist={handleAddToWishlist}
              />
            </div>
          )}
        </div>
      </div>
    </DefaultLayout>
  );
};

export default CartPage; 