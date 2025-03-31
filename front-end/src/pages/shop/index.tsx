import React, { useState, useEffect } from 'react';
import DefaultLayout from '../../layout/DefaultLayout';
import ShopBanner from '../../components/shop/ShopBanner';
import ShopFilters from '../../components/shop/ShopFilters';
import ProductCardShop from '../../components/common/ProductCardShop';
import ShopPagination from '../../components/shop/ShopPagination';
import { BreadcrumItem } from '@/components/common/Breadcrum';

interface Product {
  _id: string;
  name: string;
  slug: string;
  price: number;
  currentPrice: number;
  brandId: string;
  images: {
    url: string;
    alt: string;
    isPrimary: boolean;
  }[];
  reviews: {
    averageRating: number;
    reviewCount: number;
  };
  flags: {
    isBestSeller: boolean;
    isNew: boolean;
    isOnSale: boolean;
    hasGifts: boolean;
  };
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

// Định nghĩa breadcrumb items cho trang Shop
const shopBreadcrumItems: BreadcrumItem[] = [
  { label: 'Cửa hàng' }
];

export default function Shop() {
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

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  // Giả lập fetch dữ liệu sản phẩm
  useEffect(() => {
    // Trong thực tế, đây sẽ là API call
    setLoading(true);
    setTimeout(() => {
      // Dữ liệu mẫu
      const mockProducts: Product[] = Array(24).fill(null).map((_, index) => ({
        _id: `product-${index}`,
        name: `Sản phẩm mỹ phẩm ${index + 1}`,
        slug: `san-pham-my-pham-${index + 1}`,
        price: 350000 + (index * 50000),
        currentPrice: 350000 + (index * 50000) - (index % 3 === 0 ? 50000 : 0),
        brandId: `brand${(index % 7) + 1}`,
        images: [{
          url: `/images/product-${(index % 5) + 1}.jpg`,
          alt: `Sản phẩm mỹ phẩm ${index + 1}`,
          isPrimary: true
        }],
        reviews: {
          averageRating: 3 + (index % 3),
          reviewCount: 10 + index * 5
        },
        flags: {
          isBestSeller: index % 5 === 0,
          isNew: index % 7 === 0,
          isOnSale: index % 3 === 0,
          hasGifts: index % 4 === 0
        }
      }));
      
      // Lọc sản phẩm dựa trên bộ lọc
      const filteredProducts = filterProducts(mockProducts);
      
      // Sắp xếp sản phẩm
      const sortedProducts = sortProducts(filteredProducts);
      
      // Phân trang
      const itemsPerPage = 24;
      const startIndex = (currentPage - 1) * itemsPerPage;
      const paginatedProducts = sortedProducts.slice(startIndex, startIndex + itemsPerPage);
      
      setProducts(paginatedProducts);
      setTotalPages(Math.ceil(filteredProducts.length / itemsPerPage) || 1);
      setLoading(false);
    }, 800);
  }, [filters, currentPage]);

  // Đếm số bộ lọc đang được áp dụng
  useEffect(() => {
    let count = 0;
    if (filters.categories.length > 0) count++;
    if (filters.brands.length > 0) count++;
    if (filters.skinType.length > 0) count++;
    if (filters.concerns.length > 0) count++;
    if (filters.colors && filters.colors.length > 0) count++;
    if (filters.volume && filters.volume.length > 0) count++;
    if (filters.rating > 0) count++;
    if (filters.hasPromotion) count++;
    if (filters.hasFreeShipping) count++;
    if (filters.hasGifts) count++;
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 5000000) count++;
    
    setActiveFiltersCount(count);
  }, [filters]);

  const handleFilterChange = (newFilters: Partial<Filters>) => {
    setFilters({ ...filters, ...newFilters });
    setCurrentPage(1); // Reset về trang 1 khi thay đổi bộ lọc
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Hàm lọc sản phẩm dựa trên bộ lọc
  const filterProducts = (products: Product[]): Product[] => {
    return products.filter(product => {
      // Lọc theo khoảng giá
      if (product.currentPrice < filters.priceRange[0] || product.currentPrice > filters.priceRange[1]) {
        return false;
      }
      
      // Lọc theo thương hiệu
      if (filters.brands.length > 0 && !filters.brands.includes(product.brandId)) {
        return false;
      }
      
      // Lọc theo đánh giá
      if (filters.rating > 0 && product.reviews.averageRating < filters.rating) {
        return false;
      }
      
      // Lọc theo khuyến mãi
      if (filters.hasPromotion && !product.flags.isOnSale) {
        return false;
      }
      
      // Lọc theo quà tặng
      if (filters.hasGifts && !product.flags.hasGifts) {
        return false;
      }
      
      // Lọc theo miễn phí vận chuyển (giả định sản phẩm trên 500k được miễn phí vận chuyển)
      if (filters.hasFreeShipping && product.currentPrice < 500000) {
        return false;
      }
      
      // Các bộ lọc khác có thể thêm vào đây
      
      return true;
    });
  };

  // Sắp xếp sản phẩm
  const sortProducts = (products: Product[]): Product[] => {
    const sortedProducts = [...products];
    
    switch (filters.sortBy) {
      case 'priceAsc':
        return sortedProducts.sort((a, b) => a.currentPrice - b.currentPrice);
      case 'priceDesc':
        return sortedProducts.sort((a, b) => b.currentPrice - a.currentPrice);
      case 'newest':
        return sortedProducts.sort((a, b) => a._id.localeCompare(b._id));
      case 'rating':
        return sortedProducts.sort((a, b) => b.reviews.averageRating - a.reviews.averageRating);
      case 'popularity':
      default:
        return sortedProducts.sort((a, b) => (b.flags.isBestSeller ? 1 : 0) - (a.flags.isBestSeller ? 1 : 0));
    }
  };

  return (
    <DefaultLayout breadcrumItems={shopBreadcrumItems}>
      <ShopBanner />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar với bộ lọc */}
          <div className="w-full md:w-1/4">
            <ShopFilters 
              filters={filters} 
              onFilterChange={handleFilterChange} 
            />
          </div>
          
          {/* Danh sách sản phẩm */}
          <div className="w-full md:w-3/4">
            <div className="flex flex-wrap justify-between items-center mb-6">
              <h1 className="text-2xl font-semibold">Tất cả sản phẩm</h1>
              
              <div className="flex items-center mt-2 sm:mt-0">
                {activeFiltersCount > 0 && (
                  <span className="mr-3 text-sm bg-[#fdf2f8] text-[#d53f8c] px-2 py-1 rounded-full">
                    {activeFiltersCount} bộ lọc đang áp dụng
                  </span>
                )}
                <span className="mr-2">Sắp xếp theo:</span>
                <select 
                  className="border rounded p-2 focus:border-[#d53f8c] focus:ring-[#d53f8c]"
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange({ sortBy: e.target.value })}
                >
                  <option value="popularity">Phổ biến</option>
                  <option value="newest">Mới nhất</option>
                  <option value="priceAsc">Giá tăng dần</option>
                  <option value="priceDesc">Giá giảm dần</option>
                  <option value="rating">Đánh giá</option>
                </select>
              </div>
            </div>
            
            {/* Hiển thị các bộ lọc đang áp dụng */}
            {activeFiltersCount > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {filters.categories.length > 0 && (
                  <div className="bg-[#fdf2f8] rounded-full px-3 py-1 text-sm flex items-center">
                    Danh mục: {filters.categories.length}
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
                    Thương hiệu: {filters.brands.length}
                    <button 
                      className="ml-2 text-gray-500 hover:text-gray-700"
                      onClick={() => handleFilterChange({ brands: [] })}
                    >
                      ×
                    </button>
                  </div>
                )}
                
                {(filters.priceRange[0] > 0 || filters.priceRange[1] < 5000000) && (
                  <div className="bg-[#fdf2f8] rounded-full px-3 py-1 text-sm flex items-center">
                    Khoảng giá
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
                      image={product.images[0]?.url || '/images/product-placeholder.jpg'}
                      price={product.currentPrice}
                      originalPrice={product.price}
                      rating={product.reviews.averageRating}
                      ratingCount={product.reviews.reviewCount}
                      soldCount={Math.floor(Math.random() * 100) + 10}
                      discount={product.currentPrice < product.price ? Math.round(((product.price - product.currentPrice) / product.price) * 100) : undefined}
                      slug={product.slug}
                      flashSale={product.flags.isOnSale ? {
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