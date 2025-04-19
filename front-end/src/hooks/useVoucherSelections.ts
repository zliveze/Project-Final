import { useCallback } from 'react';
import { useBrands } from '@/contexts/BrandContext';
import { useCategory } from '@/contexts/CategoryContext';
import { useProduct } from '@/contexts/ProductContext';
import { useCampaign, Campaign } from '@/contexts/CampaignContext';

export interface UseVoucherSelectionsResult {
  brands: any[];
  categories: any[];
  products: any[];
  campaigns: Campaign[];
  brandsLoading: boolean;
  categoriesLoading: boolean;
  productsLoading: boolean;
  campaignsLoading: boolean;
  brandsError: string | null;
  categoriesError: string | null;
  productsError: string | null;
  campaignsError: string | null;
  fetchBrands: (page: number, limit: number) => Promise<any>;
  fetchCategories: (page: number, limit: number) => Promise<any>;
  fetchProducts: (page: number, limit: number, search?: string) => Promise<any>;
  fetchCampaigns: (page: number, limit: number) => Promise<any>;
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
