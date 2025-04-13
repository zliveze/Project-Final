import { useState, useEffect, useCallback, useRef } from 'react';
import { ProductStatus } from '../components/ProductStatusBadge';
import { ProductFilterState } from '../components/ProductFilter';
import { useProduct } from '@/contexts/ProductContext';

// Thêm interface cho mục cache
interface CacheItem {
  key: string;
  data: any;
  timestamp: number;
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

export interface Product {
  id: string;
  name: string;
  sku: string;
  image: string;
  price: string; // giá gốc format string
  originalPrice: number; // giá gốc số
  currentPrice: number; // giá hiện tại sau giảm giá
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
  // Các hàm thao tác
  toggleProductSelection: (id: string) => void;
  toggleSelectAll: () => void;
  toggleProductDetails: (id: string) => void;
  applyFilter: (filter: ProductFilterState) => void;
  setPage: (page: number) => void;
  setItemsPerPage: (perPage: number) => void;
  clearSelectedProducts: () => void;
  fetchProducts: () => void;
  isAllSelected: boolean;
  // Thông tin filter
  filter: ProductFilterState;
  bulkSetStatus: (status: ProductStatus) => Promise<boolean>;
  bulkSetFlag: (flag: string, value: boolean) => Promise<boolean>;
  bulkDelete: () => Promise<boolean>;
}

// Mock data lấy các danh mục
export function getCategories() {
  return [
    { id: '1', name: 'Chăm sóc da' },
    { id: '2', name: 'Trang điểm' },
    { id: '6', name: 'Mặt nạ' },
    { id: '7', name: 'Chống nắng' }
  ];
}

// Không còn sử dụng mock data cho brands nữa
// Thay vào đó, sẽ sử dụng BrandContext để lấy dữ liệu thực từ API
export function getBrands() {
  // Hàm này vẫn được giữ lại để tương thích với code hiện tại
  // Nhưng nên sử dụng useBrands() hook từ BrandContext để lấy dữ liệu thực
  return [
    { id: '1', name: 'Yumin' },
    { id: '2', name: 'Clinique' },
    { id: '3', name: 'Innisfree' },
    { id: '4', name: 'The Ordinary' }
  ];
}

// Dữ liệu mẫu nếu cần thêm sản phẩm - đã cập nhật để phù hợp với interface Product
export const sampleProductData: Product[] = [
  {
    id: 'PRD-001',
    name: 'Kem dưỡng ẩm Yumin',
    sku: 'SKU-001',
    image: 'https://via.placeholder.com/50',
    price: '350,000đ',
    originalPrice: 350000,
    currentPrice: 350000,
    category: 'Chăm sóc da',
    categoryIds: ['1'],
    brand: 'Yumin',
    brandId: '1',
    inventory: [
      { branchId: '1', branchName: 'Chi nhánh Hà Nội', quantity: 25 },
      { branchId: '2', branchName: 'Chi nhánh Hồ Chí Minh', quantity: 15 },
      { branchId: '3', branchName: 'Chi nhánh Đà Nẵng', quantity: 5 }
    ],
    stock: 45,
    status: 'active',
    flags: {
      isBestSeller: true,
      isNew: false,
      isOnSale: false,
      hasGifts: false
    },
    createdAt: '2023-08-15T10:00:00Z',
    updatedAt: '2023-09-10T15:30:00Z'
  },
  {
    id: 'PRD-002',
    name: 'Sữa rửa mặt Yumin',
    sku: 'SKU-002',
    image: 'https://via.placeholder.com/50',
    price: '250,000đ',
    originalPrice: 250000,
    currentPrice: 250000,
    category: 'Chăm sóc da',
    categoryIds: ['1'],
    brand: 'Yumin',
    brandId: '1',
    inventory: [
      { branchId: '1', branchName: 'Chi nhánh Hà Nội', quantity: 12 },
      { branchId: '2', branchName: 'Chi nhánh Hồ Chí Minh', quantity: 20 },
      { branchId: '3', branchName: 'Chi nhánh Đà Nẵng', quantity: 0 }
    ],
    stock: 32,
    status: 'active',
    flags: {
      isBestSeller: false,
      isNew: true,
      isOnSale: false,
      hasGifts: false
    },
    createdAt: '2023-07-20T10:00:00Z',
    updatedAt: '2023-08-15T15:30:00Z'
  },
  {
    id: 'PRD-003',
    name: 'Serum Vitamin C Yumin',
    sku: 'SKU-003',
    image: 'https://via.placeholder.com/50',
    price: '450,000đ',
    originalPrice: 450000,
    currentPrice: 380000,
    category: 'Chăm sóc da',
    categoryIds: ['1'],
    brand: 'Yumin',
    brandId: '1',
    inventory: [
      { branchId: '1', branchName: 'Chi nhánh Hà Nội', quantity: 8 },
      { branchId: '2', branchName: 'Chi nhánh Hồ Chí Minh', quantity: 10 },
      { branchId: '3', branchName: 'Chi nhánh Đà Nẵng', quantity: 0 }
    ],
    stock: 18,
    status: 'active',
    flags: {
      isBestSeller: true,
      isNew: false,
      isOnSale: true,
      hasGifts: true
    },
    createdAt: '2023-06-10T10:00:00Z',
    updatedAt: '2023-07-20T15:30:00Z'
  },
  {
    id: 'PRD-004',
    name: 'Mặt nạ dưỡng ẩm Yumin',
    sku: 'SKU-004',
    image: 'https://via.placeholder.com/50',
    price: '50,000đ',
    originalPrice: 50000,
    currentPrice: 50000,
    category: 'Mặt nạ',
    categoryIds: ['1', '6'],
    brand: 'Yumin',
    brandId: '1',
    inventory: [
      { branchId: '1', branchName: 'Chi nhánh Hà Nội', quantity: 0 },
      { branchId: '2', branchName: 'Chi nhánh Hồ Chí Minh', quantity: 0 },
      { branchId: '3', branchName: 'Chi nhánh Đà Nẵng', quantity: 0 }
    ],
    stock: 0,
    status: 'out_of_stock',
    flags: {
      isBestSeller: false,
      isNew: false,
      isOnSale: false,
      hasGifts: false
    },
    createdAt: '2023-05-05T10:00:00Z',
    updatedAt: '2023-06-15T15:30:00Z'
  },
  {
    id: 'PRD-005',
    name: 'Kem chống nắng Yumin SPF50',
    sku: 'SKU-005',
    image: 'https://via.placeholder.com/50',
    price: '320,000đ',
    originalPrice: 320000,
    currentPrice: 280000,
    category: 'Chống nắng',
    categoryIds: ['1', '7'],
    brand: 'Yumin',
    brandId: '1',
    inventory: [
      { branchId: '1', branchName: 'Chi nhánh Hà Nội', quantity: 7 },
      { branchId: '2', branchName: 'Chi nhánh Hồ Chí Minh', quantity: 15 },
      { branchId: '3', branchName: 'Chi nhánh Đà Nẵng', quantity: 5 }
    ],
    stock: 27,
    status: 'active',
    flags: {
      isBestSeller: false,
      isNew: true,
      isOnSale: true,
      hasGifts: false
    },
    createdAt: '2023-04-01T10:00:00Z',
    updatedAt: '2023-05-10T15:30:00Z'
  },
  {
    id: 'PRD-006',
    name: 'Son môi Yumin màu đỏ',
    sku: 'SKU-006',
    image: 'https://via.placeholder.com/50',
    price: '180,000đ',
    originalPrice: 180000,
    currentPrice: 180000,
    category: 'Trang điểm',
    categoryIds: ['2'],
    brand: 'Yumin',
    brandId: '1',
    inventory: [
      { branchId: '1', branchName: 'Chi nhánh Hà Nội', quantity: 0 },
      { branchId: '2', branchName: 'Chi nhánh Hồ Chí Minh', quantity: 0 },
      { branchId: '3', branchName: 'Chi nhánh Đà Nẵng', quantity: 0 }
    ],
    stock: 0,
    status: 'discontinued',
    flags: {
      isBestSeller: false,
      isNew: false,
      isOnSale: false,
      hasGifts: false
    },
    createdAt: '2023-03-01T10:00:00Z',
    updatedAt: '2023-04-10T15:30:00Z'
  },
  {
    id: 'PRD-007',
    name: 'Son môi Yumin màu hồng',
    sku: 'SKU-007',
    image: 'https://via.placeholder.com/50',
    price: '180,000đ',
    originalPrice: 180000,
    currentPrice: 180000,
    category: 'Trang điểm',
    categoryIds: ['2'],
    brand: 'Yumin',
    brandId: '1',
    inventory: [
      { branchId: '1', branchName: 'Chi nhánh Hà Nội', quantity: 0 },
      { branchId: '2', branchName: 'Chi nhánh Hồ Chí Minh', quantity: 0 },
      { branchId: '3', branchName: 'Chi nhánh Đà Nẵng', quantity: 0 }
    ],
    stock: 0,
    status: 'discontinued',
    flags: {
      isBestSeller: false,
      isNew: false,
      isOnSale: false,
      hasGifts: false
    },
    createdAt: '2023-03-01T10:00:00Z',
    updatedAt: '2023-04-10T15:30:00Z'
  },

];

// Helper functions for getting names
const getCategoryName = (categoryId: string): string => {
  const categories = getCategories();
  const category = categories.find(c => c.id === categoryId);
  return category ? category.name : 'Chưa phân loại';
};

const getBrandName = (brandId: string): string => {
  // Lưu ý: Hàm này không thể sử dụng useBrands hook trực tiếp vì nó nằm ngoài component
  // Thay vào đó, chúng ta sẽ dựa vào dữ liệu brandName được trả về từ API
  // hoặc sử dụng giá trị mặc định nếu không có
  return 'Không có thương hiệu';
};

const getBranchName = (branchId: string): string => {
  // Ở đây có thể thêm logic lấy tên chi nhánh từ context
  return `Chi nhánh ${branchId.slice(0, 5)}`;
};

export function useProductTable(): UseProductTableResult {
  // Use the ProductContext - only extract what we need
  const {
    products: apiProducts,
    // Removed unused variable: fetchProducts (fetchContextProducts)
    fetchStatistics,
    loading,
    totalProducts,
    // Removed unused variables: totalPages, apiCurrentPage, apiLimit
    fetchLightProducts,
    updateProduct,
    updateProductFlags,
    deleteProduct: deleteProductApi,
    statistics
  } = useProduct();

  // Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(20);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const [fetchTimeout, setFetchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [filter, setFilter] = useState<ProductFilterState>({
    searchTerm: '',
    categories: [],
    brands: [],
    flags: {}
  });
  // Thêm state để lưu tổng số sản phẩm
  const [localTotalProducts, setTotalProducts] = useState<number>(0);

  // Thêm cache để lưu trữ kết quả trước đó
  const cacheRef = useRef<CacheItem[]>([]);
  const CACHE_EXPIRY = 5 * 60 * 1000; // 5 phút

  // Hàm kiểm tra cache
  const getCachedResult = (cacheKey: string) => {
    const now = Date.now();
    const cachedItem = cacheRef.current.find(item => item.key === cacheKey);

    if (cachedItem && (now - cachedItem.timestamp < CACHE_EXPIRY)) {
      console.log('Sử dụng kết quả từ cache');
      return cachedItem.data;
    }

    return null;
  };

  // Hàm cập nhật cache
  const updateCache = (cacheKey: string, data: any) => {
    // Xóa cache cũ với cùng key nếu có
    cacheRef.current = cacheRef.current.filter(item => item.key !== cacheKey);

    // Thêm dữ liệu mới vào cache
    cacheRef.current.push({
      key: cacheKey,
      data,
      timestamp: Date.now()
    });

    // Giới hạn kích thước cache
    if (cacheRef.current.length > 10) {
      cacheRef.current.shift();
    }
  };

  // Hàm xóa cache
  const clearCache = () => {
    cacheRef.current = [];
  };

  // Sử dụng refs để theo dõi thay đổi thực sự
  const initialFetchDoneRef = useRef(false);
  const isMountedRef = useRef(false);

  // Hàm xóa tất cả sản phẩm đã chọn
  const clearSelectedProducts = useCallback(() => {
    setSelectedProducts([]);
  }, []);

  // Note: We previously had a fetchProductsWithDebounce function here,
  // but it has been replaced by the more efficient fetchProductsLight function

  // Optimized fetch method using Light API
  const fetchProductsLight = useCallback(() => {
    // Cancel previous timeout if exists
    if (fetchTimeout) {
      clearTimeout(fetchTimeout);
      setFetchTimeout(null);
    }

    const currentTime = Date.now();

    // Create optimized filters for API request
    const apiFilters: any = {
      page: currentPage,
      limit: itemsPerPage
    };

    // Only add filters that have values to reduce query complexity
    if (filter.searchTerm) apiFilters.search = filter.searchTerm;

    if (filter.categories.length) {
      apiFilters.categoryId = filter.categories.join(',');
    }

    if (filter.brands.length) {
      apiFilters.brandId = filter.brands.join(',');
    }

    if (filter.status) apiFilters.status = filter.status;

    // Only add flag filters if they're explicitly set to true
    if (filter.flags.isBestSeller === true) apiFilters.isBestSeller = true;
    if (filter.flags.isNew === true) apiFilters.isNew = true;
    if (filter.flags.isOnSale === true) apiFilters.isOnSale = true;
    if (filter.flags.hasGifts === true) apiFilters.hasGifts = true;

    // Create cache key
    const cacheKey = JSON.stringify(apiFilters);

    // Check cache first
    const cachedData = getCachedResult(cacheKey);
    if (cachedData) {
      console.log('Using data from cache instead of API call');
      // Use cached data
      setProducts(cachedData.products);
      setFilteredProducts(cachedData.products);
      setTotalProducts(cachedData.total);
      setCurrentPage(cachedData.page);
      setItemsPerPage(cachedData.limit);
      return;
    }

    // Create new timeout with reduced debounce time
    const newTimeout = setTimeout(async () => {
      // Check if enough time has passed since last fetch (reduced to 200ms for better responsiveness)
      if (currentTime - lastFetchTime < 200) {
        console.log('Skipping fetchProducts request due to recent call');
        setIsLoading(false); // Ensure loading is turned off even when skipping request
        return;
      }

      // If already loading, skip this request
      if (loading) {
        console.log('Skipping fetchProducts request because ProductContext is already fetching');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setLastFetchTime(currentTime);

      console.log('useProductTable calling fetchLightProducts with:', apiFilters);

      // Use Promise.all to fetch products and statistics in parallel when possible
      const fetchPromises = [];

      // Main products fetch promise
      const productsPromise = fetchLightProducts(
        apiFilters.page,
        apiFilters.limit,
        apiFilters.search,
        apiFilters.brandId,
        apiFilters.categoryId,
        apiFilters.status,
        undefined, // minPrice
        undefined, // maxPrice
        undefined, // tags
        undefined, // skinTypes
        undefined, // concerns
        apiFilters.isBestSeller,
        apiFilters.isNew,
        apiFilters.isOnSale,
        apiFilters.hasGifts
      ).then(() => {
        // Update cache with new data
        updateCache(cacheKey, {
          products: apiProducts,
          total: totalProducts,
          page: currentPage,
          limit: itemsPerPage
        });
        return apiProducts;
      });

      fetchPromises.push(productsPromise);

      // Only fetch statistics if we're on the first page or explicitly requested
      if (currentPage === 1 || apiFilters.page === 1) {
        fetchPromises.push(fetchStatistics().catch(error => {
          console.error("Error fetching statistics:", error);
          // Don't fail the whole operation if statistics fail
          return null;
        }));
      }

      // Execute all promises in parallel
      Promise.all(fetchPromises)
        .catch(error => {
          console.error("Error fetching products:", error);
        })
        .finally(() => {
          // Always ensure loading state is turned off, even when there's an error
          setIsLoading(false);
        });
    }, 200); // Reduced debounce time to 200ms for better responsiveness

    setFetchTimeout(newTimeout);

    // Ensure timeout is cleared when component unmounts
    return () => {
      if (newTimeout) clearTimeout(newTimeout);
    };
  }, [
    currentPage,
    itemsPerPage,
    filter,
    fetchLightProducts,
    fetchStatistics,
    loading,
    apiProducts,
    totalProducts
  ]);

  // Định nghĩa fetchProducts mới sử dụng API light
  const fetchProducts = fetchProductsLight;

  // Thêm hàm để xóa cache khi cần làm mới dữ liệu
  const refreshProducts = useCallback(() => {
    clearCache();
    fetchProducts();
  }, [fetchProducts]);

  // Cập nhật useEffect ban đầu để sử dụng API light - cần thêm lại
  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      console.log('Initial fetch in useProductTable - Khởi động');

      // Đánh dấu đã thực hiện fetch ban đầu
      initialFetchDoneRef.current = true;
      setLastFetchTime(Date.now());

      // Fetch dữ liệu ngay khi component mount
      fetchProducts();
    }
  }, [fetchProducts]);

  // Cập nhật các phương thức bulk để xóa cache sau khi thực hiện
  const bulkSetStatus = useCallback(async (status: ProductStatus) => {
    try {
      for (const id of selectedProducts) {
        await updateProduct(id, { status });
      }
      clearCache(); // Xóa cache sau khi cập nhật
      fetchProducts(); // Refresh after update
      clearSelectedProducts();
      return true;
    } catch (error) {
      console.error('Error bulk updating status:', error);
      return false;
    }
  }, [selectedProducts, updateProduct, fetchProducts, clearSelectedProducts]);

  const bulkSetFlag = useCallback(async (flag: string, value: boolean) => {
    try {
      for (const id of selectedProducts) {
        await updateProductFlags(id, { flags: { [flag]: value } });
      }
      clearCache(); // Xóa cache sau khi cập nhật
      fetchProducts(); // Refresh after update
      clearSelectedProducts();
      return true;
    } catch (error) {
      console.error('Error bulk updating flags:', error);
      return false;
    }
  }, [selectedProducts, updateProductFlags, fetchProducts, clearSelectedProducts]);

  const bulkDelete = useCallback(async () => {
    try {
      for (const id of selectedProducts) {
        await deleteProductApi(id);
      }
      clearCache(); // Xóa cache sau khi xóa
      fetchProducts(); // Refresh after deletion
      clearSelectedProducts();
      return true;
    } catch (error) {
      console.error('Error bulk deleting products:', error);
      return false;
    }
  }, [selectedProducts, deleteProductApi, fetchProducts, clearSelectedProducts]);

  // Hàm chọn/bỏ chọn một sản phẩm
  const toggleProductSelection = useCallback((id: string) => {
    setSelectedProducts(prev => {
      if (prev.includes(id)) {
        return prev.filter(productId => productId !== id);
      } else {
        return [...prev, id];
      }
    });
  }, []);

  // Hàm chọn/bỏ chọn tất cả sản phẩm
  const toggleSelectAll = useCallback(() => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(p => p.id));
    }
  }, [filteredProducts, selectedProducts]);

  // Hàm mở/đóng chi tiết sản phẩm
  const toggleProductDetails = useCallback((id: string) => {
    setExpandedProduct(prev => prev === id ? null : id);
  }, []);

  // Hàm áp dụng bộ lọc
  const applyFilter = useCallback((newFilter: ProductFilterState) => {
    setFilter(newFilter);
    setCurrentPage(1); // Reset về trang 1 khi thay đổi bộ lọc

    // Khi thay đổi bộ lọc, gọi fetchProducts sẽ được kích hoạt qua useEffect
  }, []);

  // Hàm đặt trang hiện tại
  const setPage = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  // Hàm đặt số sản phẩm trên mỗi trang
  const setPerPage = useCallback((perPage: number) => {
    setItemsPerPage(perPage);
    setCurrentPage(1); // Reset trang về 1 khi thay đổi số SP/trang
  }, []);

  // Cập nhật phương thức mapApiProductsToUiModel để xử lý dữ liệu từ Light API
  const mapApiProductsToUiModel = useCallback(() => {
    return apiProducts.map(product => {
      // Xử lý khi dữ liệu từ Light API có cấu trúc khác
      let imageUrl = '';
      if (product.images && product.images.length > 0) {
        const primaryImage = product.images.find(img => img.isPrimary);
        imageUrl = primaryImage ? primaryImage.url : product.images[0].url;
      } else if ((product as any).imageUrl) {
        // Sử dụng imageUrl từ Light API nếu có
        imageUrl = (product as any).imageUrl;
      }

      // Format giá hiển thị
      const formatPrice = (price: number): string => {
        return price.toLocaleString('vi-VN') + 'đ';
      };

      // Tính tổng tồn kho
      const stock = (product.inventory || []).reduce((total, inv) => total + inv.quantity, 0);

      return {
        id: product._id || '',
        name: product.name || '',
        sku: product.sku || '',
        image: imageUrl || '/images/product-placeholder.jpg',
        price: formatPrice(product.price || 0),
        originalPrice: product.price || 0,
        currentPrice: product.currentPrice || product.price || 0,
        category: product.categoryIds && product.categoryIds.length > 0 ? getCategoryName(product.categoryIds[0]) : 'Chưa phân loại',
        categoryIds: product.categoryIds || [],
        brand: (product as any).brandName || getBrandName(product.brandId || ''),
        brandId: product.brandId || '',
        inventory: (product.inventory || []).map(inv => ({
          branchId: inv.branchId,
          branchName: getBranchName(inv.branchId),
          quantity: inv.quantity
        })),
        stock,
        status: (product.status || 'active') as ProductStatus,
        flags: {
          isBestSeller: product.flags?.isBestSeller === true,
          isNew: product.flags?.isNew === true,
          isOnSale: product.flags?.isOnSale === true,
          hasGifts: product.flags?.hasGifts === true
        },
        createdAt: product.createdAt?.toString() || '',
        updatedAt: product.updatedAt?.toString() || ''
      };
    });
  }, [apiProducts]);

  // Update products when apiProducts change
  useEffect(() => {
    if (apiProducts && apiProducts.length > 0) {
      const mappedProducts = mapApiProductsToUiModel();
      setProducts(mappedProducts);
      setFilteredProducts(mappedProducts);
    }
  }, [apiProducts, mapApiProductsToUiModel]);

  return {
    products,
    filteredProducts,
    isLoading,
    selectedProducts,
    expandedProduct,
    totalItems: totalProducts || localTotalProducts || products.length,
    totalActive: statistics?.active || products.filter(p => p.status === 'active').length,
    totalOutOfStock: statistics?.outOfStock || products.filter(p => p.status === 'out_of_stock').length,
    totalDiscontinued: statistics?.discontinued || products.filter(p => p.status === 'discontinued').length,
    currentPage,
    itemsPerPage,
    toggleProductSelection,
    toggleSelectAll,
    toggleProductDetails,
    applyFilter,
    setPage,
    setItemsPerPage: setPerPage,
    clearSelectedProducts,
    fetchProducts: refreshProducts, // Sử dụng refreshProducts để đảm bảo xóa cache
    isAllSelected: filteredProducts.length > 0 && selectedProducts.length === filteredProducts.length,
    filter,
    bulkSetStatus,
    bulkSetFlag,
    bulkDelete
  };
}