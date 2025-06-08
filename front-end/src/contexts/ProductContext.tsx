import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { useProductAdmin } from '@/hooks/useProductAdmin';
import { useApiStats } from '@/hooks/useApiStats';
import { AdminProduct } from '@/hooks/useProductAdmin';
import Cookies from 'js-cookie';
import { toast } from 'react-hot-toast';

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
    url: string;        // URL đến hình ảnh từ Cloudinary
    alt?: string;       // Mô tả hình ảnh
    publicId?: string;  // ID công khai của Cloudinary
    isPrimary?: boolean; // Có phải hình ảnh chính hay không

    // Các trường dưới đây chỉ được sử dụng ở client, KHÔNG được gửi đến server
    file?: File;         // File hình ảnh được tải lên, chỉ tồn tại ở client
    preview?: string;    // URL tạm thời để hiển thị xem trước, chỉ tồn tại ở client
    id?: string;         // ID tạm thời để quản lý ở client, chỉ tồn tại ở client
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
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backendyumin.vercel.app';
const API_URL = BASE_URL.endsWith('/api') ? BASE_URL : `${BASE_URL}/api`;

// Interface cho Product Flags
interface ProductFlags {
  isBestSeller?: boolean;
  isNew?: boolean;
  isOnSale?: boolean;
  hasGifts?: boolean;
}

// Interface cho Variant Data
interface VariantData {
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
}

// Interface cho Cart Item
interface CartItem {
  _id: string;
  productId: string;
  quantity: number;
  variantId?: string;
}

// Interface cho Wishlist Item
interface WishlistItem {
  _id: string;
  productId: string;
}

// Interface cho Review Response
interface ReviewResponse {
  data: Array<{
    _id: string;
    rating: number;
    content: string;
    userId: string;
    productId: string;
    images?: string[];
    createdAt: string;
  }>;
  total: number;
  totalPages: number;
}

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
  // Phương thức chuyên biệt cho shop
  fetchLightProducts: (
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
  updateVariantInventory: (id: string, branchId: string, variantId: string, quantity: number) => Promise<Product>;
  updateCombinationInventory: (id: string, branchId: string, variantId: string, combinationId: string, quantity: number) => Promise<Product>;
  updateProductFlags: (id: string, flags: ProductFlags) => Promise<Product>;
  addVariant: (id: string, variantData: VariantData) => Promise<Product>;
  updateVariant: (id: string, variantId: string, variantData: VariantData) => Promise<Product>;
  removeVariant: (id: string, variantId: string) => Promise<Product>;
  fetchStatistics: () => Promise<void>;
  clearProductCache: (id?: string) => void;
  cleanupBase64Images: () => Promise<{ success: boolean; message: string; count: number }>;
  cloneProduct: (id: string) => Promise<Product>;
  fetchAdminProductList: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    brandId?: string;
    categoryId?: string;
    minPrice?: number;
    maxPrice?: number;
    isBestSeller?: boolean;
    isNew?: boolean;
    isOnSale?: boolean;
    hasGifts?: boolean;
  }) => Promise<{ products: AdminProduct[]; total: number; totalPages: number }>;

  // Phương thức tương tác với giỏ hàng
  addToCart: (productId: string, quantity: number, variantId?: string) => Promise<boolean>;
  removeFromCart: (cartItemId: string) => Promise<boolean>;
  updateCartQuantity: (cartItemId: string, quantity: number) => Promise<boolean>;
  getCartItems: () => Promise<CartItem[]>;

  // Phương thức tương tác với wishlist
  addToWishlist: (productId: string) => Promise<boolean>;
  removeFromWishlist: (productId: string) => Promise<boolean>;
  getWishlistItems: () => Promise<WishlistItem[]>;

  // Phương thức tương tác với đánh giá
  addReview: (
    productId: string,
    rating: number,
    content: string,
    images?: File[]
  ) => Promise<boolean>;
  getProductReviews: (productId: string, page?: number, limit?: number) => Promise<ReviewResponse>;
}

// Create context
const ProductContext = createContext<ProductContextType | undefined>(undefined);
export { ProductContext };

// Hook to use the context
export const useProduct = () => {
  const context = useContext(ProductContext);

  // Nếu context không tồn tại, trả về một mock context thay vì ném lỗi
  if (!context) {
    console.warn('useProduct được gọi bên ngoài ProductProvider. Trả về mock context.');

    // Tạo một mock context với các phương thức không có chức năng
    return {
      products: [],
      loading: false,
      error: null,
      totalProducts: 0,
      currentPage: 1,
      totalPages: 1,
      itemsPerPage: 10,
      apiHealthStatus: 'online' as const,
      checkApiHealth: async () => true,
      statistics: null,
      uploadProductImage: async () => {
        console.warn('ProductProvider không khả dụng trên trang này');
        return { url: '', publicId: '', width: 0, height: 0, format: '' };
      },
      fetchProducts: async () => { console.warn('ProductProvider không khả dụng trên trang này'); },
      fetchLightProducts: async () => { console.warn('ProductProvider không khả dụng trên trang này'); },
      fetchProductById: async () => {
        console.warn('ProductProvider không khả dụng trên trang này');
        return {} as Product;
      },
      fetchProductBySlug: async () => {
        console.warn('ProductProvider không khả dụng trên trang này');
        return {} as Product;
      },
      createProduct: async () => {
        console.warn('ProductProvider không khả dụng trên trang này');
        return {} as Product;
      },
      updateProduct: async () => {
        console.warn('ProductProvider không khả dụng trên trang này');
        return {} as Product;
      },
      deleteProduct: async () => { console.warn('ProductProvider không khả dụng trên trang này'); },
      updateInventory: async () => {
        console.warn('ProductProvider không khả dụng trên trang này');
        return {} as Product;
      },
      updateVariantInventory: async () => {
        console.warn('ProductProvider không khả dụng trên trang này');
        return {} as Product;
      },
      updateCombinationInventory: async () => {
        console.warn('ProductProvider không khả dụng trên trang này');
        return {} as Product;
      },
      updateProductFlags: async () => {
        console.warn('ProductProvider không khả dụng trên trang này');
        return {} as Product;
      },
      addVariant: async () => {
        console.warn('ProductProvider không khả dụng trên trang này');
        return {} as Product;
      },
      updateVariant: async () => {
        console.warn('ProductProvider không khả dụng trên trang này');
        return {} as Product;
      },
      removeVariant: async () => {
        console.warn('ProductProvider không khả dụng trên trang này');
        return {} as Product;
      },
      fetchStatistics: async () => { console.warn('ProductProvider không khả dụng trên trang này'); },
      clearProductCache: () => { console.warn('ProductProvider không khả dụng trên trang này'); },
      cleanupBase64Images: async () => {
        console.warn('ProductProvider không khả dụng trên trang này');
        return { success: false, message: 'ProductProvider không khả dụng', count: 0 };
      },
      cloneProduct: async () => {
        console.warn('ProductProvider không khả dụng trên trang này');
        return {} as Product;
      },
      addToCart: async () => {
        console.warn('ProductProvider không khả dụng trên trang này');
        return false;
      },
      removeFromCart: async () => {
        console.warn('ProductProvider không khả dụng trên trang này');
        return false;
      },
      updateCartQuantity: async () => {
        console.warn('ProductProvider không khả dụng trên trang này');
        return false;
      },
      getCartItems: async () => {
        console.warn('ProductProvider không khả dụng trên trang này');
        return [];
      },
      addToWishlist: async () => {
        console.warn('ProductProvider không khả dụng trên trang này');
        return false;
      },
      removeFromWishlist: async () => {
        console.warn('ProductProvider không khả dụng trên trang này');
        return false;
      },
      getWishlistItems: async () => {
        console.warn('ProductProvider không khả dụng trên trang này');
        return [];
      },
      addReview: async () => {
        console.warn('ProductProvider không khả dụng trên trang này');
        return false;
      },
      getProductReviews: async () => {
        console.warn('ProductProvider không khả dụng trên trang này');
        return { data: [], total: 0, totalPages: 0 };
      },
      fetchAdminProductList: async () => {
        console.warn('ProductProvider không khả dụng trên trang này');
        return { products: [], total: 0, totalPages: 1 };
      },
    } as ProductContextType;
  }

  return context;
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
      status: adminProduct.status as 'active' | 'out_of_stock' | 'discontinued',
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
    // Kiểm tra nếu đã đăng xuất hoặc không có token
    const isLoggedOut = sessionStorage.getItem('adminLoggedOut') === 'true';
    const adminToken = localStorage.getItem('adminToken') || Cookies.get('adminToken');
    const isLoginPage = window.location.pathname.includes('/admin/auth/login');

    if (isLoggedOut || !adminToken || isLoginPage) {
      console.log('Người dùng đã đăng xuất hoặc đang ở trang đăng nhập, không kiểm tra kết nối API');
      setApiHealthStatus('online'); // Đặt status thành online để ẩn thông báo
      return true; // Trả về true để không hiển thị lỗi
    }

    // Đặt trạng thái thành 'online' trước khi kiểm tra để tránh hiển thị thông báo không cần thiết
    // nếu sản phẩm đã tải thành công
    if (products && products.length > 0) {
      setApiHealthStatus('online');
    } else {
      setApiHealthStatus('checking');
    }

    try {
      const isHealthy = await checkApiHealth();
      setApiHealthStatus(isHealthy ? 'online' : 'offline');
      return isHealthy;
    } catch {
      setApiHealthStatus('offline');
      return false;
    }
  }, [checkApiHealth, products]);

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

  // Fetch light products method for shop
  const fetchLightProducts = useCallback(async (
    page = 1,
    limit = 10,
    search = '',
    brandId = '',
    categoryId = '',
    status = '',
    minPrice?: number,
    maxPrice?: number,
    tags = '',
    skinTypes = '',
    concerns = '',
    isBestSeller?: boolean,
    isNew?: boolean,
    isOnSale?: boolean,
    hasGifts?: boolean,
    sortBy = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ) => {
    try {
      // Check if the backend is online
      await handleCheckApiHealth();

      // Construct query params
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      if (search) params.append('search', search);
      if (brandId) params.append('brandId', brandId);
      if (categoryId) params.append('categoryId', categoryId);
      if (status) params.append('status', status);
      if (minPrice !== undefined) params.append('minPrice', minPrice.toString());
      if (maxPrice !== undefined) params.append('maxPrice', maxPrice.toString());
      if (tags) params.append('tags', tags);
      if (skinTypes) params.append('skinTypes', skinTypes);
      if (concerns) params.append('concerns', concerns);
      if (isBestSeller !== undefined) params.append('isBestSeller', isBestSeller.toString());
      if (isNew !== undefined) params.append('isNew', isNew.toString());
      if (isOnSale !== undefined) params.append('isOnSale', isOnSale.toString());
      if (hasGifts !== undefined) params.append('hasGifts', hasGifts.toString());
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);
      params.append('fields', 'light'); // Request lightweight format

      // Get token
      const token = localStorage.getItem('token') || Cookies.get('token');

      // Make API call
      const response = await fetch(`${API_URL}/products/light?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.status}`);
      }

      const data = await response.json();

      // Sử dụng cách fetch giống với fetchAdminProducts
      // kết quả sẽ cập nhật qua hook useProductAdmin
      await fetchAdminProducts({
        page: data.page,
        limit: data.limit,
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

    } catch (error: unknown) {
      console.error('Error fetching light products:', error);
    }
  }, [handleCheckApiHealth, fetchAdminProducts]);

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
    } catch (error: unknown) {
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
    } catch (error: unknown) {
      console.error('Error fetching product by slug:', error);
      throw error;
    }
  }, []);

  // Phương thức tải lên ảnh sản phẩm
  const uploadProductImage = useCallback(async (
    file: File,
    productId: string,
    isPrimary: boolean = false
  ) => {
    try {
      console.log(`Đang chuẩn bị tải lên ảnh cho sản phẩm ID: ${productId}, tên file: ${file.name}, kích thước: ${file.size} bytes, isPrimary: ${isPrimary}`);

      // Kiểm tra xem file có hợp lệ không
      if (!file || !(file instanceof File)) {
        throw new Error('Không phải là file hợp lệ');
      }

      // Kiểm tra định dạng file
      if (!file.type.match(/^image\/(jpeg|png|gif|jpg)$/)) {
        throw new Error(`File ${file.name} không được hỗ trợ. Chỉ hỗ trợ PNG, JPG, GIF.`);
      }

      // Kiểm tra kích thước file (tối đa 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error(`File ${file.name} quá lớn. Kích thước tối đa 5MB.`);
      }

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

      // Kiểm tra kết quả xem có phải URL base64 không
      if (result.url && result.url.startsWith('data:image')) {
        console.error('Lỗi: API trả về URL dạng base64');
        throw new Error('API trả về URL dạng base64');
      }

      console.log('Tải lên thành công với kết quả:', result);
      return result;
    } catch (error: unknown) {
      console.error('Error uploading product image:', error);
      if (error instanceof Error) {
        console.error('Chi tiết lỗi:', error.message);
      }
      throw error;
    }
  }, []);

  // Phương thức POST để tạo sản phẩm mới
  const createProduct = useCallback(async (productData: Partial<Product>): Promise<Product> => {
    try {
      // Tách hình ảnh ra khỏi dữ liệu ban đầu
      const { images, ...dataToSend } = productData;

      // Chỉ giữ lại các hình ảnh đã có URL hợp lệ từ Cloudinary (http/https)
      // Loại bỏ hoàn toàn các hình ảnh có file, preview, blob:, hoặc data:
      const validCloudinaryImages = images?.filter(img =>
        img.url &&
        !img.url.startsWith('data:') &&
        !img.url.startsWith('blob:') && // Explicitly filter blob URLs
        (img.url.startsWith('http://') || img.url.startsWith('https://')) // Ensure it's a real URL
      ) || [];

      // Loại bỏ các thuộc tính không cần thiết của ảnh như file, preview, id
      const cleanedImages = validCloudinaryImages.map(({ url, alt, publicId, isPrimary }) => ({
        url, alt, publicId, isPrimary
      }));

      // Chuẩn bị dữ liệu để gửi lên server
      const dataWithCleanedImages = {
        ...dataToSend,
        images: cleanedImages // Use the strictly filtered array
      };

      console.log('Đang tạo sản phẩm mới với dữ liệu (hình ảnh đã lọc):', dataWithCleanedImages); // Add logging

      const response = await fetch(`${API_URL}/admin/products`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataWithCleanedImages) // Send the strictly filtered data
      });

      if (!response.ok) {
        throw new Error(`Failed to create product: ${response.status}`);
      }

      const newProduct = await response.json();
      console.log('Sản phẩm mới đã được tạo với ID:', newProduct.id);

      // Tải lên các hình ảnh có file nhưng chưa có URL
      const imagesWithFile = images?.filter(img => img.file) || [];
      if (imagesWithFile.length > 0) {
        console.log(`Tìm thấy ${imagesWithFile.length} hình ảnh cần tải lên Cloudinary`);

        // Upload các hình ảnh lên Cloudinary using Promise.allSettled
        const uploadPromises = imagesWithFile
          .filter(image => image.file)
          .map(image => {
            console.log(`Chuẩn bị tải lên hình ảnh cho sản phẩm mới (ID: ${newProduct.id})`);
            // Return the promise from uploadProductImage
            return uploadProductImage(image.file!, newProduct.id, image.isPrimary)
              .then(result => ({ status: 'fulfilled', value: result, imageName: image.file?.name }))
              .catch(error => ({ status: 'rejected', reason: error, imageName: image.file?.name }));
          });

        if (uploadPromises.length > 0) {
          console.log(`Đang chờ ${uploadPromises.length} hình ảnh tải lên...`);
          const results = await Promise.allSettled(uploadPromises);
          results.forEach(result => {
            if (result.status === 'fulfilled') {
              // Access imageName from the wrapped result
              console.log(`Tải lên thành công cho hình ảnh: ${result.value.imageName}`);
            } else {
              // Access imageName from the wrapped result
              console.error(`Lỗi khi tải lên hình ảnh ${result.reason.imageName}:`, result.reason.reason);
            }
          });
          console.log('Tất cả các lần tải lên đã hoàn tất (thành công hoặc thất bại).');
        }
      }

      // Fetch lại sản phẩm để có dữ liệu mới nhất với URL hình ảnh *sau khi* tất cả upload đã xong
      console.log(`Đang fetch lại dữ liệu sản phẩm ID: ${newProduct.id} sau khi upload ảnh.`);
      const finalProduct = await fetchProductById(newProduct.id);

      // Refresh danh sách sản phẩm
      fetchAdminProducts();

      return finalProduct;
    } catch (error: unknown) {
      console.error('Error creating product:', error);
      throw error;
    }
  }, [fetchAdminProducts, uploadProductImage, fetchProductById]);

  // Phương thức PATCH để cập nhật sản phẩm
  const updateProduct = useCallback(async (id: string, productData: Partial<Product>): Promise<Product> => {
    try {
      // Tách hình ảnh ra khỏi dữ liệu ban đầu
      const { images, ...dataToSend } = productData;

      // Loại bỏ hoàn toàn các hình ảnh, chỉ giữ lại các hình ảnh đã có URL từ Cloudinary
      const validImages = images?.filter(img => img.url && !img.url.startsWith('data:') && img.url.startsWith('http')) || [];

      // Loại bỏ các thuộc tính không cần thiết của ảnh như file, preview
      const cleanedImages = validImages.map(({url, alt, publicId, isPrimary}) => ({
        url, alt, publicId, isPrimary
      }));

      // Chuẩn bị dữ liệu để gửi lên server
      const dataWithCleanedImages = {
        ...dataToSend,
        images: cleanedImages
      };

      console.log(`Đang cập nhật sản phẩm ID: ${id}...`);

      const response = await fetch(`${API_URL}/admin/products/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataWithCleanedImages)
      });

      if (!response.ok) {
        throw new Error(`Failed to update product: ${response.status}`);
      }

      await response.json();
      console.log('Sản phẩm đã được cập nhật thành công');

      // Tải lên các hình ảnh có file nhưng chưa có URL
      const imagesWithFile = images?.filter(img => img.file) || [];
      if (imagesWithFile.length > 0) {
        console.log(`Tìm thấy ${imagesWithFile.length} hình ảnh cần tải lên Cloudinary`);

        // Upload các hình ảnh lên Cloudinary
        for (const image of imagesWithFile) {
          if (image.file) {
            try {
              console.log(`Đang tải lên hình ảnh cho sản phẩm ID: ${id}`);
              await uploadProductImage(image.file, id, image.isPrimary);
              console.log('Tải lên hình ảnh thành công');
            } catch (uploadError) {
              console.error('Lỗi khi tải lên hình ảnh:', uploadError);
            }
          }
        }
      }

      // Fetch lại sản phẩm để có dữ liệu mới nhất với URL hình ảnh
      const freshProduct = await fetchProductById(id);

      // Refresh danh sách sản phẩm
      fetchAdminProducts();

      return freshProduct;
    } catch (error: unknown) {
      console.error('Error updating product:', error);
      throw error;
    }
  }, [fetchAdminProducts, uploadProductImage, fetchProductById]);

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
    } catch (error: unknown) {
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
    } catch (error: unknown) {
      console.error('Error updating inventory:', error);
      throw error;
    }
  }, [fetchAdminProducts]);

  // Phương thức POST để cập nhật tồn kho biến thể sản phẩm
  const updateVariantInventory = useCallback(async (id: string, branchId: string, variantId: string, quantity: number): Promise<Product> => {
    try {
      const response = await fetch(`${API_URL}/admin/products/${id}/inventory/${branchId}/variant/${variantId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ quantity })
      });

      if (!response.ok) {
        throw new Error(`Failed to update variant inventory: ${response.status}`);
      }

      const updatedProduct = await response.json();

      // Refresh danh sách sản phẩm
      fetchAdminProducts();

      return updatedProduct;
    } catch (error: unknown) {
      console.error('Error updating variant inventory:', error);
      throw error;
    }
  }, [fetchAdminProducts]);

  // Phương thức POST để cập nhật tồn kho tổ hợp biến thể sản phẩm
  const updateCombinationInventory = useCallback(async (id: string, branchId: string, variantId: string, combinationId: string, quantity: number): Promise<Product> => {
    try {
      const response = await fetch(`${API_URL}/admin/products/${id}/inventory/${branchId}/variant/${variantId}/combination/${combinationId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ quantity })
      });

      if (!response.ok) {
        throw new Error(`Failed to update combination inventory: ${response.status}`);
      }

      const updatedProduct = await response.json();

      // Refresh danh sách sản phẩm
      fetchAdminProducts();

      return updatedProduct;
    } catch (error: unknown) {
      console.error('Error updating combination inventory:', error);
      throw error;
    }
  }, [fetchAdminProducts]);

  // Phương thức PATCH để cập nhật flags sản phẩm
  const updateProductFlags = useCallback(async (id: string, flags: ProductFlags): Promise<Product> => {
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
    } catch (error: unknown) {
      console.error('Error updating product flags:', error);
      throw error;
    }
  }, [fetchAdminProducts]);

  // Hàm fetch thống kê
  const fetchStatistics = useCallback(async (): Promise<void> => {
    try {
      await fetchApiStatistics();
    } catch (error: unknown) {
      console.error('Error fetching statistics:', error);
    }
  }, [fetchApiStatistics]);

  // Phương thức POST để thêm biến thể sản phẩm
  const addVariant = useCallback(async (id: string, variantData: VariantData): Promise<Product> => {
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
    } catch (error: unknown) {
      console.error('Error adding product variant:', error);
      throw error;
    }
  }, []);

  // Phương thức PATCH để cập nhật biến thể sản phẩm
  const updateVariant = useCallback(async (id: string, variantId: string, variantData: VariantData): Promise<Product> => {
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
    } catch (error: unknown) {
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
    } catch (error: unknown) {
      console.error('Error removing product variant:', error);
      throw error;
    }
  }, []);

  // Phương thức cache (giữ lại để tương thích)
  const clearProductCache = useCallback((): void => {
    // With our new approach, we don't need caching as we use the hooks
    console.log('Cache clearing not needed, using direct API with hooks');
  }, []);

  // Phương thức để dọn dẹp dữ liệu base64 trong database
  const cleanupBase64Images = useCallback(async (): Promise<{ success: boolean; message: string; count: number }> => {
    try {
      console.log('Đang gửi yêu cầu dọn dẹp dữ liệu base64...');

      const response = await fetch(`${API_URL}/admin/products/cleanup-base64`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Lỗi khi dọn dẹp base64:', errorText);
        throw new Error(`Failed to cleanup base64 data: ${response.status}. Details: ${errorText}`);
      }

      const result = await response.json();
      console.log('Dọn dẹp dữ liệu base64 thành công:', result);
      return result;
    } catch (error: unknown) {
      console.error('Error cleaning up base64 data:', error);
      if (error instanceof Error) {
        console.error('Chi tiết lỗi:', error.message);
      }
      throw error;
    }
  }, []);

  // Hàm kiểm tra và dọn dẹp dữ liệu base64 tự động
  const autoCleanupBase64 = useCallback(async (): Promise<void> => {
    try {
      // Kiểm tra nếu có base64 trong hình ảnh sản phẩm
      const hasBase64Images = products.some(product => {
        // Kiểm tra trong mảng images
        if (product.images && product.images.some(img => img.url && img.url.startsWith('data:'))) {
          return true;
        }

        // Kiểm tra trong variants
        if (product.variants) {
          return product.variants.some(variant =>
            variant.images && variant.images.some(img => img.url && img.url.startsWith('data:'))
          );
        }

        return false;
      });

      // Nếu có dữ liệu base64, thực hiện dọn dẹp
      if (hasBase64Images) {
        console.log('Phát hiện dữ liệu base64 trong sản phẩm, tiến hành dọn dẹp tự động...');
        await cleanupBase64Images();
      }
    } catch (error) {
      console.error('Error during auto cleanup of base64 data:', error);
    }
  }, [products, cleanupBase64Images]);

  // Gọi hàm dọn dẹp tự động khi products thay đổi
  useEffect(() => {
    autoCleanupBase64();
  }, [autoCleanupBase64]);

  // Fetch admin product list (simplified for selection)
  const fetchAdminProductList = useCallback(async (params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    brandId?: string;
    categoryId?: string;
    minPrice?: number;
    maxPrice?: number;
    isBestSeller?: boolean;
    isNew?: boolean;
    isOnSale?: boolean;
    hasGifts?: boolean;
  } = {}): Promise<{ products: AdminProduct[]; total: number; totalPages: number }> => {
    try {
      await handleCheckApiHealth();
      const token = localStorage.getItem('adminToken') || Cookies.get('adminToken');
      if (!token) {
        throw new Error('Admin authentication required');
      }

      const queryParams = new URLSearchParams();
      queryParams.append('page', (params.page || 1).toString());
      queryParams.append('limit', (params.limit || 50).toString()); // Default to 50 for selection lists
      if (params.search) queryParams.append('search', params.search);
      if (params.status) queryParams.append('status', params.status);
      if (params.brandId) queryParams.append('brandId', params.brandId);
      if (params.categoryId) queryParams.append('categoryId', params.categoryId);
      if (params.minPrice) queryParams.append('minPrice', params.minPrice.toString());
      if (params.maxPrice) queryParams.append('maxPrice', params.maxPrice.toString());
      if (params.isBestSeller !== undefined) queryParams.append('isBestSeller', params.isBestSeller.toString());
      if (params.isNew !== undefined) queryParams.append('isNew', params.isNew.toString());
      if (params.isOnSale !== undefined) queryParams.append('isOnSale', params.isOnSale.toString());
      if (params.hasGifts !== undefined) queryParams.append('hasGifts', params.hasGifts.toString());
      queryParams.append('sortBy', params.sortBy || 'name'); // Default sort by name
      queryParams.append('sortOrder', params.sortOrder || 'asc');

      const apiUrl = `${API_URL}/admin/products/list?${queryParams.toString()}`;
      console.log(`Gọi API với URL: ${apiUrl}`);
      console.log(`Tham số được gửi đi:`, params);

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API không trả về kết quả ok, status: ${response.status}, error: ${errorText}`);
        throw new Error(`Failed to fetch admin product list: ${response.status}. Details: ${errorText}`);
      }

      const data = await response.json();
      console.log("Kết quả API trả về:", data);

      // Kiểm tra cấu trúc dữ liệu và thông báo lỗi nếu không đúng định dạng
      if (!data.items && !data.data) {
        console.error("API trả về dữ liệu không đúng cấu trúc:", data);
        throw new Error("API response is missing expected data structure");
      }

      return {
        products: data.items || data.data || [],
        total: data.total || 0,
        totalPages: data.totalPages || 1,
      };
    } catch (error: unknown) {
      console.error('Error fetching admin product list:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Lỗi khi tải danh sách sản phẩm: ${errorMessage}`);
      return { products: [], total: 0, totalPages: 1 }; // Return empty on error
    }
  }, [handleCheckApiHealth]);

  // Clone a product
  const cloneProduct = useCallback(async (id: string): Promise<Product> => {
    try {
      // Kiểm tra sức khỏe API
      await handleCheckApiHealth();

      const token = localStorage.getItem('adminToken') || Cookies.get('adminToken');
      if (!token) {
        throw new Error('Bạn cần đăng nhập để thực hiện thao tác này');
      }

      const response = await fetch(`${API_URL}/admin/products/${id}/clone`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Lưu trữ dữ liệu phản hồi
      let responseData;
      const responseText = await response.text();

      try {
        // Cố gắng phân tích dữ liệu JSON nếu có
        responseData = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        console.error('Lỗi khi phân tích dữ liệu JSON:', parseError);
        responseData = { message: responseText || 'Phản hồi không phải JSON hợp lệ' };
      }

      if (!response.ok) {
        console.error('Lỗi khi nhân bản sản phẩm:', responseData);
        throw new Error(responseData?.message || `Lỗi khi nhân bản sản phẩm: ${response.status}`);
      }

      // Cập nhật cache nếu cần
      clearProductCache();

      // Lưu ý: Không cần phải gọi response.json() nữa vì đã đọc và phân tích văn bản phản hồi
      // Chuyển đổi dữ liệu thành cấu trúc Product
      return responseData;
    } catch (error: unknown) {
      console.error('Lỗi khi nhân bản sản phẩm:', error);
      throw error;
    }
  }, [handleCheckApiHealth, clearProductCache]);

  // Phương thức tương tác với giỏ hàng
  const addToCart = useCallback(async (productId: string, quantity: number, variantId?: string) => {
    try {
      const token = Cookies.get('token');

      if (!token) {
        toast.error('Bạn cần đăng nhập để thêm sản phẩm vào giỏ hàng');
        return false;
      }

      const response = await fetch(`${API_URL}/cart/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId,
          quantity,
          variantId: variantId || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.message || 'Không thể thêm vào giỏ hàng');
        return false;
      }

      toast.success('Đã thêm sản phẩm vào giỏ hàng');

      // Dispatch event để cập nhật UI
      const event = new CustomEvent('cart:updated');
      window.dispatchEvent(event);

      return true;
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Đã xảy ra lỗi khi thêm vào giỏ hàng');
      return false;
    }
  }, []);

  const removeFromCart = useCallback(async (cartItemId: string) => {
    try {
      const token = Cookies.get('token');

      if (!token) {
        toast.error('Bạn cần đăng nhập để thực hiện thao tác này');
        return false;
      }

      const response = await fetch(`${API_URL}/cart/remove/${cartItemId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.message || 'Không thể xóa sản phẩm khỏi giỏ hàng');
        return false;
      }

      toast.success('Đã xóa sản phẩm khỏi giỏ hàng');

      // Dispatch event để cập nhật UI
      const event = new CustomEvent('cart:updated');
      window.dispatchEvent(event);

      return true;
    } catch (error) {
      console.error('Error removing from cart:', error);
      toast.error('Đã xảy ra lỗi khi xóa sản phẩm khỏi giỏ hàng');
      return false;
    }
  }, []);

  const updateCartQuantity = useCallback(async (cartItemId: string, quantity: number) => {
    try {
      const token = Cookies.get('token');

      if (!token) {
        toast.error('Bạn cần đăng nhập để thực hiện thao tác này');
        return false;
      }

      const response = await fetch(`${API_URL}/cart/update-quantity/${cartItemId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ quantity }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.message || 'Không thể cập nhật số lượng sản phẩm');
        return false;
      }

      // Dispatch event để cập nhật UI
      const event = new CustomEvent('cart:updated');
      window.dispatchEvent(event);

      return true;
    } catch (error) {
      console.error('Error updating cart quantity:', error);
      toast.error('Đã xảy ra lỗi khi cập nhật số lượng sản phẩm');
      return false;
    }
  }, []);

  const getCartItems = useCallback(async () => {
    try {
      const token = Cookies.get('token');

      if (!token) {
        return [];
      }

      const response = await fetch(`${API_URL}/cart`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return data.items || [];
    } catch (error) {
      console.error('Error fetching cart items:', error);
      return [];
    }
  }, []);

  // Phương thức tương tác với wishlist
  const addToWishlist = useCallback(async (productId: string) => {
    try {
      const token = Cookies.get('token');

      if (!token) {
        toast.error('Bạn cần đăng nhập để thêm sản phẩm vào danh sách yêu thích');
        return false;
      }

      const response = await fetch(`${API_URL}/wishlist/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId }),
      });

      if (!response.ok) {
        // Kiểm tra nếu sản phẩm đã có trong wishlist
        if (response.status === 409) {
          toast('Sản phẩm đã có trong danh sách yêu thích của bạn');
          return true;
        }

        const errorData = await response.json();
        toast.error(errorData.message || 'Không thể thêm vào danh sách yêu thích');
        return false;
      }

      toast.success('Đã thêm sản phẩm vào danh sách yêu thích');

      // Dispatch event để cập nhật UI
      const event = new CustomEvent('wishlist:updated');
      window.dispatchEvent(event);

      return true;
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      toast.error('Đã xảy ra lỗi khi thêm vào danh sách yêu thích');
      return false;
    }
  }, []);

  const removeFromWishlist = useCallback(async (productId: string) => {
    try {
      const token = Cookies.get('token');

      if (!token) {
        toast.error('Bạn cần đăng nhập để thực hiện thao tác này');
        return false;
      }

      const response = await fetch(`${API_URL}/wishlist/remove/${productId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.message || 'Không thể xóa sản phẩm khỏi danh sách yêu thích');
        return false;
      }

      toast.success('Đã xóa sản phẩm khỏi danh sách yêu thích');

      // Dispatch event để cập nhật UI
      const event = new CustomEvent('wishlist:updated');
      window.dispatchEvent(event);

      return true;
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      toast.error('Đã xảy ra lỗi khi xóa sản phẩm khỏi danh sách yêu thích');
      return false;
    }
  }, []);

  const getWishlistItems = useCallback(async () => {
    try {
      const token = Cookies.get('token');

      if (!token) {
        return [];
      }

      const response = await fetch(`${API_URL}/wishlist`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return data.items || [];
    } catch (error) {
      console.error('Error fetching wishlist items:', error);
      return [];
    }
  }, []);

  // Phương thức tương tác với đánh giá
  const addReview = useCallback(async (
    productId: string,
    rating: number,
    content: string,
    images?: File[]
  ) => {
    try {
      const token = Cookies.get('token');

      if (!token) {
        toast.error('Bạn cần đăng nhập để gửi đánh giá');
        return false;
      }

      const formData = new FormData();
      formData.append('productId', productId);
      formData.append('rating', rating.toString());
      formData.append('content', content);

      if (images && images.length > 0) {
        images.forEach(image => {
          formData.append('reviewImages', image);
        });
      }

      const response = await fetch(`${API_URL}/reviews`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.message || 'Không thể gửi đánh giá');
        return false;
      }

      toast.success('Đánh giá của bạn đã được gửi thành công');
      return true;
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Đã xảy ra lỗi khi gửi đánh giá');
      return false;
    }
  }, []);

  const getProductReviews = useCallback(async (productId: string, page = 1, limit = 10) => {
    try {
      const response = await fetch(
        `${API_URL}/reviews/product/${productId}?page=${page}&limit=${limit}`
      );

      if (!response.ok) {
        return { data: [], total: 0, totalPages: 0 };
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching product reviews:', error);
      return { data: [], total: 0, totalPages: 0 };
    }
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
    fetchLightProducts,
    fetchProductById,
    fetchProductBySlug,
    createProduct,
    updateProduct,
    deleteProduct,
    updateInventory,
    updateVariantInventory,
    updateCombinationInventory,
    updateProductFlags,
    addVariant,
    updateVariant,
    removeVariant,
    fetchStatistics,
    clearProductCache,
    cleanupBase64Images,
    cloneProduct,
    fetchAdminProductList,
    // Phương thức tương tác với giỏ hàng
    addToCart,
    removeFromCart,
    updateCartQuantity,
    getCartItems,
    // Phương thức tương tác với wishlist
    addToWishlist,
    removeFromWishlist,
    getWishlistItems,
    // Phương thức tương tác với đánh giá
    addReview,
    getProductReviews,
  };

  return (
    <ProductContext.Provider value={value}>
      {children}
    </ProductContext.Provider>
  );
};
