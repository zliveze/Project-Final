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
import { useCategory } from '@/contexts/CategoryContext';
import { useBrands } from '@/contexts/BrandContext';
import { useRouter } from 'next/router';

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
  // Cập nhật các thuộc tính để lấy thêm selectedCampaign
  const { 
    products,
    loading,
    error,
    currentPage,
    totalPages,
    filters,
    setFilters,
    changePage,
    selectedCampaign,
    fetchProducts,
    itemsPerPage
  } = useShopProduct();

  const [activeFiltersCount, setActiveFiltersCount] = useState(0);
  // Thêm router
  const router = useRouter();

  // Thêm context cho danh mục và thương hiệu
  const { categories } = useCategory();
  const { brands } = useBrands();
  
  // Thêm xử lý URL parameters
  useEffect(() => {
    const handleUrlParams = () => {
      // Lấy URL parameters từ chuỗi truy vấn
      const searchParams = new URLSearchParams(window.location.search);
      const newFilters: Partial<ShopProductFilters> = {};
      
      // Lấy eventId nếu có
      const eventId = searchParams.get('eventId');
      if (eventId) {
        newFilters.eventId = eventId;
        console.log(`Đã tìm thấy eventId ${eventId} từ URL params`);
      }
      
      // Xử lý eventName nếu có
      const eventName = searchParams.get('eventName');
      if (eventName) {
        console.log(`Tìm kiếm với eventName: ${eventName}`);
        // Sử dụng eventId nếu đã có trong URL
        if (eventId) {
          console.log(`Sử dụng eventId ${eventId} từ URL với eventName ${eventName}`);
        } 
        // Nếu không tìm thấy eventId, tìm qua danh sách sản phẩm
        else if (products.length > 0) {
          console.log(`Đang tìm kiếm sản phẩm theo eventName: ${eventName} trong ${products.length} sản phẩm`);
          const productsWithEvent = products.filter(
            (product: LightProduct) => product.promotion && 
                      product.promotion.type === 'event' && 
                      product.promotion.name === eventName
          );
          
          if (productsWithEvent.length > 0) {
            // Lấy ID của event từ sản phẩm đầu tiên tìm được
            const foundEventId = productsWithEvent[0].promotion?.id;
            if (foundEventId) {
              newFilters.eventId = foundEventId;
              console.log(`Tìm thấy eventId ${foundEventId} từ tên "${eventName}"`);
            }
          } else {
            console.log(`Không tìm thấy event với tên "${eventName}" trong danh sách sản phẩm hiện tại`);
          }
        }
      }
      
      // Lấy campaignId nếu có
      const campaignId = searchParams.get('campaignId');
      if (campaignId && campaignId !== 'undefined') {
        newFilters.campaignId = campaignId;
        console.log(`Đã tìm thấy campaignId ${campaignId} từ URL params`);
      }
      
      // Xử lý campaignName nếu có
      const campaignName = searchParams.get('campaignName');
      if (campaignName) {
        console.log(`Tìm kiếm với campaignName: ${campaignName}`);
        if (products.length > 0) {
          const productsWithCampaign = products.filter(
            (product: LightProduct) => product.promotion && 
                      product.promotion.type === 'campaign' && 
                      product.promotion.name === campaignName
          );
          
          if (productsWithCampaign.length > 0) {
            // Lấy ID của campaign từ sản phẩm đầu tiên tìm được
            const foundCampaignId = productsWithCampaign[0].promotion?.id;
            if (foundCampaignId && foundCampaignId !== 'undefined') {
              newFilters.campaignId = foundCampaignId;
              console.log(`Tìm thấy campaignId ${foundCampaignId} từ tên "${campaignName}"`);
            }
          } else {
            console.log(`Không tìm thấy campaign với tên "${campaignName}" trong danh sách sản phẩm hiện tại`);
          }
        }
      }
      
      // Xử lý trường hợp promotion=flash-sale (đặc biệt)
      const promotion = searchParams.get('promotion');
      if (promotion === 'flash-sale' && eventId) {
        newFilters.eventId = eventId;
      }

      // Kiểm tra nếu có tham số refresh, đảm bảo dữ liệu được tải lại
      const refresh = searchParams.get('refresh');
      const forceRefresh = refresh !== null;
      
      // Lưu trữ giá trị refresh đã xử lý để tránh xử lý lặp lại
      const processedRefresh = sessionStorage.getItem('processed_refresh');
      const isRefreshProcessed = processedRefresh === refresh;
      
      // Nếu đã xử lý refresh này rồi, bỏ qua
      if (forceRefresh && isRefreshProcessed) {
        console.log('Bỏ qua refresh đã được xử lý:', refresh);
        return;
      }
      
      // Áp dụng filters từ URL nếu có - Chỉ áp dụng nếu có sự thay đổi hoặc buộc refresh
      if (Object.keys(newFilters).length > 0 || forceRefresh) {
        // Kiểm tra xem filters hiện tại đã giống newFilters chưa để tránh render lại
        const needsUpdate = Object.entries(newFilters).some(([key, value]) => {
          return filters[key as keyof ShopProductFilters] !== value;
        });
        
        console.log('Cần cập nhật filters:', needsUpdate, 'Filters mới:', newFilters, 'Buộc refresh:', forceRefresh);
        
        if (needsUpdate || forceRefresh) {
          if (forceRefresh) {
            console.log('Buộc tải lại dữ liệu do tham số refresh:', refresh);
            
            // Lưu giá trị refresh đã xử lý vào sessionStorage
            sessionStorage.setItem('processed_refresh', refresh || '');
            
            // Kết hợp filters hiện tại với newFilters để đảm bảo không mất bộ lọc hiện tại
            const combinedFilters = { ...filters, ...newFilters };
            
            // Gọi trực tiếp fetchProducts với forceRefresh=true để bỏ qua kiểm tra trùng lặp
            fetchProducts(1, itemsPerPage, combinedFilters, true);
            
            // Cập nhật state filters mà không gọi lại fetchProducts
            setFilters(combinedFilters, true);
            
            // Sau khi xử lý refresh, xóa tham số refresh khỏi URL để tránh gọi API lặp lại
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.delete('refresh');
            window.history.replaceState({}, '', newUrl.toString());
          } else {
            // Cập nhật filters thông thường 
            setFilters(newFilters);
          }
        }
      }
    };
    
    // Nếu router.isReady thì mới xử lý URL parameters
    if (router.isReady) {
      handleUrlParams();
    }
  }, [
    setFilters,
    filters, 
    products,
    router.isReady,
    router.query,  // Thêm router.query để useEffect chạy lại khi query thay đổi
    itemsPerPage,
    fetchProducts
  ]);

  // Effect để đếm số bộ lọc đang active (sử dụng filters từ context)
  useEffect(() => {
    let count = 0;
    if (filters.categoryId) count++; // Thay categories -> categoryId
    if (filters.brandId) count++; // Thay brands -> brandId
    if (filters.eventId) count++; // Thêm đếm eventId
    if (filters.campaignId) count++; // Thêm đếm campaignId
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

  // Hàm helper để lấy tên danh mục từ ID
  const getCategoryName = (categoryId: string): string => {
    const category = categories.find((cat: any) => cat._id === categoryId);
    
    // Nếu không tìm thấy trong categories, thử tìm từ sản phẩm đầu tiên
    if (!category && products.length > 0) {
      // Lấy sản phẩm đầu tiên có categoryId này
      const firstProductWithCategory = products.find(
        (p) => p.categoryIds?.some((cat) => cat.id === categoryId)
      );
      
      if (firstProductWithCategory) {
        const matchingCategory = firstProductWithCategory.categoryIds?.find(
          (cat) => cat.id === categoryId
        );
        if (matchingCategory) {
          return matchingCategory.name;
        }
      }
    }
    
    return category ? category.name : categoryId;
  };
  
  // Hàm helper để lấy tên thương hiệu từ ID
  const getBrandName = (brandId: string): string => {
    const brand = brands.find((brand: any) => brand.id === brandId);
    return brand ? brand.name : brandId;
  };

  // Thêm hàm helper để lấy tên chiến dịch từ ID
  const getCampaignName = (campaignId: string): string => {
    // Nếu đã có selectedCampaign, sử dụng title của nó
    if (selectedCampaign && selectedCampaign._id === campaignId) {
      return selectedCampaign.title;
    }
    
    // Backup: Tìm tên chiến dịch từ dữ liệu sản phẩm
    const productWithCampaign = products.find(product => 
      product.promotion && 
      product.promotion.type === 'campaign' && 
      product.promotion.id === campaignId
    );
    
    return productWithCampaign?.promotion?.name || 'Khuyến mãi';
  };

  // Thêm hàm helper để lấy tên sự kiện từ ID
  const getEventName = (eventId: string): string => {
    // Tìm sự kiện từ dữ liệu sản phẩm
    const productWithEvent = products.find(product => 
      product.promotion && 
      product.promotion.type === 'event' && 
      product.promotion.id === eventId
    );
    
    return productWithEvent?.promotion?.name || 'Sự kiện';
  };

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

                {/* Hiển thị tên thương hiệu thay vì ID */}
                {filters.brandId && (
                  <div className="bg-[#fdf2f8] rounded-full px-3 py-1 text-sm flex items-center">
                    Thương hiệu: {getBrandName(filters.brandId)}
                    <button
                      className="ml-2 text-gray-500 hover:text-gray-700"
                      onClick={() => setFilters({ brandId: undefined })}
                    >
                      ×
                    </button>
                  </div>
                )}
                
                {/* Hiển thị tên danh mục thay vì ID */}
                {filters.categoryId && (
                  <div className="bg-[#fdf2f8] rounded-full px-3 py-1 text-sm flex items-center">
                    Danh mục: {getCategoryName(filters.categoryId)}
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
                 {/* Hiển thị khi có quà tặng */}
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
                 
                 {/* Hiển thị tên campaign thay vì ID */}
                 {filters.campaignId && (
                   <div className="bg-[#fdf2f8] rounded-full px-3 py-1 text-sm flex items-center">
                     Khuyến mãi: {getCampaignName(filters.campaignId)}
                     <button
                       className="ml-2 text-gray-500 hover:text-gray-700"
                       onClick={() => setFilters({ campaignId: undefined })}
                     >
                       ×
                     </button>
                   </div>
                 )}

                {/* Thêm filter hiển thị Event nếu có */}
                {filters.eventId && (
                  <div className="bg-[#fdf2f8] rounded-full px-3 py-1 text-sm flex items-center">
                    Sự kiện: {getEventName(filters.eventId)}
                    <button
                      className="ml-2 text-gray-500 hover:text-gray-700"
                      onClick={() => setFilters({ eventId: undefined })}
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
                    eventId: undefined,
                    campaignId: undefined,
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
                    eventId: undefined,
                    campaignId: undefined,
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
                      promotion={product.promotion} // Truyền thông tin promotion từ API
                      flashSale={product.promotion?.type === 'event' && product.promotion?.name === 'Flash Sale' ? {
                        isActive: true,
                        endTime: new Date(Date.now() + 86400000).toISOString(),
                        soldPercent: Math.floor(Math.random() * 80) + 20
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
