import React, { useState } from 'react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { FiArrowLeft } from 'react-icons/fi';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { formatImageUrl } from '@/utils/imageUtils';

// Components
import ProductSEO from '@/components/product/ProductSEO';
import ProductImages, { ImageType } from '@/components/product/ProductImages';
import ProductInfo, { Variant } from '@/components/product/ProductInfo'; // Import Variant type
import ProductDescription from '@/components/product/ProductDescription';
import ProductReviews from '@/components/product/ProductReviews';
import RecommendedProducts from '@/components/common/RecommendedProducts';
import ProductInventory from '@/components/product/ProductInventory';
import ProductCategories, { CategoryWithImage } from '@/components/product/ProductCategories'; // Import CategoryWithImage
import ProductPromotions from '@/components/product/ProductPromotions';
import DefaultLayout from '@/layout/DefaultLayout';
// import { useShopProduct } from '@/contexts/user/shop/ShopProductContext';
import { BrandWithLogo } from '@/components/product/ProductInfo'; // Import BrandWithLogo

interface ProductPageProps {
  product: any; // Keep 'any' for now, or define a full Product type
  fullBrand: BrandWithLogo; // Add full brand details
  productCategories: CategoryWithImage[]; // Add specific categories for the product
  reviews: any[]; // Define Review type if needed
  recommendedProducts: any[]; // Define RecommendedProduct type if needed
  branches: any[]; // Define Branch type if needed
  categories: any[]; // Keep all categories for SEO/other uses for now
  events: any[]; // Define Event type if needed
  campaigns: any[]; // Define Campaign type if needed
  isAuthenticated: boolean;
  hasPurchased: boolean;
  hasReviewed: boolean;
}


const ProductPage: React.FC<ProductPageProps> = ({
  product,
  fullBrand, // Destructure new prop
  productCategories, // Destructure new prop
  reviews,
  recommendedProducts,
  branches, // Keep for ProductInventory
  categories, // Keep for ProductSEO
  events,
  campaigns,
  isAuthenticated,
  hasPurchased,
  hasReviewed,
}) => {
  // ... (rest of component logic remains the same for now)
  const router = useRouter();
  // We'll use the ShopProductContext if needed in the future
  // const shopProductContext = useShopProduct();

  // Process variants to include total stock information
  const processedVariants = React.useMemo(() => {
    if (!product?.variants?.length) return [];

    return product.variants.map((variant: any) => {
      // Get variant inventory from product.variantInventory
      const variantInventory = product.variantInventory?.filter(
        (inv: any) => inv.variantId === variant.variantId
      ) || [];

      // Calculate total stock across all branches for this variant
      const totalStock = variantInventory.reduce(
        (sum: number, inv: any) => sum + (inv.quantity || 0),
        0
      );

      // Log for debugging
      console.log(`Variant ${variant.variantId} (${variant.options?.color || 'unknown'}) has totalStock: ${totalStock}`);
      console.log('Inventory details:', variantInventory);

      return {
        ...variant,
        inventory: variantInventory,
        totalStock
      };
    });
  }, [product?.variants, product?.variantInventory]);

  // State for the currently selected variant
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(() => {
    // Initialize with the first processed variant if available
    return processedVariants.length > 0 ? processedVariants[0] : null;
  });

  // Handler to update the selected variant state
  const handleSelectVariant = (variant: Variant | null) => {
    setSelectedVariant(variant);
  };

  // --- Helper Functions for Variant Names ---
  const parseColorString = (colorString?: string): { name: string, code: string } => {
    if (!colorString) return { name: '', code: '' };
    const regex = /^(.*?)\s*"(#[0-9a-fA-F]{6})"$/;
    const match = colorString.match(regex);
    if (match && match.length === 3) {
      return { name: match[1].trim(), code: match[2] };
    }
    return { name: colorString, code: '' };
  };

  const getVariantName = (variant: Variant): string | undefined => {
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
  };

  // --- Image Aggregation and Initial Image Logic ---
  const { allImages, initialImageUrl } = React.useMemo(() => {
    // 1. Get Base Product Images
    const baseImages: ImageType[] = product?.images
      ?.filter((img: any): img is { url: string, alt: string, isPrimary?: boolean } =>
        typeof img === 'object' && img !== null && typeof img.url === 'string'
      )
      .map((img: any): ImageType => ({
        url: formatImageUrl(img.url),
        alt: img.alt || product.name,
        isPrimary: img.isPrimary ?? false,
        // No variantName for base images
      })) || [];

    // 2. Get All Variant Images with Names
    const allVariantImages: ImageType[] = product?.variants
      ?.flatMap((variant: Variant) => {
        const variantName = getVariantName(variant);
        // Assuming variant.images are URLs or objects with { url: string, alt?: string, isPrimary?: boolean }
        return variant.images?.map((imgData: any): ImageType | null => {
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
      const selectedVariantImageUrls = selectedVariant.images.map((imgData: any) =>
        typeof imgData === 'string' ? imgData : (typeof imgData === 'object' && imgData?.url ? imgData.url : null)
      ).filter(url => url);

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

  }, [selectedVariant, product?.images, product?.variants, product?.name]);


  return (
    <DefaultLayout>
      {/* SEO - Pass all categories for now, might refine later */}
      <ProductSEO
        seo={product.seo || {}}
        product={product}
        categories={categories} // Pass all categories here
      />

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Nút quay lại */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-[#d53f8c] transition-colors duration-200"
          >
            <FiArrowLeft className="mr-2" />
            <span>Quay lại</span>
          </button>
        </div>

        {/* Thông tin sản phẩm */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10 bg-gradient-to-r from-white to-[#fdf2f8] bg-opacity-50 rounded-2xl p-6 shadow-sm">
          {/* Ảnh sản phẩm */}
          <div className="space-y-6">
            {/* Pass the aggregated images and the initial image URL */}
            <ProductImages
              images={allImages}
              initialImageUrl={initialImageUrl}
              productName={product.name}
            />

            {/* Thông tin nhanh về sản phẩm */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-800 mb-3">Thông tin nhanh:</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Loại da:</p>
                  <div className="flex flex-wrap gap-1">
                    {product.cosmetic_info?.skinType?.map((type: string, index: number) => (
                      <span key={index} className="px-2 py-1 bg-[#fdf2f8] text-[#d53f8c] text-xs rounded-full">
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Dung tích:</p>
                  <p className="text-sm font-medium">
                    {product.cosmetic_info?.volume?.value || 0} {product.cosmetic_info?.volume?.unit || 'ml'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Xuất xứ:</p>
                  <p className="text-sm font-medium">{product.cosmetic_info?.madeIn || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Hạn sử dụng:</p>
                  <p className="text-sm font-medium">
                    {product.cosmetic_info?.expiry?.shelf || 0} tháng
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Thông tin chi tiết */}
          <div className="space-y-8">
            <ProductInfo
              _id={product._id}
              name={product.name}
              sku={product.sku}
              description={{ short: product.description?.short || '' }}
              price={product.price || 0}
              currentPrice={product.currentPrice || product.price || 0}
              status={product.status || 'active'}
              brand={fullBrand} // Pass the full brand object
              cosmetic_info={product.cosmetic_info || {}}
              variants={processedVariants}
              flags={product.flags || {}}
              gifts={product.gifts || []}
              reviews={product.reviews || { averageRating: 0, reviewCount: 0 }}
              // Pass state and handler down
              selectedVariant={selectedVariant}
              onSelectVariant={handleSelectVariant}
              branches={branches}
            />
          </div>
        </div>

        {/* Thông tin bổ sung */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Tồn kho theo chi nhánh */}
          <div className="bg-gradient-to-r from-white to-[#fdf2f8] bg-opacity-50 rounded-xl p-5 shadow-sm">
            <ProductInventory
              inventory={product.inventory || []}
              branches={branches}
            />
          </div>

          {/* Khuyến mãi đang áp dụng */}
          <div className="bg-gradient-to-r from-white to-[#fdf2f8] bg-opacity-50 rounded-xl p-5 shadow-sm">
            <ProductPromotions
              events={events}
              campaigns={campaigns}
            />
          </div>

          {/* Danh mục và tags - Pass specific product categories */}
          <div className="bg-gradient-to-r from-white to-[#fdf2f8] bg-opacity-50 rounded-xl p-5 shadow-sm">
            <ProductCategories
              categories={productCategories} // Pass specific categories here
              tags={product.tags || []}
            />
          </div>
        </div>

        {/* Mô tả sản phẩm */}
        <div className="bg-gradient-to-r from-white to-[#fdf2f8] bg-opacity-50 rounded-2xl p-8 shadow-sm mb-12">
          <ProductDescription
            fullDescription={product.description?.full || ''}
            cosmeticInfo={product.cosmetic_info || {}}
          />
        </div>

        {/* Đánh giá sản phẩm */}
        <div className="bg-gradient-to-r from-white to-[#fdf2f8] bg-opacity-50 rounded-2xl p-8 shadow-sm mb-12">
          <ProductReviews
            productId={product._id}
            reviews={reviews}
            averageRating={product.reviews?.averageRating || 0}
            reviewCount={product.reviews?.reviewCount || 0}
            isAuthenticated={isAuthenticated}
            hasPurchased={hasPurchased}
            hasReviewed={hasReviewed}
          />
        </div>

        {/* Sản phẩm gợi ý */}
        <div className="bg-gradient-to-r from-white to-[#fdf2f8] bg-opacity-50 rounded-2xl p-8 shadow-sm mb-12">
          <RecommendedProducts
            products={recommendedProducts}
          />
        </div>
      </main>

      <ToastContainer />
    </DefaultLayout>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  // Lấy slug từ params
  const { slug } = context.params || {};
  const cookies = context.req.cookies;
  const token = cookies.token || '';
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  try {
    // Lấy thông tin sản phẩm từ API
    const productRes = await fetch(`${API_URL}/products/slug/${slug}`);

    if (!productRes.ok) {
      return {
        notFound: true,
      };
    }

    const product = await productRes.json();

    // --- LOGGING: Check fetched product and variant data ---
    console.log(`getServerSideProps: Fetched product with ID: ${product._id}`);
    if (product.variants && product.variants.length > 0) {
      console.log(`getServerSideProps: Variants found:`, product.variants.map((v: any) => ({ variantId: v.variantId, sku: v.sku, options: v.options })));
    } else {
      console.log(`getServerSideProps: No variants found for this product.`);
    }
    // --- END LOGGING ---

    // --- Fetch Full Brand Details ---
    let fullBrand = null;
    if (product.brandId) {
      try {
        const brandRes = await fetch(`${API_URL}/brands/${product.brandId}`);
        if (brandRes.ok) {
          fullBrand = await brandRes.json();
        } else {
          console.error(`Failed to fetch brand ${product.brandId}: ${brandRes.status}`);
        }
      } catch (brandError) {
        console.error(`Error fetching brand ${product.brandId}:`, brandError);
      }
    }

    // --- Fetch Full Category Details for this Product ---
    let productCategories: CategoryWithImage[] = [];
    if (product.categoryIds && product.categoryIds.length > 0) {
      const categoryPromises = product.categoryIds.map(async (id: string) => {
        try {
          const catRes = await fetch(`${API_URL}/categories/${id}`);
          if (catRes.ok) {
            return await catRes.json();
          } else {
            console.error(`Failed to fetch category ${id}: ${catRes.status}`);
            return null;
          }
        } catch (catError) {
          console.error(`Error fetching category ${id}:`, catError);
          return null;
        }
      });
      const resolvedCategories = await Promise.all(categoryPromises);
      productCategories = resolvedCategories.filter((cat): cat is CategoryWithImage => cat !== null);
    }

    // Lấy danh sách đánh giá từ API
    const reviewsRes = await fetch(`${API_URL}/reviews/product/${product._id}`);
    const reviewsData = reviewsRes.ok ? await reviewsRes.json() : { data: [], total: 0 };

    // Lấy sản phẩm gợi ý (từ sản phẩm liên quan hoặc cùng danh mục)
    const relatedIds = product.relatedProducts || [];
    let recommendedProductsQuery = '';

    if (relatedIds.length > 0) {
      recommendedProductsQuery = `relatedTo=${product._id}`;
    } else if (product.categoryIds && product.categoryIds.length > 0) {
      recommendedProductsQuery = `categoryId=${product.categoryIds[0]}&exclude=${product._id}`;
    }

    const recommendedRes = await fetch(`${API_URL}/products/light?${recommendedProductsQuery}&limit=6`);
    const recommendedData = recommendedRes.ok ? await recommendedRes.json() : { data: [] };

    // Lấy danh sách chi nhánh
    const branchesRes = await fetch(`${API_URL}/branches`); // Fetch all branches for inventory
    let branchesData = []; // Default to empty array
    if (branchesRes.ok) {
      const branchesResponse = await branchesRes.json();
      // Check if the response has a 'data' property that is an array
      if (branchesResponse && Array.isArray(branchesResponse.data)) {
        branchesData = branchesResponse.data;
      } else if (Array.isArray(branchesResponse)) {
        // Handle case where it directly returns an array
        branchesData = branchesResponse;
      } else {
        console.error('Unexpected branches API response structure:', branchesResponse);
      }
    } else {
       console.error(`Failed to fetch branches: ${branchesRes.status}`);
    }


    // Lấy danh sách *tất cả* danh mục (e.g., for SEO breadcrumbs or filtering)
    const allCategoriesRes = await fetch(`${API_URL}/categories`);
    const allCategories = allCategoriesRes.ok ? await allCategoriesRes.json() : [];

    // Lấy danh sách sự kiện và chiến dịch đang hoạt động
    const eventsRes = await fetch(`${API_URL}/events/active`);
    const events = eventsRes.ok ? await eventsRes.json() : [];

    const campaignsRes = await fetch(`${API_URL}/campaigns/active`);
    const campaigns = campaignsRes.ok ? await campaignsRes.json() : [];

    // Kiểm tra xem người dùng đã đăng nhập và đã mua sản phẩm và đã đánh giá hay chưa
    let isAuthenticated = false;
    let hasPurchased = false;
    let hasReviewed = false;

    if (token) {
      try {
        // Kiểm tra token hợp lệ
        const verifyRes = await fetch(`${API_URL}/auth/verify`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (verifyRes.ok) {
          isAuthenticated = true;

          // Kiểm tra đã mua sản phẩm chưa
          const purchaseRes = await fetch(`${API_URL}/orders/check-purchased?productId=${product._id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });

          if (purchaseRes.ok) {
            const { purchased } = await purchaseRes.json();
            hasPurchased = purchased;
          }

          // Kiểm tra đã đánh giá chưa
          const reviewCheckRes = await fetch(`${API_URL}/reviews/check-reviewed?productId=${product._id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });

          if (reviewCheckRes.ok) {
            const { reviewed } = await reviewCheckRes.json();
            hasReviewed = reviewed;
          }
        }
      } catch (error) {
        console.error('Error verifying authentication:', error);
      }
    }

    return {
      props: {
        product,
        fullBrand: fullBrand || {}, // Pass fetched full brand or empty object
        productCategories: productCategories || [], // Pass fetched specific categories or empty array
        reviews: reviewsData.data || [],
        recommendedProducts: recommendedData.data || [],
        branches: branchesData, // Pass the extracted array
        categories: allCategories || [], // Pass all categories
        events: events || [],
        campaigns: campaigns || [],
        isAuthenticated,
        hasPurchased,
        hasReviewed,
      },
    };
  } catch (error) {
    console.error('Error fetching product data:', error);

    return {
      notFound: true,
    };
  }
};

export default ProductPage;
