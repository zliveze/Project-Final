import React, { useState, useEffect } from 'react';
import DefaultLayout from '../../layout/DefaultLayout';
import ProductCardShop from '../../components/common/ProductCardShop';
import ShopFilters from '../../components/shop/ShopFilters';
import ShopBanner from '../../components/shop/ShopBanner';
import ShopPagination from '../../components/shop/ShopPagination';
import { BreadcrumItem } from '@/components/common/Breadcrum';
import { useProduct } from '../../contexts';

interface Product {
  _id: string;
  name: string;
  slug: string;
  price: number;
  currentPrice: number;
  brandId?: string;
  images?: {
    url: string;
    alt?: string;
    isPrimary?: boolean;
  }[];
  reviews?: {
    averageRating: number;
    reviewCount: number;
  };
  flags?: {
    isBestSeller?: boolean;
    isNew?: boolean;
    isOnSale?: boolean;
    hasGifts?: boolean;
  };
  imageUrl?: string;
}

interface Filters {
  categories: string[];
  brands: string[];
  priceRange: number[];
  skinType: string[];
  concerns: string[];
  sortBy: string;
  rating: number;
  hasPromotion: boolean;
  hasFreeShipping: boolean;
  hasGifts: boolean;
  colors: string[];
  volume: string[];
}

export default function Shop() {
  const productContext = useProduct();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [filters, setFilters] = useState<Filters>({
    categories: [],
    brands: [],
    priceRange: [0, 5000000],
    skinType: [],
    concerns: [],
    sortBy: 'popularity',
    rating: 0,
    hasPromotion: false,
    hasFreeShipping: false,
    hasGifts: false,
    colors: [],
    volume: []
  });

  // Fetch products using API
  useEffect(() => {
    // Fetch products from API
    const fetchProducts = async () => {
      try {
        setLoading(true);
        
        // Use the efficient API endpoint
        await productContext.fetchLightProducts(
          currentPage,
          12, // Increased limit for better display
          searchTerm,
          filters.brands.length > 0 ? filters.brands[0] : '',
          filters.categories.length > 0 ? filters.categories[0] : '',
          undefined,
          filters.priceRange[0],
          filters.priceRange[1],
          undefined,
          filters.skinType.join(','),
          filters.concerns.join(','),
          filters.sortBy === 'best_seller' ? true : undefined,
          filters.sortBy === 'new_arrivals' ? true : undefined,
          filters.hasPromotion ? true : undefined,
          filters.hasGifts ? true : undefined,
          filters.sortBy === 'price_asc' ? 'price' : 
          filters.sortBy === 'price_desc' ? 'price' : 
          filters.sortBy === 'newest' ? 'createdAt' : 
          filters.sortBy === 'popularity' ? 'reviews.reviewCount' : 'createdAt',
          
          filters.sortBy === 'price_asc' ? 'asc' : 'desc'
        );

        // Dữ liệu sản phẩm đã được cập nhật bởi context
        setProducts(productContext.products);
        setTotalPages(productContext.totalPages);

      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [currentPage, searchTerm, filters, productContext]);

  // Effect để đếm số bộ lọc đang active
  useEffect(() => {
    let count = 0;
    if (filters.categories.length > 0) count++;
    if (filters.brands.length > 0) count++;
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 5000000) count++;
    if (filters.skinType.length > 0) count++;
    if (filters.concerns.length > 0) count++;
    if (filters.rating > 0) count++;
    if (filters.hasPromotion) count++;
    if (filters.hasFreeShipping) count++;
    if (filters.hasGifts) count++;
    if (filters.colors.length > 0) count++;
    if (filters.volume.length > 0) count++;
    
    setActiveFiltersCount(count);
  }, [filters]);

  const handleFilterChange = (newFilters: Partial<Filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1); // Reset về trang 1 khi thay đổi filter
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  // Breadcrumb cho trang
  const breadcrumbs: BreadcrumItem[] = [
    { label: 'Trang chủ', href: '/' },
    { label: 'Cửa hàng', href: '/shop', active: true }
  ];

  return (
    <DefaultLayout breadcrumItems={breadcrumbs}>
      <ShopBanner />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar filters */}
          <div className="md:w-64 shrink-0">
            <ShopFilters 
              filters={filters} 
              onFilterChange={handleFilterChange}
              onSearch={handleSearch}
            />
          </div>
          
          {/* Main content */}
          <div className="flex-grow">
            {/* Bộ lọc đang active */}
            {activeFiltersCount > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-4 p-3 bg-white rounded-lg shadow-sm">
                <span className="text-sm font-medium text-gray-700 mr-2">
                  Bộ lọc ({activeFiltersCount}):
                </span>
                
                {filters.categories.length > 0 && (
                  <div className="bg-[#fdf2f8] rounded-full px-3 py-1 text-sm flex items-center">
                    Danh mục ({filters.categories.length})
                    <button 
                      className="ml-2 text-gray-500 hover:text-gray-700"
                      onClick={() => handleFilterChange({ categories: [] })}
                    >
                      ×
                    </button>
                  </div>
                )}
                
                {filters.brands.length > 0 && (
                  <div className="bg-[#fdf2f8] rounded-full px-3 py-1 text-sm flex items-center">
                    Thương hiệu ({filters.brands.length})
                    <button 
                      className="ml-2 text-gray-500 hover:text-gray-700"
                      onClick={() => handleFilterChange({ brands: [] })}
                    >
                      ×
                    </button>
                  </div>
                )}
                
                {filters.skinType.length > 0 && (
                  <div className="bg-[#fdf2f8] rounded-full px-3 py-1 text-sm flex items-center">
                    Loại da ({filters.skinType.length})
                    <button 
                      className="ml-2 text-gray-500 hover:text-gray-700"
                      onClick={() => handleFilterChange({ skinType: [] })}
                    >
                      ×
                    </button>
                  </div>
                )}
                
                {filters.concerns.length > 0 && (
                  <div className="bg-[#fdf2f8] rounded-full px-3 py-1 text-sm flex items-center">
                    Vấn đề ({filters.concerns.length})
                    <button 
                      className="ml-2 text-gray-500 hover:text-gray-700"
                      onClick={() => handleFilterChange({ concerns: [] })}
                    >
                      ×
                    </button>
                  </div>
                )}
                
                {(filters.priceRange[0] > 0 || filters.priceRange[1] < 5000000) && (
                  <div className="bg-[#fdf2f8] rounded-full px-3 py-1 text-sm flex items-center">
                    {filters.priceRange[0].toLocaleString()}đ - {filters.priceRange[1].toLocaleString()}đ
                    <button 
                      className="ml-2 text-gray-500 hover:text-gray-700"
                      onClick={() => handleFilterChange({ priceRange: [0, 5000000] })}
                    >
                      ×
                    </button>
                  </div>
                )}
                
                {filters.rating > 0 && (
                  <div className="bg-[#fdf2f8] rounded-full px-3 py-1 text-sm flex items-center">
                    {filters.rating}+ sao
                    <button 
                      className="ml-2 text-gray-500 hover:text-gray-700"
                      onClick={() => handleFilterChange({ rating: 0 })}
                    >
                      ×
                    </button>
                  </div>
                )}
                
                {filters.hasPromotion && (
                  <div className="bg-[#fdf2f8] rounded-full px-3 py-1 text-sm flex items-center">
                    Đang giảm giá
                    <button 
                      className="ml-2 text-gray-500 hover:text-gray-700"
                      onClick={() => handleFilterChange({ hasPromotion: false })}
                    >
                      ×
                    </button>
                  </div>
                )}
                
                {filters.hasGifts && (
                  <div className="bg-[#fdf2f8] rounded-full px-3 py-1 text-sm flex items-center">
                    Có quà tặng
                    <button 
                      className="ml-2 text-gray-500 hover:text-gray-700"
                      onClick={() => handleFilterChange({ hasGifts: false })}
                    >
                      ×
                    </button>
                  </div>
                )}
                
                <button 
                  className="text-[#d53f8c] hover:underline text-sm"
                  onClick={() => handleFilterChange({
                    categories: [],
                    brands: [],
                    priceRange: [0, 5000000],
                    skinType: [],
                    concerns: [],
                    sortBy: 'popularity',
                    rating: 0,
                    hasPromotion: false,
                    hasFreeShipping: false,
                    hasGifts: false,
                    colors: [],
                    volume: []
                  })}
                >
                  Xóa tất cả bộ lọc
                </button>
              </div>
            )}
            
            {/* Danh sách sản phẩm */}
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-fr">
                {Array(24).fill(null).map((_, index) => (
                  <div key={index} className="h-full">
                    <div className="bg-white rounded-sm shadow-sm animate-pulse h-full flex flex-col">
                      <div className="relative pt-[100%] bg-gray-300"></div>
                      <div className="p-3 flex-grow flex flex-col">
                        <div className="h-[40px] bg-gray-300 rounded w-3/4 mb-2"></div>
                        <div className="h-6 bg-gray-300 rounded w-1/2 mb-2"></div>
                        <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                        <div className="mt-auto">
                          <div className="h-3 bg-gray-300 rounded w-full mt-2"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12 bg-[#fdf2f8] rounded-lg">
                <div className="text-5xl mb-4">😕</div>
                <p className="text-lg text-gray-600 font-medium">Không tìm thấy sản phẩm nào phù hợp với bộ lọc của bạn.</p>
                <p className="mt-2 text-gray-500 mb-4">Vui lòng thử lại với các bộ lọc khác hoặc xóa một số bộ lọc.</p>
                <button 
                  className="bg-gradient-to-r from-[#d53f8c] to-[#805ad5] hover:from-[#b83280] hover:to-[#6b46c1] text-white px-4 py-2 rounded-md transition-colors"
                  onClick={() => handleFilterChange({
                    categories: [],
                    brands: [],
                    priceRange: [0, 5000000],
                    skinType: [],
                    concerns: [],
                    sortBy: 'popularity',
                    rating: 0,
                    hasPromotion: false,
                    hasFreeShipping: false,
                    hasGifts: false,
                    colors: [],
                    volume: []
                  })}
                >
                  Xóa tất cả bộ lọc
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-fr">
                {products.map((product) => (
                  <div key={product._id} className="h-full">
                    <ProductCardShop
                      id={product._id}
                      name={product.name}
                      image={product.images && product.images[0]?.url || '/images/product-placeholder.jpg'}
                      price={product.currentPrice}
                      originalPrice={product.price}
                      rating={product.reviews?.averageRating || 0}
                      ratingCount={product.reviews?.reviewCount || 0}
                      soldCount={Math.floor(Math.random() * 100) + 10}
                      discount={product.currentPrice < product.price ? Math.round(((product.price - product.currentPrice) / product.price) * 100) : undefined}
                      slug={product.slug}
                      flashSale={product.flags?.isOnSale ? {
                        isActive: true,
                        endTime: new Date(Date.now() + 86400000).toISOString(),
                        soldPercent: Math.floor(Math.random() * 80) + 20
                      } : undefined}
                    />
                  </div>
                ))}
              </div>
            )}
            
            {!loading && products.length > 0 && (
              <ShopPagination 
                currentPage={currentPage} 
                totalPages={totalPages} 
                onPageChange={handlePageChange} 
              />
            )}
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
} 