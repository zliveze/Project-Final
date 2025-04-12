import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useRouter } from 'next/router'; // Import useRouter for redirection

// Components
import WishlistItem from '@/components/wishlist/WishlistItem';
import EmptyWishlist from '@/components/wishlist/EmptyWishlist';
import WishlistSummary from '@/components/wishlist/WishlistSummary';
import WishlistStats from '@/components/wishlist/WishlistStats';
import WishlistCategories from '@/components/wishlist/WishlistCategories';
import RecommendedProducts from '@/components/common/RecommendedProducts';
import DefaultLayout from '@/layout/DefaultLayout';
import { useWishlist, WishlistItem as ContextWishlistItem } from '@/contexts/user/wishlist/WishlistContext'; // Import context hook and type
import { useAuth } from '@/contexts/AuthContext'; // Import useAuth to check authentication

// Định nghĩa kiểu dữ liệu cho sản phẩm gợi ý (Keep this if needed for recommended products)
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
  isNew?: boolean;
  rating?: number;
  reviewCount?: number;
}

// Định nghĩa kiểu dữ liệu cho danh mục (Keep this if needed for categories section)
interface Category {
  id: string;
  name: string;
  slug: string;
  image: string;
  productCount: number;
}


// Dữ liệu mẫu cho sản phẩm gợi ý (Keep for now, replace with API call later if needed)
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
    inStock: true,
    isNew: true,
    rating: 4.8,
    reviewCount: 124
  },
  // ... (other sample recommended products)
];

// Dữ liệu mẫu cho danh mục (Keep for now, replace with API call later if needed)
const sampleCategories: Category[] = [
  {
    id: '1', // Use string IDs if they come from backend as strings
    name: 'Chăm sóc da',
    slug: 'skincare',
    image: 'https://images.unsplash.com/photo-1612817288484-6f916006741a',
    productCount: 120
  },
   // ... (other sample categories)
];

const WishlistPage: NextPage = () => {
  const {
    wishlistItems,
    isLoading: isWishlistLoading, // Use loading state from context
    error: wishlistError,
    removeFromWishlist, // Use remove function from context
    // fetchWishlist, // fetchWishlist is called inside the provider
  } = useWishlist();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();

  // State for recommended products and categories (keep using sample data for now)
  const [recommendedProducts, setRecommendedProducts] = useState<RecommendedProduct[]>(sampleRecommendedProducts);
  const [categories, setCategories] = useState<Category[]>(sampleCategories);

  // Redirect if not authenticated after loading
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      toast.info('Vui lòng đăng nhập để xem danh sách yêu thích.');
      router.push('/auth/login');
    }
  }, [isAuthenticated, isAuthLoading, router]);

  // Xử lý xóa một sản phẩm khỏi wishlist using context function
  const handleRemoveItem = (productId: string, variantId: string) => {
    removeFromWishlist(productId, variantId);
    // Toast messages are handled by the context
  };

  // Xử lý xóa tất cả sản phẩm khỏi wishlist (Needs backend implementation and context update)
  const handleClearAll = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa tất cả sản phẩm khỏi danh sách yêu thích?')) {
      // TODO: Implement backend endpoint and context function for clearing all
      // For now, just remove one by one locally and show toast
      if (wishlistItems.length > 0) {
        wishlistItems.forEach(item => removeFromWishlist(item.productId, item.variantId)); // Remove one by one for now
        toast.success('Đã xóa tất cả sản phẩm khỏi danh sách yêu thích (tạm thời)', {
            position: "bottom-right",
            autoClose: 3000,
            theme: "light",
            style: { backgroundColor: '#fdf2f8', color: '#db2777', borderLeft: '4px solid #db2777' }
        });
      } else {
         toast.info('Danh sách yêu thích của bạn hiện đang trống.');
      }
    }
  };

  // Xử lý thêm tất cả sản phẩm vào giỏ hàng (Needs CartContext integration)
  const handleAddAllToCart = () => {
    // TODO: Integrate with CartContext to add multiple items
    const inStockItems = wishlistItems.filter(item => item.inStock);

    if (inStockItems.length === 0) {
      toast.warn('Không có sản phẩm nào còn hàng trong danh sách yêu thích.', {
        position: "bottom-right",
        autoClose: 3000,
        theme: "light",
      });
      return;
    }

    // Placeholder logic - replace with actual CartContext call
    console.log("Adding items to cart:", inStockItems);
    toast.info(`Đang thêm ${inStockItems.length} sản phẩm vào giỏ... (chưa hoạt động)`, {
      position: "bottom-right",
      autoClose: 2000,
      theme: "light",
    });
    // Example: await addMultipleItemsToCart(inStockItems.map(item => ({ productId: item.productId, variantId: item.variantId, quantity: 1 })));
  };

  // Xử lý thêm sản phẩm gợi ý vào wishlist (Use context function)
  const handleAddToWishlist = (product: RecommendedProduct) => {
    // Assuming recommended products don't have variants for simplicity,
    // or we need a way to select a variant first.
    // For now, let's assume we add the base product or a default variant.
    // We need the variantId for the backend. This needs clarification.
    // **Temporary:** Show a warning that this feature needs variant selection.
    toast.warn('Tính năng thêm từ gợi ý cần chọn biến thể (chưa hoàn thiện).');
    // If a default variant logic exists or no variants:
    // const defaultVariantId = 'some-default-id'; // Or determine based on product
    // addToWishlist(product._id, defaultVariantId);
  };

  // Tính toán thống kê
  const calculateStats = () => {
    // Tổng giá trị (using currentPrice)
    const totalValue = wishlistItems.reduce((sum, item) => sum + item.currentPrice, 0);

    // Số tiền tiết kiệm (difference between original price and current price)
    const savedAmount = wishlistItems.reduce((sum, item) => {
        const originalPrice = item.price; // Assuming item.price is the original price
        const currentPrice = item.currentPrice;
        return sum + (originalPrice > currentPrice ? originalPrice - currentPrice : 0);
    }, 0);

    // Đếm số lượng danh mục và thương hiệu độc nhất
    const uniqueCategories = new Set<string>(); // Use Set<string> for type safety
    const uniqueBrands = new Set<string>();

    wishlistItems.forEach(item => {
      // Thêm danh mục (Assuming backend provides category info or IDs)
      // This part needs adjustment based on actual data structure from getWishlist
      // if (item.categoryIds) {
      //   item.categoryIds.forEach(catId => uniqueCategories.add(catId));
      // }

      // Thêm thương hiệu
      if (item.brand?.slug) {
          uniqueBrands.add(item.brand.slug);
      }
    });

    return {
      totalValue,
      savedAmount,
      itemCount: wishlistItems.length,
      categoryCount: uniqueCategories.size, // Will be 0 until category data is handled
      brandCount: uniqueBrands.size
    };
  };

  // Breadcrumb items
  const breadcrumbItems = [
    { label: 'Trang chủ', href: '/' },
    { label: 'Danh sách yêu thích', href: '/wishlist' }
  ];

  // Lấy thống kê
  const stats = calculateStats();

  // Handle potential errors from context
  useEffect(() => {
      if (wishlistError) {
          toast.error(`Lỗi tải wishlist: ${wishlistError}`);
      }
  }, [wishlistError]);

  // Show loading indicator if either auth or wishlist is loading
  const isLoading = isAuthLoading || isWishlistLoading;

  return (
    <DefaultLayout>
      <Head>
        <title>Danh sách yêu thích | YUMIN</title>
        <meta name="description" content="Danh sách sản phẩm yêu thích của bạn tại YUMIN" />
      </Head>

      <main className="min-h-screen bg-gray-50 pb-12">
        <div className="container mx-auto px-4 py-6">
          {isLoading ? ( // Check combined loading state
            // Hiển thị skeleton loading
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-lg shadow-sm p-4 mb-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>

              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center p-4 border-b border-gray-100 gap-4 bg-white animate-pulse">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-200 rounded-md flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/5 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 rounded-full"></div>
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 rounded-full"></div>
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 rounded-full"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : wishlistItems.length > 0 ? (
            <div className="max-w-6xl mx-auto">
              {/* Tóm tắt wishlist */}
              <WishlistSummary
                itemCount={wishlistItems.length}
                onClearAll={handleClearAll}
                onAddAllToCart={handleAddAllToCart}
              />

              {/* Thống kê wishlist */}
              <WishlistStats
                totalValue={stats.totalValue}
                savedAmount={stats.savedAmount}
                itemCount={stats.itemCount}
                categoryCount={stats.categoryCount}
                brandCount={stats.brandCount}
              />

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8">
                  {/* Danh sách sản phẩm */}
                  <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
                    <h2 className="text-lg font-semibold text-gray-800 p-4 border-b border-gray-100">
                      Sản phẩm yêu thích ({wishlistItems.length})
                    </h2>
                    {wishlistItems.map((item: ContextWishlistItem) => ( // Use imported type
                      <WishlistItem
                        key={`${item.productId}-${item.variantId}`} // Use combined key
                        _id={item.productId} // Pass productId as _id (assuming WishlistItem expects _id)
                        variantId={item.variantId} // Pass variantId
                        name={item.name}
                        slug={item.slug}
                        price={item.price}
                        currentPrice={item.currentPrice}
                        image={{ url: item.image, alt: item.name }} // Adapt image prop
                        brand={item.brand || { name: 'N/A', slug: '#' }} // Handle null brand
                        inStock={item.inStock}
                        onRemove={() => handleRemoveItem(item.productId, item.variantId)} // Pass both IDs
                      />
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-4">
                  {/* Danh mục phổ biến */}
                  <WishlistCategories categories={categories} />
                </div>
              </div>

              {/* Sản phẩm gợi ý */}
              <RecommendedProducts
                products={recommendedProducts}
                // onAddToWishlist prop removed as it doesn't exist on the component
              />
            </div>
          ) : (
            <>
              <EmptyWishlist />

              {/* Hiển thị sản phẩm gợi ý ngay cả khi wishlist trống */}
              <div className="max-w-6xl mx-auto">
                <RecommendedProducts
                  products={recommendedProducts}
                 // onAddToWishlist prop removed as it doesn't exist on the component
                />
              </div>
            </>
          )}
        </div>
      </main>

      {/* Toast Container */}
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </DefaultLayout>
  );
};

export default WishlistPage;
