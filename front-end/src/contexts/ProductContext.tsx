import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useProductAdmin } from '@/hooks/useProductAdmin';
import { useApiStats } from '@/hooks/useApiStats';
import { AdminProduct } from '@/hooks/useProductAdmin';

// Tạo interface cho sản phẩm từ Admin API
export interface Product {
  _id?: string;
  id?: string;
  sku: string;
  name: string;
  slug: string;
  description?: {
    short?: string;
    full?: string;
  };
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
  };
  price: number;
  currentPrice?: number;
  status?: 'active' | 'out_of_stock' | 'discontinued';
  brandId?: string;
  categoryIds?: string[];
  tags?: string[];
  cosmetic_info?: {
    skinType?: string[];
    concerns?: string[];
    ingredients?: string[];
    volume?: {
      value?: number;
      unit?: string;
    };
    usage?: string;
    madeIn?: string;
    expiry?: {
      shelf?: number;
      afterOpening?: number;
    };
  };
  variants?: Array<{
    variantId?: string;
    sku: string;
    options?: {
      color?: string;
      shade?: string;
      size?: string;
    };
    price?: number;
    images?: Array<{
      url: string;
      alt?: string;
      publicId?: string;
      isPrimary?: boolean;
    }>;
  }>;
  images?: Array<{
    url: string;
    alt?: string;
    publicId?: string;
    isPrimary?: boolean;
    file?: File;       // For file uploads
    preview?: string;  // For image previews
    id?: string;       // Temporary ID for new images
  }>;
  inventory?: Array<{
    branchId: string;
    quantity: number;
    lowStockThreshold?: number;
  }>;
  reviews?: {
    averageRating: number;
    reviewCount: number;
  };
  flags?: {
    isBestSeller?: boolean;
    isNew?: boolean;
    isOnSale?: boolean;
    hasGifts?: boolean;
  };
  gifts?: Array<{
    giftId?: string;
    name: string;
    description?: string;
    image?: {
      url: string;
      alt?: string;
    };
    quantity?: number;
    value?: number;
    type?: 'product' | 'sample' | 'voucher' | 'other';
    conditions?: {
      minPurchaseAmount?: number;
      minQuantity?: number;
      startDate?: Date | string;
      endDate?: Date | string;
      limitedQuantity?: number;
    };
    status?: 'active' | 'inactive' | 'out_of_stock';
  }>;
  relatedProducts?: string[];
  relatedEvents?: string[];
  relatedCampaigns?: string[];
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

// API configuration
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const API_URL = BASE_URL.endsWith('/api') ? BASE_URL : `${BASE_URL}/api`;

// Define ProductContext type
interface ProductContextType {
  products: Product[];
  loading: boolean;
  error: string | null;
  totalProducts: number;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  apiHealthStatus: 'online' | 'offline' | 'checking';
  checkApiHealth: () => Promise<boolean>;
  statistics: {
    total: number;
    active: number;
    outOfStock: number;
    discontinued: number;
    withVariants: number;
    withGifts: number;
    bestSellers: number;
    newProducts: number;
    onSale: number;
  } | null;
  // Image upload method
  uploadProductImage: (
    file: File,
    productId: string,
    isPrimary?: boolean
  ) => Promise<{
    url: string;
    publicId: string;
    width: number;
    height: number;
    format: string;
  }>;
  // CRUD methods
  fetchProducts: (
    page?: number,
    limit?: number,
    search?: string,
    brandId?: string,
    categoryId?: string,
    status?: string,
    minPrice?: number,
    maxPrice?: number,
    tags?: string,
    skinTypes?: string,
    concerns?: string,
    isBestSeller?: boolean,
    isNew?: boolean,
    isOnSale?: boolean,
    hasGifts?: boolean,
    sortBy?: string,
    sortOrder?: 'asc' | 'desc'
  ) => Promise<void>;
  fetchProductById: (id: string) => Promise<Product>;
  fetchProductBySlug: (slug: string) => Promise<Product>;
  createProduct: (productData: Partial<Product>) => Promise<Product>;
  updateProduct: (id: string, productData: Partial<Product>) => Promise<Product>;
  deleteProduct: (id: string) => Promise<void>;
  updateInventory: (id: string, branchId: string, quantity: number) => Promise<Product>;
  updateProductFlags: (id: string, flags: any) => Promise<Product>;
  addVariant: (id: string, variantData: any) => Promise<Product>;
  updateVariant: (id: string, variantId: string, variantData: any) => Promise<Product>;
  removeVariant: (id: string, variantId: string) => Promise<Product>;
  fetchStatistics: () => Promise<void>;
  clearProductCache: (id?: string) => void;
}

// Create context
const ProductContext = createContext<ProductContextType | undefined>(undefined);
export { ProductContext };

// Hook to use the context
export const useProduct = () => {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProduct must be used within a ProductProvider');
  }
  return context;
};

// Component to display API status
const ApiStatusAlert: React.FC<{
  status: 'online' | 'offline' | 'checking';
  onRetry: () => void;
}> = ({ status, onRetry }) => {
  if (status === 'online') return null;

  const alertStyle = {
    position: 'fixed' as const,
    bottom: '20px',
    right: '20px',
    padding: '12px 20px',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    fontSize: '14px',
    backgroundColor: status === 'checking' ? '#FEF3C7' : '#FEE2E2',
    color: status === 'checking' ? '#92400E' : '#B91C1C',
    border: `1px solid ${status === 'checking' ? '#F59E0B' : '#EF4444'}`
  };

  const buttonStyle = {
    padding: '6px 12px',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    backgroundColor: status === 'checking' ? '#F59E0B' : '#EF4444',
    color: 'white',
    fontWeight: 500 as const,
    fontSize: '12px'
  };

  const statusMessage = status === 'checking'
    ? 'Đang kiểm tra kết nối đến API...'
    : 'Không thể kết nối đến API. Vui lòng kiểm tra server backend.';

  return (
    <div style={alertStyle}>
      <span>{statusMessage}</span>
      <button onClick={onRetry} style={buttonStyle}>
        {status === 'checking' ? 'Đang thử lại...' : 'Kiểm tra lại'}
      </button>
    </div>
  );
};

// Provider component
export const ProductProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [apiHealthStatus, setApiHealthStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  
  // Sử dụng hooks mới cho API
  const { 
    products: adminProducts, 
    loading, 
    error,
    totalItems: totalProducts,
    totalPages,
    currentPage,
    itemsPerPage,
    fetchProducts: fetchAdminProducts,
    checkApiHealth,
  } = useProductAdmin();
  
  // Sử dụng hook thống kê
  const { 
    statistics, 
    fetchStatistics: fetchApiStatistics
  } = useApiStats();

  // Chuyển đổi từ AdminProduct sang Product
  const products = adminProducts.map(convertAdminProductToProduct);

  // Hàm chuyển đổi từ AdminProduct sang Product
  function convertAdminProductToProduct(adminProduct: AdminProduct): Product {
    return {
      _id: adminProduct.id,
      id: adminProduct.id,
      name: adminProduct.name,
      slug: adminProduct.slug,
      sku: adminProduct.sku,
      price: adminProduct.originalPrice,
      currentPrice: adminProduct.currentPrice,
      status: adminProduct.status as any,
      brandId: adminProduct.brandId,
      categoryIds: adminProduct.categoryIds,
      inventory: [{ branchId: '1', quantity: adminProduct.stock }],
      images: adminProduct.image ? [{ url: adminProduct.image, isPrimary: true }] : [],
      flags: adminProduct.flags,
      createdAt: adminProduct.createdAt,
      updatedAt: adminProduct.updatedAt
    };
  }

  // Chuyển đổi lại API health check
  const handleCheckApiHealth = useCallback(async (): Promise<boolean> => {
    setApiHealthStatus('checking');
    try {
      const isHealthy = await checkApiHealth();
      setApiHealthStatus(isHealthy ? 'online' : 'offline');
      return isHealthy;
    } catch (error) {
      setApiHealthStatus('offline');
      return false;
    }
  }, [checkApiHealth]);

  // Các phương thức tương tác với API tương tự như cũ nhưng sử dụng hooks mới
  const fetchProducts = useCallback(async (
    page: number = 1,
    limit: number = 10,
    search: string = '',
    brandId: string = '',
    categoryId: string = '',
    status: string = '',
    minPrice?: number,
    maxPrice?: number,
    tags: string = '',
    skinTypes: string = '',
    concerns: string = '',
    isBestSeller?: boolean,
    isNew?: boolean,
    isOnSale?: boolean,
    hasGifts?: boolean,
    sortBy: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ) => {
    await fetchAdminProducts({
      page,
      limit,
      search,
      brandId,
      categoryId,
      status,
      minPrice,
      maxPrice,
      tags,
      skinTypes,
      concerns,
      isBestSeller,
      isNew,
      isOnSale,
      hasGifts,
      sortBy,
      sortOrder
    });
  }, [fetchAdminProducts]);

  // Phương thức GET để fetch sản phẩm theo ID
  const fetchProductById = useCallback(async (id: string): Promise<Product> => {
    try {
      const response = await fetch(`${API_URL}/admin/products/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch product: ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('Error fetching product by ID:', error);
      throw error;
    }
  }, []);

  // Phương thức GET để fetch sản phẩm theo slug
  const fetchProductBySlug = useCallback(async (slug: string): Promise<Product> => {
    try {
      const response = await fetch(`${API_URL}/products/slug/${slug}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch product by slug: ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('Error fetching product by slug:', error);
      throw error;
    }
  }, []);

  // Phương thức POST để tạo sản phẩm mới
  const createProduct = useCallback(async (productData: Partial<Product>): Promise<Product> => {
    try {
      const response = await fetch(`${API_URL}/admin/products`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(productData)
      });

      if (!response.ok) {
        throw new Error(`Failed to create product: ${response.status}`);
      }

      const newProduct = await response.json();
      
      // Refresh danh sách sản phẩm
      fetchAdminProducts();
      
      return newProduct;
    } catch (error: any) {
      console.error('Error creating product:', error);
      throw error;
    }
  }, [fetchAdminProducts]);

  // Phương thức PATCH để cập nhật sản phẩm
  const updateProduct = useCallback(async (id: string, productData: Partial<Product>): Promise<Product> => {
    try {
      const response = await fetch(`${API_URL}/admin/products/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(productData)
      });

      if (!response.ok) {
        throw new Error(`Failed to update product: ${response.status}`);
      }

      const updatedProduct = await response.json();
      
      // Refresh danh sách sản phẩm
      fetchAdminProducts();
      
      return updatedProduct;
    } catch (error: any) {
      console.error('Error updating product:', error);
      throw error;
    }
  }, [fetchAdminProducts]);

  // Phương thức DELETE để xóa sản phẩm
  const deleteProduct = useCallback(async (id: string): Promise<void> => {
    try {
      const response = await fetch(`${API_URL}/admin/products/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to delete product: ${response.status}`);
      }

      // Refresh danh sách sản phẩm
      fetchAdminProducts();
    } catch (error: any) {
      console.error('Error deleting product:', error);
      throw error;
    }
  }, [fetchAdminProducts]);

  // Phương thức POST để cập nhật tồn kho sản phẩm
  const updateInventory = useCallback(async (id: string, branchId: string, quantity: number): Promise<Product> => {
    try {
      const response = await fetch(`${API_URL}/admin/products/${id}/inventory/${branchId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ quantity })
      });

      if (!response.ok) {
        throw new Error(`Failed to update inventory: ${response.status}`);
      }

      const updatedProduct = await response.json();
      
      // Refresh danh sách sản phẩm
      fetchAdminProducts();
      
      return updatedProduct;
    } catch (error: any) {
      console.error('Error updating inventory:', error);
      throw error;
    }
  }, [fetchAdminProducts]);

  // Phương thức PATCH để cập nhật flags sản phẩm
  const updateProductFlags = useCallback(async (id: string, flags: any): Promise<Product> => {
    try {
      const response = await fetch(`${API_URL}/admin/products/${id}/flags`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(flags)
      });

      if (!response.ok) {
        throw new Error(`Failed to update product flags: ${response.status}`);
      }

      const updatedProduct = await response.json();
      
      // Refresh danh sách sản phẩm
      fetchAdminProducts();
      
      return updatedProduct;
    } catch (error: any) {
      console.error('Error updating product flags:', error);
      throw error;
    }
  }, [fetchAdminProducts]);

  // Phương thức tải lên ảnh sản phẩm
  const uploadProductImage = useCallback(async (
    file: File,
    productId: string,
    isPrimary: boolean = false
  ) => {
    try {
      console.log(`Đang chuẩn bị tải lên ảnh cho sản phẩm ID: ${productId}, tên file: ${file.name}, kích thước: ${file.size} bytes, isPrimary: ${isPrimary}`);
      
      const formData = new FormData();
      formData.append('image', file);
      formData.append('isPrimary', isPrimary.toString());

      console.log(`Đang gửi yêu cầu đến ${API_URL}/admin/products/${productId}/upload-image`);
      
      const response = await fetch(`${API_URL}/admin/products/${productId}/upload-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: formData
      });

      console.log(`Đã nhận phản hồi với status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Lỗi phản hồi API:', errorText);
        throw new Error(`Failed to upload image: ${response.status}. Details: ${errorText}`);
      }

      const result = await response.json();
      console.log('Tải lên thành công với kết quả:', result);
      return result;
    } catch (error: any) {
      console.error('Error uploading product image:', error);
      console.error('Chi tiết lỗi:', error.message);
      throw error;
    }
  }, []);

  // Phương thức POST để thêm biến thể sản phẩm
  const addVariant = useCallback(async (id: string, variantData: any): Promise<Product> => {
    try {
      const response = await fetch(`${API_URL}/admin/products/${id}/variants`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(variantData)
      });

      if (!response.ok) {
        throw new Error(`Failed to add variant: ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('Error adding product variant:', error);
      throw error;
    }
  }, []);

  // Phương thức PATCH để cập nhật biến thể sản phẩm
  const updateVariant = useCallback(async (id: string, variantId: string, variantData: any): Promise<Product> => {
    try {
      const response = await fetch(`${API_URL}/admin/products/${id}/variants/${variantId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(variantData)
      });

      if (!response.ok) {
        throw new Error(`Failed to update variant: ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('Error updating product variant:', error);
      throw error;
    }
  }, []);

  // Phương thức DELETE để xóa biến thể sản phẩm
  const removeVariant = useCallback(async (id: string, variantId: string): Promise<Product> => {
    try {
      const response = await fetch(`${API_URL}/admin/products/${id}/variants/${variantId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to remove variant: ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('Error removing product variant:', error);
      throw error;
    }
  }, []);

  // Cập nhật phương thức fetchStatistics để sử dụng useApiStats
  const fetchStatsData = useCallback(async (): Promise<void> => {
    await fetchApiStatistics();
  }, [fetchApiStatistics]);

  // Phương thức cache (giữ lại để tương thích)
  const clearProductCache = useCallback((id?: string): void => {
    // With our new approach, we don't need caching as we use the hooks
    console.log('Cache clearing not needed, using direct API with hooks');
  }, []);

  // Context value
  const value: ProductContextType = {
    products,
    loading,
    error: error || null,
    totalProducts,
    currentPage,
    totalPages,
    itemsPerPage,
    apiHealthStatus,
    checkApiHealth: handleCheckApiHealth,
    statistics: statistics,
    // Image upload method
    uploadProductImage,
    // CRUD methods
    fetchProducts,
    fetchProductById,
    fetchProductBySlug,
    createProduct,
    updateProduct,
    deleteProduct,
    updateInventory,
    updateProductFlags,
    addVariant,
    updateVariant,
    removeVariant,
    fetchStatistics: fetchStatsData,
    clearProductCache
  };

  return (
    <ProductContext.Provider value={value}>
      {children}
      {/* Hiển thị thông báo trạng thái API nếu đang offline hoặc checking */}
      <ApiStatusAlert
        status={apiHealthStatus}
        onRetry={handleCheckApiHealth}
      />
    </ProductContext.Provider>
  );
}; 