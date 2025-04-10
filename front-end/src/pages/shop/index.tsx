import React, { useState, useEffect } from 'react';
import DefaultLayout from '../../layout/DefaultLayout';
import ProductCardShop from '../../components/common/ProductCardShop';
import ShopFilters from '../../components/shop/ShopFilters';
import ShopBanner from '../../components/shop/ShopBanner';
import ShopPagination from '../../components/shop/ShopPagination';
import { BreadcrumItem } from '@/components/common/Breadcrum';
// Import hook mới cho shop
import { useShopProduct, ShopProductFilters } from '@/contexts/user/shop/ShopProductContext';
// Import kiểu LightProduct từ context mới
import { LightProduct } from '@/contexts/user/shop/ShopProductContext';

// Sử dụng lại interface Product từ context mới nếu cần, hoặc dùng LightProduct trực tiếp
// interface Product { ... } // Có thể xóa nếu LightProduct đủ dùng

// Xóa interface Filters cũ
/*
interface Filters {
  categories: string[];
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
}
*/

export default function Shop() {
  // Sử dụng hook mới
  const {
    products, // Sử dụng trực tiếp products từ context (đã là LightProduct[])
    loading,
    error, // Có thể sử dụng để hiển thị thông báo lỗi
    currentPage,
    totalPages,
    filters, // Lấy filters từ context
    setFilters, // Lấy hàm setFilters từ context
    changePage, // Lấy hàm changePage từ context
  } = useShopProduct();

  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  // Effect để đếm số bộ lọc đang active (sử dụng filters từ context)
  useEffect(() => {
    let count = 0;
    if (filters.categoryId) count++; // Thay categories -> categoryId
    if (filters.brandId) count++; // Thay brands -> brandId
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) count++; // Thay priceRange
    if (filters.skinTypes) count++; // Thay skinType
    if (filters.concerns) count++; // Thay concerns
    // if (filters.rating > 0) count++; // Rating chưa có trong context filters
    if (filters.isOnSale) count++; // Thay hasPromotion -> isOnSale
    // if (filters.hasFreeShipping) count++; // FreeShipping chưa có
    if (filters.hasGifts) count++;
    // if (filters.colors?.length > 0) count++; // Colors chưa có
    // if (filters.volume?.length > 0) count++; // Volume chưa có

    setActiveFiltersCount(count);
  }, [filters]);

  // Hàm xử lý thay đổi filter (sử dụng setFilters từ context)
  // Hàm này giờ chỉ nhận và truyền trực tiếp Partial<ShopProductFilters>
  // Component ShopFilters sẽ chịu trách nhiệm gửi đúng cấu trúc này
  const handleFilterChange = (newFilters: Partial<ShopProductFilters>) => {
    // Ví dụ: Nếu ShopFilters vẫn gửi cấu trúc cũ, bạn cần map ở đây.
    // Nhưng lý tưởng nhất là sửa ShopFilters để gửi đúng cấu trúc.
    // Giả sử ShopFilters đã được sửa hoặc sẽ được sửa:
    setFilters(newFilters); // Gọi hàm setFilters từ context với các thay đổi
  };

  // Hàm xử lý thay đổi trang (sử dụng changePage từ context)
  const handlePageChange = (page: number) => {
    changePage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Hàm xử lý tìm kiếm (sử dụng setFilters từ context)
  const handleSearch = (term: string) => {
    setFilters({ search: term }); // Cập nhật filter search
  };

  // Breadcrumb cho trang
  // Breadcrumb cho trang
  const breadcrumbs: BreadcrumItem[] = [
    { label: 'Trang chủ', href: '/' },
    { label: 'Cửa hàng', href: '/shop' }, // Removed 'active: true'
  ];

  return (
    <DefaultLayout breadcrumItems={breadcrumbs}>
      <ShopBanner />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar filters - Truyền filters và setFilters từ context */}
          <div className="md:w-64 shrink-0">
            <ShopFilters
              // Removed comments inside JSX props
              filters={filters}
              onFilterChange={handleFilterChange}
              onSearch={handleSearch}
            />
          </div>

          {/* Main content */}
          <div className="flex-grow">
            {/* Bộ lọc đang active - Cập nhật để sử dụng filters từ context */}
            {activeFiltersCount > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-4 p-3 bg-white rounded-lg shadow-sm">
                <span className="text-sm font-medium text-gray-700 mr-2">
                  Bộ lọc ({activeFiltersCount}):
                </span>

                {/* Ví dụ cập nhật cho brandId */}
                {filters.brandId && (
                  <div className="bg-[#fdf2f8] rounded-full px-3 py-1 text-sm flex items-center">
                    Thương hiệu: {filters.brandId} {/* Cần lấy tên thương hiệu nếu có */}
                    <button
                      className="ml-2 text-gray-500 hover:text-gray-700"
                      onClick={() => setFilters({ brandId: undefined })}
                    >
                      ×
                    </button>
                  </div>
                )}
                 {/* Ví dụ cập nhật cho categoryId */}
                 {filters.categoryId && (
                  <div className="bg-[#fdf2f8] rounded-full px-3 py-1 text-sm flex items-center">
                    Danh mục: {filters.categoryId} {/* Cần lấy tên danh mục nếu có */}
                    <button
                      className="ml-2 text-gray-500 hover:text-gray-700"
                      onClick={() => setFilters({ categoryId: undefined })}
                    >
                      ×
                    </button>
                  </div>
                )}
                 {/* Ví dụ cập nhật cho price */}
                 {(filters.minPrice !== undefined || filters.maxPrice !== undefined) && (
                  <div className="bg-[#fdf2f8] rounded-full px-3 py-1 text-sm flex items-center">
                    Giá: {filters.minPrice?.toLocaleString() ?? '0'}đ - {filters.maxPrice?.toLocaleString() ?? '∞'}đ
                    <button
                      className="ml-2 text-gray-500 hover:text-gray-700"
                      onClick={() => setFilters({ minPrice: undefined, maxPrice: undefined })}
                    >
                      ×
                    </button>
                  </div>
                )}
                 {/* Ví dụ cập nhật cho skinTypes */}
                 {filters.skinTypes && (
                  <div className="bg-[#fdf2f8] rounded-full px-3 py-1 text-sm flex items-center">
                    Loại da: {filters.skinTypes.split(',').join(', ')}
                    <button
                      className="ml-2 text-gray-500 hover:text-gray-700"
                      onClick={() => setFilters({ skinTypes: undefined })}
                    >
                      ×
                    </button>
                  </div>
                )}
                 {/* Ví dụ cập nhật cho concerns */}
                 {filters.concerns && (
                  <div className="bg-[#fdf2f8] rounded-full px-3 py-1 text-sm flex items-center">
                    Vấn đề da: {filters.concerns.split(',').join(', ')}
                    <button
                      className="ml-2 text-gray-500 hover:text-gray-700"
                      onClick={() => setFilters({ concerns: undefined })}
                    >
                      ×
                    </button>
                  </div>
                )}
                 {/* Ví dụ cập nhật cho isOnSale */}
                 {filters.isOnSale && (
                  <div className="bg-[#fdf2f8] rounded-full px-3 py-1 text-sm flex items-center">
                    Đang giảm giá
                    <button
                      className="ml-2 text-gray-500 hover:text-gray-700"
                      onClick={() => setFilters({ isOnSale: undefined })}
                    >
                      ×
                    </button>
                  </div>
                )}
                 {/* Ví dụ cập nhật cho hasGifts */}
                 {filters.hasGifts && (
                  <div className="bg-[#fdf2f8] rounded-full px-3 py-1 text-sm flex items-center">
                    Có quà tặng
                    <button
                      className="ml-2 text-gray-500 hover:text-gray-700"
                      onClick={() => setFilters({ hasGifts: undefined })}
                    >
                      ×
                    </button>
                  </div>
                )}

                {/* Nút xóa tất cả bộ lọc */}
                <button
                  className="text-[#d53f8c] hover:underline text-sm"
                  onClick={() => setFilters({ // Reset về giá trị mặc định của context
                    search: undefined,
                    brandId: undefined,
                    categoryId: undefined,
                    status: undefined,
                    minPrice: undefined,
                    maxPrice: undefined,
                    tags: undefined,
                    skinTypes: undefined,
                    concerns: undefined,
                    isBestSeller: undefined,
                    isNew: undefined,
                    isOnSale: undefined,
                    hasGifts: undefined,
                    sortBy: undefined, // Hoặc giá trị mặc định như 'createdAt'
                    sortOrder: undefined // Hoặc giá trị mặc định như 'desc'
                  })}
                >
                  Xóa tất cả bộ lọc
                </button>
              </div>
            )}

            {/* Hiển thị lỗi nếu có */}
            {error && (
              <div className="text-center py-12 bg-red-100 text-red-700 rounded-lg mb-4">
                <p>Đã xảy ra lỗi: {error}</p>
              </div>
            )}

            {/* Danh sách sản phẩm - Sử dụng loading và products từ context */}
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-fr">
                {/* Skeleton loading */}
                {Array(12).fill(null).map((_, index) => ( // Hiển thị skeleton dựa trên itemsPerPage
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
                  onClick={() => setFilters({ // Reset về giá trị mặc định của context
                    search: undefined,
                    brandId: undefined,
                    categoryId: undefined,
                    status: undefined,
                    minPrice: undefined,
                    maxPrice: undefined,
                    tags: undefined,
                    skinTypes: undefined,
                    concerns: undefined,
                    isBestSeller: undefined,
                    isNew: undefined,
                    isOnSale: undefined,
                    hasGifts: undefined,
                    sortBy: undefined,
                    sortOrder: undefined
                  })}
                >
                  Xóa tất cả bộ lọc
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-fr">
                {/* Map qua products từ context */}
                {products.map((product: LightProduct) => (
                  <div key={product.id} className="h-full">
                    <ProductCardShop
                      id={product.id}
                      name={product.name}
                      // Sử dụng imageUrl từ LightProduct
                      image={product.imageUrl || '/images/product-placeholder.jpg'}
                      price={product.currentPrice}
                      originalPrice={product.price}
                      rating={product.reviews?.averageRating || 0}
                      ratingCount={product.reviews?.reviewCount || 0}
                      soldCount={Math.floor(Math.random() * 100) + 10} // Giữ lại random nếu chưa có API
                      discount={product.currentPrice < product.price ? Math.round(((product.price - product.currentPrice) / product.price) * 100) : undefined}
                      slug={product.slug}
                      flashSale={product.flags?.isOnSale ? {
                        isActive: true,
                        endTime: new Date(Date.now() + 86400000).toISOString(), // Giữ lại logic tạm thời
                        soldPercent: Math.floor(Math.random() * 80) + 20 // Giữ lại random nếu chưa có API
                      } : undefined}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Pagination - Sử dụng currentPage, totalPages, changePage từ context */}
            {!loading && products.length > 0 && (
              <ShopPagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange} // Sử dụng handlePageChange đã được cập nhật
              />
            )}
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
}
