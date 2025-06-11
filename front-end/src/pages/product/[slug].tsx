import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { FiArrowLeft, FiMapPin } from 'react-icons/fi';
import { formatImageUrl } from '@/utils/imageUtils';
import { useShopProduct } from '@/contexts/user/shop/ShopProductContext';
import { usePerformanceMonitor } from '@/utils/performanceMonitor';

// Static imports for critical components
import ProductSEO from '@/components/product/ProductSEO';
import ProductImages, { ImageType } from '@/components/product/ProductImages';
import ProductInfo from '@/components/product/ProductInfo';
import { VariantCombination } from '@/components/product/ProductVariants';
import DefaultLayout from '@/layout/DefaultLayout';

// Dynamic imports for non-critical components
const ProductDescription = dynamic(() => import('@/components/product/ProductDescription'), {
  loading: () => <div className="animate-pulse bg-gray-200 h-32 rounded-lg" />
});
const ProductReviews = dynamic(() => import('@/components/product/ProductReviews'), {
  loading: () => <div className="animate-pulse bg-gray-200 h-64 rounded-lg" />
});
const RecommendedProducts = dynamic(() => import('@/components/common/RecommendedProducts'), {
  loading: () => <div className="animate-pulse bg-gray-200 h-48 rounded-lg" />
});
const ProductInventory = dynamic(() => import('@/components/product/ProductInventory'), {
  loading: () => <div className="animate-pulse bg-gray-200 h-24 rounded-lg" />
});
const ProductCategories = dynamic(() => import('@/components/product/ProductCategories'), {
  loading: () => <div className="animate-pulse bg-gray-200 h-16 rounded-lg" />
});
const ProductPromotions = dynamic(() => import('@/components/product/ProductPromotions'), {
  loading: () => <div className="animate-pulse bg-gray-200 h-20 rounded-lg" />
});

// Import all product-related types
import {
  ProductPageProps,
  VariantWithPromotion,
  InventoryItem,
} from '../../types/product';

// Create a compatible Variant type that matches what we need
type Variant = {
  variantId: string;
  sku: string;
  price: number;
  currentPrice?: number;
  images?: string[]; // Use string[] to match ProductInfo expectations
  options: {
    color?: string;
    sizes?: string[];
    shades?: string[];
  };
  inventory?: Array<{ branchId: string; quantity: number; branchName?: string }>;
  combinationInventory?: Array<{ branchId: string; variantId: string; combinationId: string; quantity: number; branchName?: string }>;
  totalStock?: number;
  promotion?: {
    type: 'event' | 'campaign';
    id: string;
    name: string;
    adjustedPrice: number;
  };
  promotionPrice?: number;
};


const ProductPage: React.FC<Omit<ProductPageProps, 'reviews' | 'recommendedProducts' | 'hasPurchased' | 'hasReviewed'>> = ({
  product,
  fullBrand,
  productCategories,
  branches,
  categories,
  events,
  campaigns,
  isAuthenticated,
}) => {
  // ... (rest of component logic remains the same for now)
  const router = useRouter();
  const shopProductContext = useShopProduct();
  const { logProductView } = shopProductContext || {};
  const { markStart, markEnd, logMetrics } = usePerformanceMonitor();

  // Tối ưu tracking thời gian xem sản phẩm
  const startViewTimeRef = React.useRef<number>(0);

  // Ghi lại hoạt động xem sản phẩm khi component được mount
  useEffect(() => {
    // Start performance monitoring
    markStart('product-page-render');

    if (isAuthenticated && product?._id && logProductView) {
      // Ghi lại thời điểm bắt đầu xem
      startViewTimeRef.current = Date.now();

      // Ghi lại hoạt động xem sản phẩm
      logProductView(product._id);

      // Cleanup function để ghi lại thời gian đã xem
      return () => {
        if (startViewTimeRef.current > 0) {
          const timeSpent = Math.floor((Date.now() - startViewTimeRef.current) / 1000);
          if (timeSpent > 5) { // Chỉ ghi lại nếu xem ít nhất 5 giây
            logProductView(product._id, timeSpent);
          }
        }

        // End performance monitoring and log metrics
        markEnd('product-page-render');
        logMetrics();
      };
    }
  }, [isAuthenticated, product?._id, logProductView, markStart, markEnd, logMetrics]);

  // Process variants to include total stock information and combination inventory
  const processedVariants = useMemo(() => {
    if (!product?.variants?.length) return [];

    return product.variants.map((variant: VariantWithPromotion) => {
      // Map variantInventory to match Variant's expected inventory structure
      const mappedInventory = product.variantInventory
        ?.filter(inv => inv.variantId === variant.variantId)
        .map(inv => ({
          branchId: inv.branchId, // Use the correct branchId field
          quantity: inv.quantity || 0,
          // branchName will be populated by ProductInfo component
        })) || [];

      const combinationInventory = product.combinationInventory?.filter(
        (inv) => inv.variantId === variant.variantId
      ) || [];
      
      const totalStock = mappedInventory.reduce(
        (sum: number, inv) => sum + (inv.quantity || 0),
        0
      );

      // Convert images to string array if needed
      const processedImages = variant.images?.map(img =>
        typeof img === 'string' ? img : img.url
      ) || [];

      return {
        ...variant,
        options: variant.options || {}, // Ensure options is always defined
        images: processedImages, // Convert to string array
        inventory: mappedInventory, // Use mapped inventory
        combinationInventory: combinationInventory as unknown as Array<{ branchId: string; variantId: string; combinationId: string; quantity: number; branchName?: string }>, // Cast to proper type
        totalStock
      };
    });
  }, [product?.variants, product?.variantInventory, product?.combinationInventory]);

  // State for the currently selected variant and combination
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(() => {
    // Initialize with the first processed variant if available
    if (processedVariants.length > 0) {
      const firstVariant = processedVariants[0];
      // Ensure options is always defined to match Variant type requirements
      return {
        ...firstVariant,
        options: firstVariant.options || {}
      };
    }
    return null;
  });

  // selectedCombination is not currently used in the component but kept for future implementation
  const [, setSelectedCombination] = useState<VariantCombination | null>(null);

  // Handler to update the selected variant and combination state
  const handleSelectVariant = useCallback((variant: Variant | null, combination?: VariantCombination | null) => {
    setSelectedVariant(variant);
    setSelectedCombination(combination || null);
  }, []);

  // --- Helper Functions for Variant Names ---
  const parseColorString = useCallback((colorString?: string): { name: string, code: string } => {
    if (!colorString) return { name: '', code: '' };
    const regex = /^(.*?)\s*"(#[0-9a-fA-F]{6})"$/;
    const match = colorString.match(regex);
    if (match && match.length === 3) {
      return { name: match[1].trim(), code: match[2] };
    }
    return { name: colorString, code: '' };
  }, []);

  const getVariantName = useCallback((variant: VariantWithPromotion | Variant): string | undefined => {
    const parts: string[] = [];
    if (variant.options?.color) {
      const { name } = parseColorString(variant.options.color);
      if (name) parts.push(`Màu: ${name}`);
    }
    if (variant.options?.sizes && variant.options.sizes.length > 0) {
      parts.push(`Dung tích: ${variant.options.sizes.join(', ')}`);
    }
    if (variant.options?.shades && variant.options.shades.length > 0) {
      parts.push(`Tone: ${variant.options.shades.join(', ')}`);
    }
    return parts.length > 0 ? parts.join(' | ') : undefined;
  }, [parseColorString]);

  // --- Image Aggregation and Initial Image Logic ---
  const { allImages, initialImageUrl } = useMemo(() => {
    // 1. Get Base Product Images
    const baseImages: ImageType[] = product?.images
      ?.filter((img): img is { url: string, alt: string, isPrimary?: boolean } => // alt is non-optional
        typeof img === 'object' && img !== null && typeof img.url === 'string' && typeof img.alt === 'string'
      )
      .map((img): ImageType => ({
        url: formatImageUrl(img.url),
        alt: img.alt || product.name,
        isPrimary: img.isPrimary ?? false,
        // No variantName for base images
      })) || [];

    // 2. Get All Variant Images with Names
    const allVariantImages: ImageType[] = product?.variants
      ?.flatMap((variant: VariantWithPromotion) => { // Changed Variant to VariantWithPromotion
        const variantName = getVariantName(variant);
        // Assuming variant.images are URLs or objects with { url: string, alt?: string, isPrimary?: boolean }
        return variant.images?.map((imgData: string | { url: string; alt?: string; isPrimary?: boolean }): ImageType | null => {
          let url: string | undefined;
          let alt: string | undefined;
          let isPrimary: boolean | undefined;

          if (typeof imgData === 'string') {
            url = imgData; // Assume it's a URL string
          } else if (typeof imgData === 'object' && imgData !== null && imgData.url) {
            url = imgData.url;
            alt = imgData.alt;
            isPrimary = imgData.isPrimary;
          }

          if (url) {
            return {
              url: formatImageUrl(url),
              alt: alt || product.name,
              isPrimary: isPrimary ?? false,
              variantName: variantName, // Add the generated variant name
            };
          }
          return null; // Filter out invalid image data
        }).filter((img): img is ImageType => img !== null) || [];
      }) || [];

    // 3. Combine and Deduplicate (based on URL)
    const combinedImages = [...baseImages, ...allVariantImages];
    const uniqueImages = Array.from(new Map(combinedImages.map(img => [img.url, img])).values());

    // 4. Determine Initial Image URL
    let initialUrl: string | undefined;
    if (selectedVariant?.images && selectedVariant.images.length > 0) {
      // Find primary image of selected variant, or just the first image
      const selectedVariantImageUrls = selectedVariant.images.map((imgData: string | { url: string; alt?: string; isPrimary?: boolean }) =>
        typeof imgData === 'string' ? imgData : (typeof imgData === 'object' && imgData?.url ? imgData.url : null)
      ).filter((url): url is string => url !== null);

      const primaryVariantImage = uniqueImages.find(img =>
        selectedVariantImageUrls.includes(img.url) && img.isPrimary
      );
      initialUrl = primaryVariantImage?.url || selectedVariantImageUrls[0];
    }

    // Fallback to primary base image or first base image if no variant image found
    if (!initialUrl) {
      const primaryBaseImage = baseImages.find(img => img.isPrimary);
      initialUrl = primaryBaseImage?.url || baseImages[0]?.url;
    }

    return { allImages: uniqueImages, initialImageUrl: initialUrl };

  }, [selectedVariant, product?.images, product?.variants, product?.name, getVariantName]);


  return (
    <DefaultLayout>
      {/* SEO - Pass all categories for now, might refine later */}
      <ProductSEO
        seo={{
          metaTitle: product.seo?.title,
          metaDescription: product.seo?.description,
          keywords: typeof product.seo?.keywords === 'string'
            ? [product.seo.keywords]
            : product.seo?.keywords
        }}
        product={{
          name: product.name,
          slug: product.slug,
          price: product.price || 0,
          currentPrice: product.currentPrice,
          status: product.status,
          brand: fullBrand ? { name: fullBrand.name } : undefined,
          images: product.images?.map(img =>
            typeof img === 'string'
              ? { url: img, alt: product.name }
              : { url: img.url, alt: img.alt || product.name }
          ),
          categoryIds: product.categoryIds,
          tags: product.tags
        }}
        categories={categories} // Pass all categories here
      />

      <main className="mx-auto px-3 sm:px-4 md:px-6 lg:px-8 pt-1 pb-2 sm:pt-2 sm:pb-3" style={{ maxWidth: 'calc(100vw - 40px)' }}>
        {/* Nút quay lại */}
        <div className="mb-1">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-pink-600 transition-colors duration-200 text-sm sm:text-base"
          >
            <FiArrowLeft className="mr-2 w-4 h-4 sm:w-5 sm:h-5" />
            <span>Quay lại</span>
          </button>
        </div>

        {/* Layout chính với sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
          {/* Nội dung chính */}
          <div className="lg:col-span-3 xl:col-span-4">
            {/* Thông tin sản phẩm - Section chính */}
            <div className="mb-2 sm:mb-3">
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                  {/* Ảnh sản phẩm - Bên trái */}
                  <div className="p-3 sm:p-4 bg-gray-50/30">
                    <ProductImages
                      images={allImages}
                      initialImageUrl={initialImageUrl}
                      productName={product.name}
                    />
                  </div>

                  {/* Thông tin chi tiết - Bên phải */}
                  <div className="p-3 sm:p-4 flex flex-col h-full">
                    <ProductInfo
                      _id={product._id}
                      name={product.name}
                      sku={product.sku || ''}
                      description={{ short: product.description?.short || '' }}
                      price={product.price || 0}
                      currentPrice={product.currentPrice || product.price || 0}
                      status={product.status || 'active'}
                      brand={fullBrand || { _id: '', name: '', slug: '' }}
                      cosmetic_info={{
                        skinType: product.cosmetic_info?.skinType || [],
                        concerns: product.cosmetic_info?.concerns || [],
                        ingredients: product.cosmetic_info?.ingredients || [],
                        volume: product.cosmetic_info?.volume || { value: 0, unit: 'ml' },
                        madeIn: product.cosmetic_info?.madeIn || ''
                      }}
                      variants={processedVariants}
                      flags={{
                        isBestSeller: product.flags?.isBestSeller || false,
                        isNew: product.flags?.isNew || false,
                        isOnSale: product.flags?.isOnSale || false,
                        hasGifts: product.flags?.hasGifts || false
                      }}
                      gifts={[]} // Temporarily empty until proper type mapping
                      reviews={product.reviews || { averageRating: 0, reviewCount: 0 }}
                      selectedVariant={selectedVariant}
                      onSelectVariant={handleSelectVariant}
                      branches={branches || []}
                      product={{
                        inventory: (product.inventory || []) as InventoryItem[],
                        combinationInventory: (product.combinationInventory || []) as unknown as Array<{ branchId: string; variantId: string; combinationId: string; quantity: number; branchName?: string }> // Cast to proper type
                      }}
                    />
                  </div>
                </div>

                {/* Thông tin nhanh về sản phẩm */}
                <div className="border-t border-gray-200 px-3 sm:px-4 py-2 bg-gray-50/50">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 text-xs sm:text-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center">
                      <span className="font-medium text-gray-700 sm:mr-2">Loại da:</span>
                      <div className="flex flex-wrap gap-1 mt-1 sm:mt-0">
                        {product.cosmetic_info?.skinType?.map((type: string, index: number) => (
                          <span key={index} className="px-1.5 sm:px-2 py-0.5 bg-[#fdf2f8] text-[#d53f8c] text-xs rounded-full">
                            {type}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center">
                      <span className="font-medium text-gray-700 sm:mr-2">Dung tích:</span>
                      <span className="mt-1 sm:mt-0">{product.cosmetic_info?.volume?.value || 0} {product.cosmetic_info?.volume?.unit || 'ml'}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center">
                      <span className="font-medium text-gray-700 sm:mr-2">Xuất xứ:</span>
                      <span className="mt-1 sm:mt-0">{product.cosmetic_info?.madeIn || 'N/A'}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center">
                      <span className="font-medium text-gray-700 sm:mr-2">Hạn sử dụng:</span>
                      <span className="mt-1 sm:mt-0">{product.cosmetic_info?.expiry?.shelf || 0} tháng</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs cho thông tin chi tiết */}
            <div className="mb-3 sm:mb-4">
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <ProductDescription
                  fullDescription={product.description?.full || ''}
                  cosmeticInfo={product.cosmetic_info || {}}
                />
              </div>
            </div>

            {/* Thông tin bổ sung - Grid 3 cột responsive */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-3 sm:mb-4">
              {/* Tồn kho theo chi nhánh */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="border-b border-gray-200 px-3 py-2">
                  <h3 className="font-medium text-gray-800 flex items-center text-sm">
                    <FiMapPin className="mr-2 text-pink-500" />
                    Tồn kho theo chi nhánh
                  </h3>
                </div>
                <div className="p-3">
                  <ProductInventory
                    inventory={product.inventory?.map(inv => ({
                      ...inv,
                      lowStockThreshold: 10 // Default threshold
                    })) || []}
                    branches={branches || []}
                  />
                </div>
              </div>

              {/* Khuyến mãi đang áp dụng */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="border-b border-gray-200 px-3 py-2">
                  <h3 className="font-medium text-gray-800 flex items-center text-sm">
                    <svg className="w-4 h-4 text-pink-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                    </svg>
                    Khuyến mãi đang áp dụng
                  </h3>
                </div>
                <div className="p-3">
                  <ProductPromotions
                    events={events?.map(event => ({
                      _id: event._id,
                      name: event.title,
                      slug: event._id, // Use _id as slug since slug doesn't exist
                      description: event.description,
                      startDate: new Date(event.startDate).toISOString(),
                      endDate: new Date(event.endDate).toISOString()
                    }))}
                    campaigns={campaigns?.map(campaign => ({
                      _id: campaign._id,
                      name: campaign.title,
                      slug: campaign._id, // Use _id as slug since slug doesn't exist
                      description: campaign.description,
                      startDate: new Date(campaign.startDate).toISOString(),
                      endDate: new Date(campaign.endDate).toISOString()
                    }))}
                  />
                </div>
              </div>

              {/* Danh mục và tags */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="border-b border-gray-200 px-3 py-2">
                  <h3 className="font-medium text-gray-800 flex items-center text-sm">
                    <svg className="w-4 h-4 text-pink-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    Danh mục và tags
                  </h3>
                </div>
                <div className="p-3">
                  <ProductCategories
                    categories={productCategories || []}
                    tags={product.tags || []}
                  />
                </div>
              </div>
            </div>

            {/* Đánh giá sản phẩm */}
            <div className="mb-4" id="reviews">
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="border-b border-gray-200 px-3 py-2">
                  <h2 className="text-base font-bold text-gray-800 flex items-center">
                    <svg className="w-4 h-4 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    Đánh giá sản phẩm ({product.reviews?.reviewCount || 0})
                  </h2>
                </div>
                <div className="p-3">
                  <ProductReviews
                    productId={product._id}
                    // averageRating={product.reviews?.averageRating || 0} // Removed
                    // reviewCount={product.reviews?.reviewCount || 0} // Removed
                    // isAuthenticated={isAuthenticated} // Removed
                    // hasPurchased={hasPurchased} // Removed
                    // hasReviewed={hasReviewed} // Removed
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - ẩn trên mobile */}
          <div className="hidden lg:block lg:col-span-1 xl:col-span-1">
            <div className="sticky top-4 space-y-3 sm:space-y-4">
              {/* Sản phẩm gợi ý trong sidebar */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-pink-50 to-purple-50 border-b border-gray-200 px-3 py-2">
                  <h3 className="font-medium text-gray-800 flex items-center text-sm">
                    <svg className="w-4 h-4 text-pink-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Sản phẩm tương tự
                  </h3>
                </div>
                <div className="p-3">
                  <RecommendedProducts
                    type="similar"
                    productId={product._id}
                    title=""
                    seeMoreLink="/shop"
                    seeMoreText="Xem tất cả"
                    limit={4}
                    hideIfEmpty={true}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Toast Container is now in DefaultLayout */}
    </DefaultLayout>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  // Import helper functions
  const {
    fetchBrandDetails,
    fetchProductCategories,
    fetchBranches,
    fetchAllCategories,
    fetchActivePromotions,
    checkUserStatus,
    applyPromotionsToProduct
  } = await import('@/utils/productPageHelpers');

  // Lấy slug từ params
  const { slug } = context.params || {};
  const cookies = context.req.cookies;
  const token = cookies.token || '';
  const API_URL = process.env.NEXT_PUBLIC_API_URL?.endsWith('/api')
    ? process.env.NEXT_PUBLIC_API_URL
    : `${process.env.NEXT_PUBLIC_API_URL || 'https://backendyumin.vercel.app'}/api`;

  try {
    // Lấy thông tin sản phẩm từ API
    const productRes = await fetch(`${API_URL}/products/slug/${slug}`);

    if (!productRes.ok) {
      return {
        notFound: true,
      };
    }

    let product = await productRes.json();

    // Lấy thông tin khuyến mãi từ Event và Campaign đang hoạt động
    try {
      const { events: activeEvents, campaigns: activeCampaigns } = await fetchActivePromotions();

      // Apply promotions to product using helper function
      product = applyPromotionsToProduct(product, activeEvents, activeCampaigns);
    } catch (error) {
      // Silently handle promotion fetch errors in production
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching promotions:', error);
      }
    }

    // Fetch critical data in parallel for better performance
    const [
      fullBrand,
      productCategories,
      branchesData,
      allCategories,
      { isAuthenticated }
    ] = await Promise.all([
      fetchBrandDetails(product.brandId),
      fetchProductCategories(product.categoryIds || []),
      fetchBranches(),
      fetchAllCategories(),
      checkUserStatus(token, product._id) // Simplified check
    ]);

    // Get active promotions for the response (already fetched and applied)
    const { events, campaigns } = await fetchActivePromotions();

    return {
      props: {
        product,
        fullBrand: fullBrand || {},
        productCategories: productCategories || [],
        branches: branchesData || [],
        categories: allCategories || [],
        events: events || [],
        campaigns: campaigns || [],
        isAuthenticated,
        // Removed reviews, recommendedProducts, hasPurchased, hasReviewed
      },
    };
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching product data:', error);
    }

    return {
      notFound: true,
    };
  }
};

export default ProductPage;
