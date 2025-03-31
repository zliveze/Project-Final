import { useState, useEffect, useCallback } from 'react';
import { ProductStatus } from '../components/ProductStatusBadge';
import { ProductFilterState } from '../components/ProductFilter';

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
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(20);
  const [filter, setFilter] = useState<ProductFilterState>({
    searchTerm: '',
    categories: [],
    brands: [],
    flags: {}
  });

  // Thống kê sản phẩm theo trạng thái
  const totalItems = products.length;
  const totalActive = products.filter(p => p.status === 'active').length;
  const totalOutOfStock = products.filter(p => p.status === 'out_of_stock').length;
  const totalDiscontinued = products.filter(p => p.status === 'discontinued').length;

  // Kiểm tra đã chọn tất cả chưa
  const isAllSelected = filteredProducts.length > 0 && selectedProducts.length === filteredProducts.length;

  // Mô phỏng việc lấy dữ liệu từ API
  const fetchProducts = useCallback(() => {
    setIsLoading(true);
    
    // Giả lập gọi API
    setTimeout(() => {
      setProducts(sampleProductData);
      setFilteredProducts(sampleProductData);
      setIsLoading(false);
    }, 800);
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

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
    
    let filtered = [...products];
    
    // Lọc theo từ khóa
    if (newFilter.searchTerm) {
      const searchTermLower = newFilter.searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchTermLower) || 
        p.sku.toLowerCase().includes(searchTermLower)
      );
    }
    
    // Lọc theo danh mục
    if (newFilter.categories.length > 0) {
      filtered = filtered.filter(p => 
        p.categoryIds.some(id => newFilter.categories.includes(id))
      );
    }
    
    // Lọc theo thương hiệu
    if (newFilter.brands.length > 0) {
      filtered = filtered.filter(p => newFilter.brands.includes(p.brandId));
    }
    
    // Lọc theo trạng thái
    if (newFilter.status) {
      filtered = filtered.filter(p => p.status === newFilter.status);
    }
    
    // Lọc theo flags
    if (newFilter.flags) {
      if (newFilter.flags.isBestSeller) {
        filtered = filtered.filter(p => p.flags.isBestSeller);
      }
      
      if (newFilter.flags.isNew) {
        filtered = filtered.filter(p => p.flags.isNew);
      }
      
      if (newFilter.flags.isOnSale) {
        filtered = filtered.filter(p => p.flags.isOnSale);
      }
      
      if (newFilter.flags.hasGifts) {
        filtered = filtered.filter(p => p.flags.hasGifts);
      }
    }
    
    setFilteredProducts(filtered);
    setCurrentPage(1); // Reset trang về 1 khi thay đổi bộ lọc
    
    // Xóa các sản phẩm đã chọn nếu không còn trong danh sách lọc
    const filteredIds = filtered.map(p => p.id);
    setSelectedProducts(prev => prev.filter(id => filteredIds.includes(id)));
  }, [products]);

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

  return {
    products,
    filteredProducts,
    isLoading,
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
    filter
  };
} 