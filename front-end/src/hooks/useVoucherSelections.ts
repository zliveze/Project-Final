import { useBrands, Brand } from '@/contexts/BrandContext';
import { useCategory, Category } from '@/contexts/CategoryContext';
import { useProduct, Product } from '@/contexts/ProductContext';
import { useCampaign, Campaign } from '@/contexts/CampaignContext';

// Local type definitions for Brand, Category, Product, and FetchResponse are removed.
// We will use the imported types directly from contexts.

export interface UseVoucherSelectionsResult {
  brands: Brand[]; // Uses imported Brand
  categories: Category[]; // Uses imported Category
  products: Product[]; // Uses imported Product
  campaigns: Campaign[]; // Uses imported Campaign
  brandsLoading: boolean;
  categoriesLoading: boolean;
  productsLoading: boolean;
  campaignsLoading: boolean;
  brandsError: string | null;
  categoriesError: string | null;
  productsError: string | null;
  campaignsError: string | null;
  // Explicitly define fetch function signatures to match contexts
  fetchBrands: (page: number, limit: number, filters?: Record<string, unknown> | undefined) => Promise<{ items: Brand[]; page: number; limit: number; total: number; totalPages: number; } | undefined>;
  fetchCategories: (page?: number | undefined, limit?: number | undefined, search?: string | undefined, parentId?: string | undefined, status?: string | undefined, featured?: boolean | undefined, level?: number | undefined, sort?: string | undefined) => Promise<void>;
  fetchProducts: (page?: number | undefined, limit?: number | undefined, search?: string | undefined, brandId?: string | undefined, categoryId?: string | undefined, status?: string | undefined, minPrice?: number | undefined, maxPrice?: number | undefined, tags?: string | undefined, skinTypes?: string | undefined, concerns?: string | undefined, isBestSeller?: boolean | undefined, isNew?: boolean | undefined, isOnSale?: boolean | undefined, hasGifts?: boolean | undefined, sortBy?: string | undefined, sortOrder?: "asc" | "desc" | undefined) => Promise<void>;
  fetchCampaigns: (page?: number | undefined, limit?: number | undefined, search?: string | undefined, type?: string | undefined, startDateFrom?: Date | undefined, startDateTo?: Date | undefined, endDateFrom?: Date | undefined, endDateTo?: Date | undefined) => Promise<Campaign[] | null | undefined>;
}

export const useVoucherSelections = (): UseVoucherSelectionsResult => {
  const brandContext = useBrands();
  const categoryContext = useCategory();
  const productContext = useProduct();
  const campaignContext = useCampaign();

  // Ensure the returned object matches the UseVoucherSelectionsResult interface
  // Type casting might be needed if direct assignment causes issues due to complex inferred types,
  // but ideally, direct assignment should work if context types are correctly exported and used.
  return {
    brands: brandContext.brands || [],
    categories: categoryContext.categories || [],
    products: productContext.products || [],
    campaigns: campaignContext.campaigns || [],
    brandsLoading: brandContext.loading || false,
    categoriesLoading: categoryContext.loading || false,
    productsLoading: productContext.loading || false,
    campaignsLoading: campaignContext.isLoading || false,
    brandsError: brandContext.error || null,
    categoriesError: categoryContext.error || null,
    productsError: productContext.error || null,
    campaignsError: campaignContext.error || null,
    fetchBrands: brandContext.fetchBrands,
    fetchCategories: categoryContext.fetchCategories,
    fetchProducts: productContext.fetchProducts,
    fetchCampaigns: campaignContext.fetchCampaigns || (async () => { 
      console.warn('fetchCampaigns called but CampaignContext seems unavailable or fetchCampaigns is not defined.'); 
      return undefined; 
    }),
  };
};
