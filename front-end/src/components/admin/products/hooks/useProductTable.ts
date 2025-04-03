import { useState, useEffect, useCallback, useRef } from 'react';
import { ProductStatus } from '../components/ProductStatusBadge';
import { ProductFilterState } from '../components/ProductFilter';
import { useProduct } from '@/contexts/ProductContext';

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
  price: string;
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

// Mock data lấy các thương hiệu
export function getBrands() {
  return [
    { id: '1', name: 'Yumin' },
    { id: '2', name: 'Clinique' },
    { id: '3', name: 'Innisfree' },
    { id: '4', name: 'The Ordinary' }
  ];
}

// Dữ liệu mẫu nếu cần thêm sản phẩm
export const sampleProductData: Product[] = [
  {
    id: 'PRD-001',
    name: 'Kem dưỡng ẩm Yumin',
    sku: 'SKU-001',
    image: 'https://via.placeholder.com/50',
    price: '350,000đ',
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
    name: 'Son môi Yumin màu đỏ',
    sku: 'SKU-006',
    image: 'https://via.placeholder.com/50',
    price: '180,000đ',
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

export function useProductTable(): UseProductTableResult {
  // Use the ProductContext
  const {
    products: contextProducts,
    loading,
    totalProducts,
    currentPage: apiCurrentPage,
    totalPages,
    itemsPerPage: apiItemsPerPage,
    fetchProducts: fetchContextProducts,
    fetchStatistics,
    updateProduct,
    updateProductFlags,
    deleteProduct,
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

  // Convert context products to the format expected by the UI
  const convertContextProducts = useCallback((contextProducts: any[]): Product[] => {
    return contextProducts.map(p => ({
      id: p._id || '',
      name: p.name || '',
      sku: p.sku || '',
      image: p.images && p.images.length > 0 ? 
        (p.images.find((img: any) => img.isPrimary) || p.images[0]).url : 
        'https://via.placeholder.com/50',
      price: p.price ? p.price.toLocaleString('vi-VN') + 'đ' : '0đ',
      category: '', // This would need to be populated from categories
      categoryIds: p.categoryIds || [],
      brand: '', // This would need to be populated from brands
      brandId: p.brandId || '',
      inventory: p.inventory ? p.inventory.map((inv: any) => ({
        branchId: inv.branchId,
        branchName: 'Chi nhánh', // This would need to be populated from branches
        quantity: inv.quantity
      })) : [],
      stock: p.inventory ? p.inventory.reduce((sum: number, inv: any) => sum + inv.quantity, 0) : 0,
      status: p.status || 'active',
      flags: p.flags || {
        isBestSeller: false,
        isNew: false,
        isOnSale: false,
        hasGifts: false
      },
      createdAt: p.createdAt || '',
      updatedAt: p.updatedAt || ''
    }));
  }, []);

  // Update products when context products change
  useEffect(() => {
    if (contextProducts) {
      const convertedProducts = convertContextProducts(contextProducts);
      setProducts(convertedProducts);
      setFilteredProducts(convertedProducts);
      setIsLoading(false);
    }
  }, [contextProducts, convertContextProducts]);

  // Sync with API pagination
  useEffect(() => {
    if (apiCurrentPage) setCurrentPage(apiCurrentPage);
    if (apiItemsPerPage) setItemsPerPage(apiItemsPerPage);
  }, [apiCurrentPage, apiItemsPerPage]);

  // Thống kê sản phẩm theo trạng thái
  const totalItems = totalProducts || products.length;
  const totalActive = statistics?.active || products.filter(p => p.status === 'active').length;
  const totalOutOfStock = statistics?.outOfStock || products.filter(p => p.status === 'out_of_stock').length;
  const totalDiscontinued = statistics?.discontinued || products.filter(p => p.status === 'discontinued').length;

  // Kiểm tra đã chọn tất cả chưa
  const isAllSelected = filteredProducts.length > 0 && selectedProducts.length === filteredProducts.length;

  // Fetch products from the context with pagination and filters
  const fetchProducts = useCallback(() => {
    // Nếu đang có một timeout fetch đang chờ, hủy nó
    if (fetchTimeout) {
      clearTimeout(fetchTimeout);
    }
    
    // Đặt một timeout mới để đảm bảo debounce
    const newTimeout = setTimeout(() => {
      // Lưu thời gian gọi fetch hiện tại
      const currentTime = Date.now();
      
      // Kiểm tra xem đã đủ thời gian debounce (1500ms) kể từ lần fetch cuối cùng chưa
      if (currentTime - lastFetchTime < 1500) {
        console.log('Bỏ qua yêu cầu fetchProducts trong useProductTable do đã gọi gần đây');
        setIsLoading(false); // Đảm bảo tắt loading ngay cả khi bỏ qua request
        return;
      }
      
      setIsLoading(true);
      setLastFetchTime(currentTime);
      
      // Prepare filters for API
      const apiFilters: any = {
        page: currentPage,
        limit: itemsPerPage,
        search: filter.searchTerm || undefined,
        categoryId: filter.categories.length ? filter.categories.join(',') : undefined,
        brandId: filter.brands.length ? filter.brands.join(',') : undefined,
        status: filter.status || undefined,
        isBestSeller: filter.flags.isBestSeller,
        isNew: filter.flags.isNew,
        isOnSale: filter.flags.isOnSale,
        hasGifts: filter.flags.hasGifts
      };
      
      // Filter out undefined values
      Object.keys(apiFilters).forEach(key => {
        if (apiFilters[key] === undefined) delete apiFilters[key];
      });
      
      console.log('useProductTable đang gọi fetchProducts với:', apiFilters);
      
      // Fetch from context/API with filters
      fetchContextProducts(
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
      )
      .then(() => {
        // Only fetch statistics if products were successfully fetched
        return fetchStatistics().catch(error => {
          console.error("Lỗi khi lấy thống kê:", error);
        });
      })
      .catch(error => {
        console.error("Lỗi khi lấy sản phẩm:", error);
      })
      .finally(() => {
        // Luôn đảm bảo rằng trạng thái loading được tắt, ngay cả khi có lỗi
        setIsLoading(false);
      });
    }, 1500); // Tăng thời gian debounce lên 1500ms
    
    setFetchTimeout(newTimeout);
    
    // Đảm bảo xóa timeout khi component unmount
    return () => {
      if (newTimeout) clearTimeout(newTimeout);
    };
  }, [
    currentPage, 
    itemsPerPage, 
    filter, 
    fetchContextProducts, 
    fetchStatistics
  ]);

  // Sử dụng refs để theo dõi thay đổi thực sự
  const initialFetchDoneRef = useRef(false);
  const prevPageRef = useRef(currentPage);
  const prevItemsPerPageRef = useRef(itemsPerPage);
  const prevFilterRef = useRef(JSON.stringify(filter));
  const isMountedRef = useRef(false);

  // Fetch products lần đầu - chỉ chạy một lần khi component mount
  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      console.log('Initial fetch in useProductTable - Khởi động');
      
      // Thực hiện fetch ngay lập tức thay vì đợi timeout
      initialFetchDoneRef.current = true;
      setLastFetchTime(Date.now());
      fetchProducts();
    }
  }, []);

  // Xử lý thay đổi trang và itemsPerPage
  useEffect(() => {
    if (initialFetchDoneRef.current && isMountedRef.current) {
      if (prevPageRef.current !== currentPage || prevItemsPerPageRef.current !== itemsPerPage) {
        console.log('Page hoặc limit thay đổi, đang fetch products:', 
                    { prevPage: prevPageRef.current, currentPage, 
                      prevLimit: prevItemsPerPageRef.current, itemsPerPage });
                      
        // Giảm timeout để tải dữ liệu nhanh hơn
        const timer = setTimeout(() => {
          fetchProducts();
        }, 100);
        
        prevPageRef.current = currentPage;
        prevItemsPerPageRef.current = itemsPerPage;
        
        return () => clearTimeout(timer);
      }
    }
  }, [currentPage, itemsPerPage]);

  // Xử lý thay đổi filter
  useEffect(() => {
    if (initialFetchDoneRef.current && isMountedRef.current) {
      const currentFilterString = JSON.stringify(filter);
      if (prevFilterRef.current !== currentFilterString) {
        console.log('Filter thay đổi, đang fetch products');
        
        // Giảm timeout để tải dữ liệu nhanh hơn
        const timer = setTimeout(() => {
          fetchProducts();
        }, 100);
        
        prevFilterRef.current = currentFilterString;
        
        return () => clearTimeout(timer);
      }
    }
  }, [filter]);

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

  // Hàm xóa tất cả sản phẩm đã chọn
  const clearSelectedProducts = useCallback(() => {
    setSelectedProducts([]);
  }, []);
  
  // Bulk actions using ProductContext
  const bulkSetStatus = useCallback(async (status: ProductStatus) => {
    try {
      for (const id of selectedProducts) {
        await updateProduct(id, { status });
      }
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
        await deleteProduct(id);
      }
      fetchProducts(); // Refresh after deletion
      clearSelectedProducts();
      return true;
    } catch (error) {
      console.error('Error bulk deleting products:', error);
      return false;
    }
  }, [selectedProducts, deleteProduct, fetchProducts, clearSelectedProducts]);

  return {
    products,
    filteredProducts,
    isLoading: loading || isLoading,
    selectedProducts,
    expandedProduct,
    totalItems,
    totalActive,
    totalOutOfStock,
    totalDiscontinued,
    currentPage,
    itemsPerPage,
    toggleProductSelection,
    toggleSelectAll,
    toggleProductDetails,
    applyFilter,
    setPage,
    setItemsPerPage: setPerPage,
    clearSelectedProducts,
    fetchProducts,
    isAllSelected,
    filter,
    bulkSetStatus,
    bulkSetFlag,
    bulkDelete
  };
}