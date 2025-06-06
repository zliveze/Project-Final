import { useState, useEffect, useCallback, useRef } from 'react';
import { ProductStatus } from '../components/ProductStatusBadge';
import { ProductFilterState } from '../components/ProductFilter';
import { useProduct } from '@/contexts/ProductContext';

// Thêm interface cho mục cache
interface CacheItem {
  key: string;
  data: unknown;
  timestamp: number;
}

// Interface for the structure of data stored in cache
interface CachedProductPageData {
  products: Product[]; // UI Model Products
  total: number;
  page: number;
  limit: number;
}

// Interface for product data coming from the API (before mapping to UI Product)
interface ApiProduct {
  _id: string; // Assuming API uses _id
  name: string;
  sku: string;
  images?: { url: string; isPrimary?: boolean; publicId?: string; alt?: string }[]; // More complete image type
  imageUrl?: string; // Fallback
  price: number;
  currentPrice?: number;
  categoryIds?: string[];
  brandId?: string;
  brandName?: string; // If API provides it
  inventory?: { branchId: string; quantity: number; branchName?: string }[];
  status?: ProductStatus; // Make optional as it might not always be present or could be defaulted
  flags?: Partial<ProductFlag>; // Flags might be partial
  createdAt?: string | Date;
  updatedAt?: string | Date;
  // Add any other fields that are accessed from `product` in the mapping function
  // For example, if the context `apiProducts` directly contains `category` (string) or `brand` (string)
  // those should be included here if they are used before mapping.
  // Based on current mapping:
  // category: string; // This is derived, not directly from apiProduct in mapping
  // brand: string; // This is derived or from brandName
}


export interface ProductFlag {
  isBestSeller: boolean;
  isNew: boolean;
  isOnSale: boolean;
  hasGifts: boolean;
}

export interface ProductInventory {
  branchId: string;
  branchName: string;
  quantity: number;
}

export interface Product { // This is the UI Model
  id: string;
  name: string;
  sku: string;
  image: string;
  price: string;
  originalPrice: number;
  currentPrice: number;
  category: string;
  categoryIds: string[];
  brand: string;
  brandId: string;
  inventory: ProductInventory[];
  stock: number;
  status: ProductStatus;
  flags: ProductFlag;
  createdAt: string;
  updatedAt: string;
}

export interface UseProductTableResult {
  products: Product[];
  filteredProducts: Product[];
  isLoading: boolean;
  selectedProducts: string[];
  expandedProduct: string | null;
  totalItems: number;
  totalActive: number;
  totalOutOfStock: number;
  totalDiscontinued: number;
  currentPage: number;
  itemsPerPage: number;
  toggleProductSelection: (id: string) => void;
  toggleSelectAll: () => void;
  toggleProductDetails: (id: string) => void;
  applyFilter: (filter: ProductFilterState) => void;
  setPage: (page: number) => void;
  setItemsPerPage: (perPage: number) => void;
  clearSelectedProducts: () => void;
  fetchProducts: () => void;
  isAllSelected: boolean;
  filter: ProductFilterState;
  bulkSetStatus: (status: ProductStatus) => Promise<boolean>;
  bulkSetFlag: (flag: string, value: boolean) => Promise<boolean>;
  bulkDelete: () => Promise<boolean>;
}

// Mock data - these should ideally come from context or props if dynamic
export function getCategories() {
  return [
    { id: '1', name: 'Chăm sóc da' },
    { id: '2', name: 'Trang điểm' },
    { id: '6', name: 'Mặt nạ' },
    { id: '7', name: 'Chống nắng' }
  ];
}

export function getBrands() {
  return [
    { id: '1', name: 'Yumin' },
    { id: '2', name: 'Clinique' },
    { id: '3', name: 'Innisfree' },
    { id: '4', name: 'The Ordinary' }
  ];
}

const getCategoryNameFromList = (categoryId: string): string => {
  const categories = getCategories(); // Using the mock for now
  const category = categories.find(c => c.id === categoryId);
  return category ? category.name : 'Chưa phân loại';
};

const getBrandNameFromList = (brandId: string): string => {
  const brands = getBrands(); // Using the mock for now
  const brand = brands.find(b => b.id === brandId);
  return brand ? brand.name : 'Không có thương hiệu';
};

const getBranchNameDefault = (branchId: string): string => {
  return `Chi nhánh ${branchId.slice(0, 5)}`;
};


export function useProductTable(): UseProductTableResult {
  const {
    products: contextApiProducts, // Renamed to avoid confusion with local `products`
    loading: contextLoading, // Renamed to avoid confusion
    totalProducts: contextTotalProducts, // Renamed
    fetchLightProducts, // This is the function from context
    updateProduct,
    updateProductFlags,
    deleteProduct: deleteProductApi,
    statistics
  } = useProduct();

  const [products, setProducts] = useState<Product[]>([]); // UI Model products
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(20);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [filter, setFilter] = useState<ProductFilterState>({
    searchTerm: '',
    categories: [],
    brands: [],
    flags: {}
  });
  const [localTotalProducts, setLocalTotalProducts] = useState<number>(0);

  const cacheRef = useRef<CacheItem[]>([]);
  const CACHE_EXPIRY = 5 * 60 * 1000;

  const mapApiProductsToUiModel = useCallback((productsToMap: ApiProduct[]): Product[] => {
    return productsToMap.map(apiProd => {
      let imageUrl = '';
      if (apiProd.images && Array.isArray(apiProd.images) && apiProd.images.length > 0) {
        const primaryImage = apiProd.images.find(img => img.isPrimary);
        imageUrl = primaryImage ? primaryImage.url : apiProd.images[0].url;
      } else if (apiProd.imageUrl) {
        imageUrl = apiProd.imageUrl;
      }

      const formatPrice = (price: number): string => {
        return price.toLocaleString('vi-VN') + 'đ';
      };

      const stock = (apiProd.inventory || []).reduce((total, inv) => total + inv.quantity, 0);

      return {
        id: apiProd._id,
        name: apiProd.name || 'N/A',
        sku: apiProd.sku || 'N/A',
        image: imageUrl || '/images/product-placeholder.jpg',
        price: formatPrice(apiProd.price || 0),
        originalPrice: apiProd.price || 0,
        currentPrice: apiProd.currentPrice || apiProd.price || 0,
        category: apiProd.categoryIds && apiProd.categoryIds.length > 0 ? getCategoryNameFromList(apiProd.categoryIds[0]) : 'Chưa phân loại',
        categoryIds: apiProd.categoryIds || [],
        brand: apiProd.brandName || getBrandNameFromList(apiProd.brandId || ''),
        brandId: apiProd.brandId || '',
        inventory: (apiProd.inventory || []).map(inv => ({
          branchId: inv.branchId,
          branchName: inv.branchName || getBranchNameDefault(inv.branchId),
          quantity: inv.quantity
        })),
        stock,
        status: (apiProd.status || 'active') as ProductStatus,
        flags: {
          isBestSeller: apiProd.flags?.isBestSeller === true,
          isNew: apiProd.flags?.isNew === true,
          isOnSale: apiProd.flags?.isOnSale === true,
          hasGifts: apiProd.flags?.hasGifts === true
        },
        createdAt: apiProd.createdAt?.toString() || '',
        updatedAt: apiProd.updatedAt?.toString() || ''
      };
    });
  }, []); // Assuming getCategoryNameFromList, getBrandNameFromList are stable

  const getCachedResult = useCallback((): CachedProductPageData | null => {
    const apiFiltersKeyPart = { 
        page: currentPage, limit: itemsPerPage, search: filter.searchTerm, 
        categoryId: filter.categories.join(','), brandId: filter.brands.join(','), 
        status: filter.status, ...filter.flags 
    };
    const cacheKey = JSON.stringify(apiFiltersKeyPart);
    const now = Date.now();
    const cachedItem = cacheRef.current.find(item => item.key === cacheKey);

    if (cachedItem && (now - cachedItem.timestamp < CACHE_EXPIRY)) {
      return cachedItem.data as CachedProductPageData;
    }
    return null;
  }, [currentPage, itemsPerPage, filter, CACHE_EXPIRY]);


  const updateCache = useCallback((dataToCache: CachedProductPageData) => {
    const apiFiltersKeyPart = { 
        page: currentPage, limit: itemsPerPage, search: filter.searchTerm, 
        categoryId: filter.categories.join(','), brandId: filter.brands.join(','), 
        status: filter.status, ...filter.flags 
    };
    const cacheKey = JSON.stringify(apiFiltersKeyPart);
    
    cacheRef.current = cacheRef.current.filter(item => item.key !== cacheKey);
    cacheRef.current.push({
      key: cacheKey,
      data: dataToCache,
      timestamp: Date.now()
    });
    if (cacheRef.current.length > 10) {
      cacheRef.current.shift();
    }
  }, [currentPage, itemsPerPage, filter]);

  const clearCache = useCallback(() => {
    cacheRef.current = [];
  }, []);

  const isMountedRef = useRef(false);
  const initialFetchDoneRef = useRef(false);


  const localFetchProductsLight = useCallback(() => {
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    const currentTime = Date.now();
    const apiFilters: Record<string, string | number | boolean> = { page: currentPage, limit: itemsPerPage };
    if (filter.searchTerm) apiFilters.search = filter.searchTerm;
    if (filter.categories.length) apiFilters.categoryId = filter.categories.join(',');
    if (filter.brands.length) apiFilters.brandId = filter.brands.join(',');
    if (filter.status) apiFilters.status = filter.status;
    if (filter.flags.isBestSeller) apiFilters.isBestSeller = true;
    if (filter.flags.isNew) apiFilters.isNew = true;
    if (filter.flags.isOnSale) apiFilters.isOnSale = true;
    if (filter.flags.hasGifts) apiFilters.hasGifts = true;

    const cachedPageData = getCachedResult(); 
    if (cachedPageData) {
      setProducts(cachedPageData.products);
      setFilteredProducts(cachedPageData.products);
      setLocalTotalProducts(cachedPageData.total);
      // setCurrentPage(cachedPageData.page); // Not needed, page is part of cache key
      // setItemsPerPage(cachedPageData.limit); // Not needed, limit is part of cache key
      setIsLoading(false);
      return;
    }

    fetchTimeoutRef.current = setTimeout(async () => {
      if (isMountedRef.current && currentTime - lastFetchTime < 200) {
        setIsLoading(false);
        return;
      }
      if (isMountedRef.current && contextLoading) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setLastFetchTime(currentTime);

      try {
        await fetchLightProducts(
          apiFilters.page as number,
          apiFilters.limit as number,
          apiFilters.search as string | undefined,
          apiFilters.brandId as string | undefined,
          apiFilters.categoryId as string | undefined,
          apiFilters.status as string | undefined,
          undefined, undefined, undefined, undefined, undefined,
          apiFilters.isBestSeller as boolean | undefined,
          apiFilters.isNew as boolean | undefined,
          apiFilters.isOnSale as boolean | undefined,
          apiFilters.hasGifts as boolean | undefined
        );
      } catch (error) {
        console.error("Error in localFetchProductsLight calling context.fetchLightProducts:", error);
      } finally {
        setIsLoading(false);
      }
    }, 200);
  }, [
    currentPage, itemsPerPage, filter, contextLoading, lastFetchTime, 
    fetchLightProducts, 
    getCachedResult, 
  ]);


  useEffect(() => {
    if (contextApiProducts) {
      const mappedUiProducts = mapApiProductsToUiModel(contextApiProducts as ApiProduct[]);
      setProducts(mappedUiProducts);
      setFilteredProducts(mappedUiProducts);
      setLocalTotalProducts(contextTotalProducts || 0);

      if (mappedUiProducts.length > 0 && !getCachedResult()) { 
         updateCache({
            products: mappedUiProducts,
            total: contextTotalProducts || 0,
            page: currentPage, 
            limit: itemsPerPage 
        });
      }
    } else {
      setProducts([]);
      setFilteredProducts([]);
      setLocalTotalProducts(0);
    }
  }, [contextApiProducts, contextTotalProducts, mapApiProductsToUiModel, updateCache, getCachedResult, currentPage, itemsPerPage]);


  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      initialFetchDoneRef.current = true; 
      localFetchProductsLight();
    }
  }, [localFetchProductsLight]);
  
  useEffect(() => {
    if (initialFetchDoneRef.current) { 
        localFetchProductsLight();
    }
  }, [filter, currentPage, itemsPerPage, localFetchProductsLight]);


  const clearSelectedProducts = useCallback(() => {
    setSelectedProducts([]);
  }, []);

  const bulkSetStatus = useCallback(async (status: ProductStatus) => {
    setIsLoading(true);
    try {
      for (const id of selectedProducts) {
        await updateProduct(id, { status });
      }
      clearCache();
      localFetchProductsLight();
      clearSelectedProducts();
      return true;
    } catch (error) {
      console.error('Error bulk updating status:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [selectedProducts, updateProduct, localFetchProductsLight, clearSelectedProducts, clearCache]);

  const bulkSetFlag = useCallback(async (flag: string, value: boolean) => {
    setIsLoading(true);
    try {
      for (const id of selectedProducts) {
        await updateProductFlags(id, { [flag]: value });
      }
      clearCache();
      localFetchProductsLight();
      clearSelectedProducts();
      return true;
    } catch (error) {
      console.error('Error bulk updating flags:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [selectedProducts, updateProductFlags, localFetchProductsLight, clearSelectedProducts, clearCache]);

  const bulkDelete = useCallback(async () => {
    setIsLoading(true);
    try {
      for (const id of selectedProducts) {
        await deleteProductApi(id);
      }
      clearCache();
      localFetchProductsLight();
      clearSelectedProducts();
      return true;
    } catch (error) {
      console.error('Error bulk deleting products:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [selectedProducts, deleteProductApi, localFetchProductsLight, clearSelectedProducts, clearCache]);

  const toggleProductSelection = useCallback((id: string) => {
    setSelectedProducts(prev => 
      prev.includes(id) ? prev.filter(productId => productId !== id) : [...prev, id]
    );
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedProducts.length === filteredProducts.length && filteredProducts.length > 0) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(p => p.id));
    }
  }, [filteredProducts, selectedProducts]);

  const toggleProductDetails = useCallback((id: string) => {
    setExpandedProduct(prev => (prev === id ? null : id));
  }, []);

  const applyFilter = useCallback((newFilter: ProductFilterState) => {
    setFilter(newFilter);
    setCurrentPage(1); 
  }, []);

  const setPage = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const setPerPage = useCallback((perPage: number) => {
    setItemsPerPage(perPage);
    setCurrentPage(1);
  }, []);
  
  const refreshProducts = useCallback(() => {
    clearCache();
    localFetchProductsLight();
  }, [localFetchProductsLight, clearCache]);

  return {
    products,
    filteredProducts,
    isLoading: isLoading || contextLoading, 
    selectedProducts,
    expandedProduct,
    totalItems: contextTotalProducts || localTotalProducts || 0,
    totalActive: statistics?.active || 0,
    totalOutOfStock: statistics?.outOfStock || 0,
    totalDiscontinued: statistics?.discontinued || 0,
    currentPage,
    itemsPerPage,
    toggleProductSelection,
    toggleSelectAll,
    toggleProductDetails,
    applyFilter,
    setPage,
    setItemsPerPage: setPerPage,
    clearSelectedProducts,
    fetchProducts: refreshProducts,
    isAllSelected: filteredProducts.length > 0 && selectedProducts.length === filteredProducts.length,
    filter,
    bulkSetStatus,
    bulkSetFlag,
    bulkDelete
  };
}
