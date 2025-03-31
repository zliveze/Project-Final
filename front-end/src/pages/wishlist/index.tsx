import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Components
import WishlistItem from '@/components/wishlist/WishlistItem';
import EmptyWishlist from '@/components/wishlist/EmptyWishlist';
import WishlistSummary from '@/components/wishlist/WishlistSummary';
import WishlistStats from '@/components/wishlist/WishlistStats';
import WishlistCategories from '@/components/wishlist/WishlistCategories';
import RecommendedProducts from '@/components/common/RecommendedProducts';
import DefaultLayout from '@/layout/DefaultLayout';

// Định nghĩa kiểu dữ liệu cho sản phẩm trong wishlist
interface WishlistProduct {
  _id: string;
  variantId?: string;
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
  categoryIds?: string[];
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
  isNew?: boolean;
  rating?: number;
  reviewCount?: number;
}

// Định nghĩa kiểu dữ liệu cho danh mục
interface Category {
  id: string;
  name: string;
  slug: string;
  image: string;
  productCount: number;
}

// Dữ liệu mẫu cho wishlist
const sampleWishlistData: WishlistProduct[] = [
  {
    _id: '1',
    name: 'Kem Chống Nắng La Roche-Posay Anthelios UVMune 400',
    slug: 'kem-chong-nang-la-roche-posay-anthelios-uvmune-400',
    price: 450000,
    currentPrice: 405000,
    image: {
      url: 'https://product.hstatic.net/1000006063/product/1_9b2a8d9c4e8c4e7a9a3e270d8d0c4c0d_1024x1024.jpg',
      alt: 'Kem Chống Nắng La Roche-Posay'
    },
    brand: {
      name: 'La Roche-Posay',
      slug: 'la-roche-posay'
    },
    inStock: true,
    categoryIds: ['suncare', 'skincare']
  },
  {
    _id: '2',
    name: 'Serum Vitamin C Klairs Freshly Juiced Vitamin Drop',
    slug: 'serum-vitamin-c-klairs-freshly-juiced-vitamin-drop',
    price: 320000,
    currentPrice: 320000,
    image: {
      url: 'https://product.hstatic.net/1000006063/product/1_9b2a8d9c4e8c4e7a9a3e270d8d0c4c0d_1024x1024.jpg',
      alt: 'Serum Vitamin C Klairs'
    },
    brand: {
      name: 'Klairs',
      slug: 'klairs'
    },
    inStock: true,
    categoryIds: ['serum', 'skincare']
  },
  {
    _id: '3',
    name: 'Nước Tẩy Trang Bioderma Sensibio H2O',
    slug: 'nuoc-tay-trang-bioderma-sensibio-h2o',
    price: 390000,
    currentPrice: 350000,
    image: {
      url: 'https://product.hstatic.net/1000006063/product/1_9b2a8d9c4e8c4e7a9a3e270d8d0c4c0d_1024x1024.jpg',
      alt: 'Nước Tẩy Trang Bioderma'
    },
    brand: {
      name: 'Bioderma',
      slug: 'bioderma'
    },
    inStock: false,
    categoryIds: ['cleanser', 'skincare']
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
    inStock: true,
    isNew: true,
    rating: 4.8,
    reviewCount: 124
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
    inStock: true,
    rating: 4.6,
    reviewCount: 98
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
    inStock: true,
    isNew: true,
    rating: 4.5,
    reviewCount: 87
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
    inStock: false,
    rating: 4.9,
    reviewCount: 156
  }
];

// Dữ liệu mẫu cho danh mục
const sampleCategories: Category[] = [
  {
    id: '1',
    name: 'Chăm sóc da',
    slug: 'skincare',
    image: 'https://images.unsplash.com/photo-1612817288484-6f916006741a',
    productCount: 120
  },
  {
    id: '2',
    name: 'Chống nắng',
    slug: 'suncare',
    image: 'https://images.unsplash.com/photo-1612817288484-6f916006741a',
    productCount: 45
  },
  {
    id: '3',
    name: 'Trang điểm',
    slug: 'makeup',
    image: 'https://images.unsplash.com/photo-1612817288484-6f916006741a',
    productCount: 78
  },
  {
    id: '4',
    name: 'Chăm sóc tóc',
    slug: 'haircare',
    image: 'https://images.unsplash.com/photo-1612817288484-6f916006741a',
    productCount: 36
  }
];

const WishlistPage: NextPage = () => {
  // State để lưu trữ danh sách sản phẩm yêu thích
  const [wishlistItems, setWishlistItems] = useState<WishlistProduct[]>([]);
  const [recommendedProducts, setRecommendedProducts] = useState<RecommendedProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Giả lập việc tải dữ liệu từ API
  useEffect(() => {
    // Trong thực tế, đây sẽ là một API call để lấy danh sách yêu thích của người dùng
    const fetchWishlist = async () => {
      try {
        // Giả lập thời gian tải
        await new Promise(resolve => setTimeout(resolve, 800));
        setWishlistItems(sampleWishlistData);
        setRecommendedProducts(sampleRecommendedProducts);
        setCategories(sampleCategories);
      } catch (error) {
        console.error('Lỗi khi tải danh sách yêu thích:', error);
        toast.error('Không thể tải danh sách yêu thích. Vui lòng thử lại sau.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchWishlist();
  }, []);

  // Xử lý xóa một sản phẩm khỏi wishlist
  const handleRemoveItem = (id: string) => {
    setWishlistItems(prevItems => prevItems.filter(item => item._id !== id));
    toast.success('Đã xóa sản phẩm khỏi danh sách yêu thích', {
      position: "bottom-right",
      autoClose: 3000,
      theme: "light",
      style: { backgroundColor: '#fdf2f8', color: '#db2777', borderLeft: '4px solid #db2777' }
    });
  };

  // Xử lý xóa tất cả sản phẩm khỏi wishlist
  const handleClearAll = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa tất cả sản phẩm khỏi danh sách yêu thích?')) {
      setWishlistItems([]);
      toast.success('Đã xóa tất cả sản phẩm khỏi danh sách yêu thích', {
        position: "bottom-right",
        autoClose: 3000,
        theme: "light",
        style: { backgroundColor: '#fdf2f8', color: '#db2777', borderLeft: '4px solid #db2777' }
      });
    }
  };

  // Xử lý thêm tất cả sản phẩm vào giỏ hàng
  const handleAddAllToCart = () => {
    // Lọc ra các sản phẩm còn hàng
    const inStockItems = wishlistItems.filter(item => item.inStock);
    
    if (inStockItems.length === 0) {
      toast.error('Không có sản phẩm nào còn hàng để thêm vào giỏ', {
        position: "bottom-right",
        autoClose: 3000,
        theme: "light"
      });
      return;
    }
    
    // Trong thực tế, đây sẽ là một API call để thêm sản phẩm vào giỏ hàng
    toast.success(`Đã thêm ${inStockItems.length} sản phẩm vào giỏ hàng`, {
      position: "bottom-right",
      autoClose: 3000,
      theme: "light",
      style: { backgroundColor: '#fdf2f8', color: '#db2777', borderLeft: '4px solid #db2777' }
    });
  };

  // Xử lý thêm sản phẩm gợi ý vào wishlist
  const handleAddToWishlist = (product: RecommendedProduct) => {
    // Kiểm tra xem sản phẩm đã có trong wishlist chưa
    const isExist = wishlistItems.some(item => item._id === product._id);
    
    if (isExist) {
      toast.info('Sản phẩm đã có trong danh sách yêu thích', {
        position: "bottom-right",
        autoClose: 3000,
        theme: "light"
      });
      return;
    }
    
    // Thêm sản phẩm vào wishlist
    const newWishlistItem: WishlistProduct = {
      _id: product._id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      currentPrice: product.currentPrice,
      image: product.image,
      brand: product.brand,
      inStock: product.inStock
    };
    
    setWishlistItems(prevItems => [...prevItems, newWishlistItem]);
    
    toast.success('Đã thêm sản phẩm vào danh sách yêu thích', {
      position: "bottom-right",
      autoClose: 3000,
      theme: "light",
      style: { backgroundColor: '#fdf2f8', color: '#db2777', borderLeft: '4px solid #db2777' }
    });
  };

  // Tính toán thống kê
  const calculateStats = () => {
    // Tổng giá trị
    const totalValue = wishlistItems.reduce((sum, item) => sum + item.price, 0);
    
    // Số tiền tiết kiệm
    const savedAmount = wishlistItems.reduce((sum, item) => sum + (item.price - item.currentPrice), 0);
    
    // Đếm số lượng danh mục và thương hiệu
    const uniqueCategories = new Set();
    const uniqueBrands = new Set();
    
    wishlistItems.forEach(item => {
      // Thêm danh mục
      if (item.categoryIds) {
        item.categoryIds.forEach(catId => uniqueCategories.add(catId));
      }
      
      // Thêm thương hiệu
      uniqueBrands.add(item.brand.slug);
    });
    
    return {
      totalValue,
      savedAmount,
      itemCount: wishlistItems.length,
      categoryCount: uniqueCategories.size,
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

  return (
    <DefaultLayout>
      <Head>
        <title>Danh sách yêu thích | YUMIN</title>
        <meta name="description" content="Danh sách sản phẩm yêu thích của bạn tại YUMIN" />
      </Head>

      <main className="min-h-screen bg-gray-50 pb-12">        
        <div className="container mx-auto px-4 py-6">
          {isLoading ? (
            // Hiển thị skeleton loading
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-lg shadow-sm p-4 mb-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
              
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center p-4 border-b border-gray-200 gap-4 bg-white animate-pulse">
                  <div className="w-24 h-24 bg-gray-200 rounded-md"></div>
                  <div className="flex-1">
                    <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/5 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                    <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                    <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
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
                    {wishlistItems.map(item => (
                      <WishlistItem 
                        key={item._id}
                        {...item}
                        onRemove={handleRemoveItem}
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
                onAddToWishlist={handleAddToWishlist}
              />
            </div>
          ) : (
            <>
              <EmptyWishlist />
              
              {/* Hiển thị sản phẩm gợi ý ngay cả khi wishlist trống */}
              <div className="max-w-6xl mx-auto">
                <RecommendedProducts 
                  products={recommendedProducts}
                  onAddToWishlist={handleAddToWishlist}
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