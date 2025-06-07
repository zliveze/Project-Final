/**
 * Helper functions for product page data fetching and processing
 */

import { CategoryWithImage } from '@/components/product/ProductCategories';
import { BrandWithLogo } from '@/components/product/ProductInfo';

const API_URL = process.env.NEXT_PUBLIC_API_URL?.endsWith('/api')
  ? process.env.NEXT_PUBLIC_API_URL
  : `${process.env.NEXT_PUBLIC_API_URL || 'https://backendyumin.vercel.app'}/api`;

// Define proper types to replace 'any'
interface VariantOptions {
  color?: string;
  sizes?: string[];
  shades?: string[];
  [key: string]: unknown;
}

interface VariantCombination {
  combinationId: string;
  price?: number;
  promotionPrice?: number;
  promotion?: {
    type: string;
    id: string;
    name: string;
    adjustedPrice: number;
  };
  [key: string]: unknown;
}

interface Branch {
  _id: string;
  name: string;
  address: string;
  phone?: string;
  [key: string]: unknown;
}

interface Review {
  _id: string;
  userId: string;
  productId: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown;
}

interface RecommendedProduct {
  _id: string;
  name: string;
  slug: string;
  price: number;
  currentPrice: number;
  imageUrl?: string;
  categoryIds?: string[];
  relatedProducts?: string[];
  [key: string]: unknown;
}

interface Category {
  _id: string;
  name: string;
  slug: string;
  image?: string;
  [key: string]: unknown;
}

interface Product {
  _id: string;
  name: string;
  currentPrice: number;
  categoryIds?: string[];
  relatedProducts?: string[];
  variants?: VariantWithPromotion[];
  promotion?: {
    type: string;
    id: string;
    name: string;
    adjustedPrice: number;
  };
  [key: string]: unknown;
}

// Types for better type safety
interface VariantWithPromotion {
  variantId: string;
  sku: string;
  options: VariantOptions;
  price?: number;
  promotionPrice?: number;
  promotion?: {
    type: string;
    id: string;
    name: string;
    adjustedPrice: number;
  };
  combinations?: VariantCombination[];
}

interface Event {
  _id: string;
  title: string;
  products: Array<{
    productId: string;
    adjustedPrice: number;
    variants?: Array<{
      variantId: string;
      adjustedPrice: number;
      combinations?: Array<{
        combinationId: string;
        adjustedPrice: number;
      }>;
    }>;
  }>;
}

interface Campaign {
  _id: string;
  title: string;
  products: Array<{
    productId: string;
    adjustedPrice: number;
    variants?: Array<{
      variantId: string;
      adjustedPrice: number;
      combinations?: Array<{
        combinationId: string;
        adjustedPrice: number;
      }>;
    }>;
  }>;
}

/**
 * Fetch brand details with error handling
 */
export async function fetchBrandDetails(brandId: string): Promise<BrandWithLogo | null> {
  if (!brandId) return null;

  try {
    const brandRes = await fetch(`${API_URL}/brands/${brandId}`);
    if (brandRes.ok) {
      return await brandRes.json();
    } else if (process.env.NODE_ENV === 'development') {
      console.error(`Failed to fetch brand ${brandId}: ${brandRes.status}`);
    }
  } catch (brandError) {
    if (process.env.NODE_ENV === 'development') {
      console.error(`Error fetching brand ${brandId}:`, brandError);
    }
  }
  return null;
}

/**
 * Fetch category details for a product
 */
export async function fetchProductCategories(categoryIds: string[]): Promise<CategoryWithImage[]> {
  if (!categoryIds || categoryIds.length === 0) return [];

  const categoryPromises = categoryIds.map(async (id: string) => {
    try {
      const catRes = await fetch(`${API_URL}/categories/${id}`);
      if (catRes.ok) {
        return await catRes.json();
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.error(`Failed to fetch category ${id}: ${catRes.status}`);
        }
        return null;
      }
    } catch (catError) {
      if (process.env.NODE_ENV === 'development') {
        console.error(`Error fetching category ${id}:`, catError);
      }
      return null;
    }
  });

  const resolvedCategories = await Promise.all(categoryPromises);
  return resolvedCategories.filter((cat): cat is CategoryWithImage => cat !== null);
}

/**
 * Fetch branches data with proper error handling
 */
export async function fetchBranches(): Promise<Branch[]> {
  try {
    const branchesRes = await fetch(`${API_URL}/branches`);
    if (branchesRes.ok) {
      const branchesResponse = await branchesRes.json();
      
      if (branchesResponse && Array.isArray(branchesResponse.data)) {
        return branchesResponse.data;
      } else if (Array.isArray(branchesResponse)) {
        return branchesResponse;
      } else if (process.env.NODE_ENV === 'development') {
        console.error('Unexpected branches API response structure:', branchesResponse);
      }
    } else if (process.env.NODE_ENV === 'development') {
      console.error(`Failed to fetch branches: ${branchesRes.status}`);
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching branches:', error);
    }
  }
  return [];
}

/**
 * Fetch reviews for a product
 */
export async function fetchProductReviews(productId: string): Promise<Review[]> {
  try {
    const reviewsRes = await fetch(`${API_URL}/reviews/product/${productId}`);
    const reviewsData = reviewsRes.ok ? await reviewsRes.json() : { data: [], total: 0 };
    return reviewsData.data || [];
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching reviews:', error);
    }
    return [];
  }
}

/**
 * Fetch recommended products
 */
export async function fetchRecommendedProducts(product: RecommendedProduct): Promise<RecommendedProduct[]> {
  try {
    const relatedIds = product.relatedProducts || [];
    let recommendedProductsQuery = '';

    if (relatedIds.length > 0) {
      recommendedProductsQuery = `relatedTo=${product._id}`;
    } else if (product.categoryIds && product.categoryIds.length > 0) {
      recommendedProductsQuery = `categoryId=${product.categoryIds[0]}&exclude=${product._id}`;
    }

    const recommendedRes = await fetch(`${API_URL}/products/light?${recommendedProductsQuery}&limit=6`);
    const recommendedData = recommendedRes.ok ? await recommendedRes.json() : { data: [] };
    return recommendedData.data || [];
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching recommended products:', error);
    }
    return [];
  }
}

/**
 * Fetch all categories
 */
export async function fetchAllCategories(): Promise<Category[]> {
  try {
    const allCategoriesRes = await fetch(`${API_URL}/categories`);
    return allCategoriesRes.ok ? await allCategoriesRes.json() : [];
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching all categories:', error);
    }
    return [];
  }
}

/**
 * Fetch active events and campaigns
 */
export async function fetchActivePromotions(): Promise<{ events: Event[], campaigns: Campaign[] }> {
  try {
    const [eventsRes, campaignsRes] = await Promise.all([
      fetch(`${API_URL}/events/active`),
      fetch(`${API_URL}/campaigns/active`)
    ]);

    const events = eventsRes.ok ? await eventsRes.json() : [];
    const campaigns = campaignsRes.ok ? await campaignsRes.json() : [];

    return { events, campaigns };
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching promotions:', error);
    }
    return { events: [], campaigns: [] };
  }
}

/**
 * Check user authentication and purchase status
 */
export async function checkUserStatus(token: string, productId: string): Promise<{
  isAuthenticated: boolean;
  hasPurchased: boolean;
  hasReviewed: boolean;
}> {
  if (!token) {
    return { isAuthenticated: false, hasPurchased: false, hasReviewed: false };
  }

  try {
    // Check token validity
    const verifyRes = await fetch(`${API_URL}/auth/verify`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!verifyRes.ok) {
      return { isAuthenticated: false, hasPurchased: false, hasReviewed: false };
    }

    // Check purchase and review status in parallel
    const [purchaseRes, reviewCheckRes] = await Promise.all([
      fetch(`${API_URL}/orders/check-purchased?productId=${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      }),
      fetch(`${API_URL}/reviews/check-reviewed?productId=${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
    ]);

    const hasPurchased = purchaseRes.ok ? (await purchaseRes.json()).purchased : false;
    const hasReviewed = reviewCheckRes.ok ? (await reviewCheckRes.json()).reviewed : false;

    return {
      isAuthenticated: true,
      hasPurchased,
      hasReviewed
    };
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error verifying authentication:', error);
    }
    return { isAuthenticated: false, hasPurchased: false, hasReviewed: false };
  }
}

/**
 * Apply promotions to product
 */
export function applyPromotionsToProduct(
  product: Product,
  events: Event[],
  campaigns: Campaign[]
): Product {
  // Create maps for better performance
  const promotionMap = new Map<string, { price: number; type: 'event' | 'campaign'; name: string; id?: string }>();
  const variantPromotionMap = new Map<string, { price: number; type: 'event' | 'campaign'; name: string; id?: string }>();
  const combinationPromotionMap = new Map<string, { price: number; type: 'event' | 'campaign'; name: string; id?: string }>();

  // Process events and campaigns
  [...events, ...campaigns].forEach((promotion) => {
    const isEvent = 'products' in promotion && events.includes(promotion as Event);
    const type = isEvent ? 'event' : 'campaign';

    promotion.products.forEach((productInPromotion) => {
      const productIdStr = productInPromotion.productId.toString();
      if (productIdStr === product._id.toString()) {
        // Apply product-level promotion
        const currentPromotion = promotionMap.get(productIdStr);
        if (!currentPromotion || productInPromotion.adjustedPrice < currentPromotion.price) {
          promotionMap.set(productIdStr, {
            price: productInPromotion.adjustedPrice,
            type,
            name: promotion.title,
            id: promotion._id?.toString() || ''
          });
        }

        // Apply variant-level promotions
        if (productInPromotion.variants) {
          productInPromotion.variants.forEach((variantInPromotion) => {
            if (variantInPromotion.variantId) {
              const variantKey = `${productIdStr}_${variantInPromotion.variantId}`;
              const currentVariantPromotion = variantPromotionMap.get(variantKey);

              if (!currentVariantPromotion || variantInPromotion.adjustedPrice < currentVariantPromotion.price) {
                variantPromotionMap.set(variantKey, {
                  price: variantInPromotion.adjustedPrice,
                  type,
                  name: promotion.title,
                  id: promotion._id?.toString() || ''
                });
              }

              // Apply combination-level promotions
              if (variantInPromotion.combinations) {
                variantInPromotion.combinations.forEach((combinationInPromotion) => {
                  if (combinationInPromotion.combinationId) {
                    const combinationKey = `${productIdStr}_${variantInPromotion.variantId}_${combinationInPromotion.combinationId}`;
                    const currentCombinationPromotion = combinationPromotionMap.get(combinationKey);

                    if (!currentCombinationPromotion || combinationInPromotion.adjustedPrice < currentCombinationPromotion.price) {
                      combinationPromotionMap.set(combinationKey, {
                        price: combinationInPromotion.adjustedPrice,
                        type,
                        name: promotion.title,
                        id: promotion._id?.toString() || ''
                      });
                    }
                  }
                });
              }
            }
          });
        }
      }
    });
  });

  // Apply promotions to product
  const productIdStr = product._id.toString();
  const promotion = promotionMap.get(productIdStr);

  if (promotion && promotion.price < product.currentPrice) {
    product.currentPrice = promotion.price;
    product.promotion = {
      type: promotion.type,
      id: promotion.id || '',
      name: promotion.name,
      adjustedPrice: promotion.price
    };
  }

  // Apply promotions to variants
  if (product.variants && product.variants.length > 0) {
    product.variants = product.variants.map((variant: VariantWithPromotion) => {
      if (variant.variantId) {
        const variantKey = `${productIdStr}_${variant.variantId}`;
        const variantPromotion = variantPromotionMap.get(variantKey);

        if (variantPromotion && (!variant.price || variantPromotion.price < variant.price)) {
          variant.promotionPrice = variantPromotion.price;
          variant.promotion = {
            type: variantPromotion.type,
            id: variantPromotion.id || '',
            name: variantPromotion.name,
            adjustedPrice: variantPromotion.price
          };
        }

        // Apply promotions to combinations
        if (variant.combinations && variant.combinations.length > 0) {
          variant.combinations = variant.combinations.map((combination: VariantCombination) => {
            if (combination.combinationId) {
              const combinationKey = `${productIdStr}_${variant.variantId}_${combination.combinationId}`;
              const combinationPromotion = combinationPromotionMap.get(combinationKey);

              if (combinationPromotion && (!combination.price || combinationPromotion.price < combination.price)) {
                combination.promotionPrice = combinationPromotion.price;
                combination.promotion = {
                  type: combinationPromotion.type,
                  id: combinationPromotion.id || '',
                  name: combinationPromotion.name,
                  adjustedPrice: combinationPromotion.price
                };
              }
            }
            return combination;
          });
        }
      }
      return variant;
    });
  }

  return product;
}
