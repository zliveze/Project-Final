import React, { createContext, useContext, useState, useCallback } from 'react';
import { Product } from '@/contexts/ProductContext';
import axios from 'axios';

interface Pagination {
  total: number;
  page: number;
  limit: number;
}

interface SearchParams {
  page: number;
  limit: number;
  search?: string;
  brandId?: string;
  categoryId?: string;
}

interface ProductResponse {
  _id?: string;
  id?: string;
  name: string;
  sku: string;
  price: number;
  currentPrice?: number;
  images?: Array<{
    url: string;
    alt?: string;
  }>;
  status?: string;
}

interface VoucherProductSearchContextType {
  products: Product[];
  pagination: Pagination | null;
  loading: boolean;
  error: any;
  searchProducts: (params: SearchParams) => Promise<void>;
}

const VoucherProductSearchContext = createContext<VoucherProductSearchContextType | undefined>(undefined);

export const VoucherProductSearchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const searchProducts = useCallback(async (params: SearchParams) => {
    try {
      setLoading(true);
      setError(null);

      // Lấy token từ localStorage
      const token = localStorage.getItem('adminToken');
      if (!token) {
        throw new Error('Không tìm thấy token xác thực');
      }

      // Tạo query params
      const queryParams = new URLSearchParams();
      queryParams.append('page', params.page.toString());
      queryParams.append('limit', params.limit.toString());
      if (params.search) queryParams.append('search', params.search);
      if (params.brandId) queryParams.append('brandId', params.brandId);
      if (params.categoryId) queryParams.append('categoryId', params.categoryId);

      console.log('Gọi API với URL:', `${API_URL}/admin/products?${queryParams.toString()}`);

      const response = await axios.get(`${API_URL}/admin/products`, {
        params: {
          page: params.page,
          limit: params.limit,
          search: params.search,
          brandId: params.brandId,
          categoryId: params.categoryId
        },
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      // Kiểm tra và chuyển đổi dữ liệu
      const responseData = response.data;
      console.log('Dữ liệu nhận được:', responseData);

      const productsData = Array.isArray(responseData.items) ? responseData.items : 
                          Array.isArray(responseData.data) ? responseData.data : [];
      
      // Chuyển đổi dữ liệu sản phẩm
      const transformedProducts = productsData.map((product: ProductResponse) => ({
        _id: product._id || product.id,
        id: product._id || product.id,
        name: product.name,
        sku: product.sku,
        price: product.price,
        currentPrice: product.currentPrice,
        images: product.images,
        status: product.status
      }));

      setProducts(transformedProducts);
      setPagination({
        total: responseData.total || responseData.totalItems || 0,
        page: responseData.page || responseData.currentPage || params.page,
        limit: responseData.limit || responseData.itemsPerPage || params.limit
      });

      console.log('Đã tải được', transformedProducts.length, 'sản phẩm');
    } catch (err: any) {
      console.error('Lỗi khi tìm kiếm sản phẩm:', err);
      setError(err.response?.data?.message || err.message || 'Có lỗi xảy ra khi tải sản phẩm');
      setProducts([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  return (
    <VoucherProductSearchContext.Provider
      value={{
        products,
        pagination,
        loading,
        error,
        searchProducts
      }}
    >
      {children}
    </VoucherProductSearchContext.Provider>
  );
};

export const useVoucherProductSearch = () => {
  const context = useContext(VoucherProductSearchContext);
  if (context === undefined) {
    throw new Error('useVoucherProductSearch must be used within a VoucherProductSearchProvider');
  }
  return context;
}; 