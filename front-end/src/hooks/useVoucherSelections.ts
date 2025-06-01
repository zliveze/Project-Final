// useCallback removed as it's not used
import { useBrands } from '@/contexts/BrandContext';
import { useCategory } from '@/contexts/CategoryContext';
import { useProduct } from '@/contexts/ProductContext';
import { useCampaign, Campaign } from '@/contexts/CampaignContext';

// Define proper types to replace 'any'
interface Brand {
  _id: string;
  name: string;
  slug: string;
  [key: string]: unknown;
}

interface Category {
  _id: string;
  name: string;
  slug: string;
  [key: string]: unknown;
}

interface Product {
  _id: string;
  name: string;
  slug: string;
  [key: string]: unknown;
}

interface FetchResponse<T> {
  data: T[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  [key: string]: unknown;
}

export interface UseVoucherSelectionsResult {
  brands: Brand[];
  categories: Category[];
  products: Product[];
  campaigns: Campaign[];
  brandsLoading: boolean;
  categoriesLoading: boolean;
  productsLoading: boolean;
  campaignsLoading: boolean;
  brandsError: string | null;
  categoriesError: string | null;
  productsError: string | null;
  campaignsError: string | null;
  fetchBrands: (page: number, limit: number) => Promise<FetchResponse<Brand>>;
  fetchCategories: (page: number, limit: number) => Promise<FetchResponse<Category>>;
  fetchProducts: (page: number, limit: number, search?: string) => Promise<FetchResponse<Product>>;
  fetchCampaigns: (page: number, limit: number) => Promise<FetchResponse<Campaign>>;
}

export const useVoucherSelections = (): UseVoucherSelectionsResult => {
  const brandContext = useBrands();
  const categoryContext = useCategory();
  const productContext = useProduct();
  const campaignContext = useCampaign();

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
    fetchCampaigns: campaignContext.fetchCampaigns
  };
};
