# Hướng dẫn triển khai tối ưu hóa module Products

Dựa trên kế hoạch tối ưu hóa hệ thống admin, đây là hướng dẫn cụ thể để triển khai tối ưu hóa cho module Products - một trong những module phức tạp nhất của hệ thống.

## Phân tích hiện trạng

Sau khi phân tích cấu trúc module Products, tôi nhận thấy:

1. Module có cấu trúc phân chia khá tốt giữa components, hooks và types
2. ProductForm là phần phức tạp nhất với nhiều tabs và các thành phần UI tương tác
3. Chưa thấy chiến lược quản lý state tập trung
4. Có thể có các network requests trùng lặp hoặc không cần thiết
5. Hiệu suất render có thể bị ảnh hưởng khi danh sách sản phẩm lớn

## Các bước triển khai tối ưu hóa

### 1. Tối ưu hóa state management

```typescript
// src/context/admin/ProductsContext.tsx
import { createContext, useContext, useReducer, ReactNode } from 'react';
import { ProductState, ProductAction, initialProductState, productsReducer } from './productsReducer';

const ProductsContext = createContext<{
  state: ProductState;
  dispatch: React.Dispatch<ProductAction>;
} | undefined>(undefined);

export const ProductsProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(productsReducer, initialProductState);
  
  return (
    <ProductsContext.Provider value={{ state, dispatch }}>
      {children}
    </ProductsContext.Provider>
  );
};

export const useProductsContext = () => {
  const context = useContext(ProductsContext);
  if (context === undefined) {
    throw new Error('useProductsContext must be used within a ProductsProvider');
  }
  return context;
};
```

```typescript
// src/context/admin/productsReducer.ts
import { Product, ProductFilter } from '@/components/admin/products/types';

export interface ProductState {
  products: Product[];
  filteredProducts: Product[];
  selectedProducts: string[];
  expandedProduct: string | null;
  isLoading: boolean;
  error: string | null;
  filter: ProductFilter;
  pagination: {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
  };
  stats: {
    totalActive: number;
    totalOutOfStock: number;
    totalDiscontinued: number;
  };
}

export type ProductAction =
  | { type: 'FETCH_PRODUCTS_START' }
  | { type: 'FETCH_PRODUCTS_SUCCESS'; payload: Product[] }
  | { type: 'FETCH_PRODUCTS_ERROR'; payload: string }
  | { type: 'FILTER_PRODUCTS'; payload: ProductFilter }
  | { type: 'SELECT_PRODUCT'; payload: string }
  | { type: 'DESELECT_PRODUCT'; payload: string }
  | { type: 'SELECT_ALL_PRODUCTS' }
  | { type: 'DESELECT_ALL_PRODUCTS' }
  | { type: 'SET_PAGE'; payload: number }
  | { type: 'SET_ITEMS_PER_PAGE'; payload: number }
  | { type: 'TOGGLE_EXPAND_PRODUCT'; payload: string }
  | { type: 'ADD_PRODUCT'; payload: Product }
  | { type: 'UPDATE_PRODUCT'; payload: Product }
  | { type: 'DELETE_PRODUCT'; payload: string }
  | { type: 'DELETE_MULTIPLE_PRODUCTS'; payload: string[] }
  | { type: 'UPDATE_PRODUCT_STATUS'; payload: { id: string; status: string } }
  | { type: 'UPDATE_MULTIPLE_PRODUCT_STATUS'; payload: { ids: string[]; status: string } };

export const initialProductState: ProductState = {
  products: [],
  filteredProducts: [],
  selectedProducts: [],
  expandedProduct: null,
  isLoading: false,
  error: null,
  filter: {
    search: '',
    category: '',
    brand: '',
    status: '',
    priceRange: { min: 0, max: 0 },
    dateRange: { start: null, end: null },
    sortBy: 'createdAt',
    sortOrder: 'desc',
  },
  pagination: {
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0,
  },
  stats: {
    totalActive: 0,
    totalOutOfStock: 0,
    totalDiscontinued: 0,
  },
};

export const productsReducer = (state: ProductState, action: ProductAction): ProductState => {
  switch (action.type) {
    case 'FETCH_PRODUCTS_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'FETCH_PRODUCTS_SUCCESS':
      const products = action.payload;
      return {
        ...state,
        isLoading: false,
        products,
        filteredProducts: products,
        pagination: {
          ...state.pagination,
          totalItems: products.length,
        },
        stats: {
          totalActive: products.filter(p => p.status === 'active').length,
          totalOutOfStock: products.filter(p => p.status === 'out_of_stock').length,
          totalDiscontinued: products.filter(p => p.status === 'discontinued').length,
        },
      };
    case 'FETCH_PRODUCTS_ERROR':
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      };
    // Thêm các case xử lý các action khác
    // ...
    default:
      return state;
  }
};
```

### 2. Tối ưu hóa data fetching với React Query

```typescript
// src/hooks/admin/useProducts.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProductFilter } from '@/components/admin/products/types';
import { fetchProducts, createProduct, updateProduct, deleteProduct } from '@/services/api/products';

export const useProducts = (filter: ProductFilter) => {
  return useQuery({
    queryKey: ['products', filter],
    queryFn: () => fetchProducts(filter),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    }
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateProduct,
    onSuccess: (updatedProduct) => {
      queryClient.setQueryData(['product', updatedProduct.id], updatedProduct);
      queryClient.invalidateQueries({ queryKey: ['products'] });
    }
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteProduct,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    }
  });
};
```

### 3. Tối ưu hóa ProductTable với virtualization

```tsx
// src/components/admin/products/components/ProductTable.tsx
import { useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { useProductsContext } from '@/context/admin/ProductsContext';
import ProductTableRow from './ProductTableRow';

const ProductTable = () => {
  const { state, dispatch } = useProductsContext();
  const { filteredProducts, selectedProducts, expandedProduct } = state;

  const toggleSelection = (id: string) => {
    if (selectedProducts.includes(id)) {
      dispatch({ type: 'DESELECT_PRODUCT', payload: id });
    } else {
      dispatch({ type: 'SELECT_PRODUCT', payload: id });
    }
  };

  const toggleExpand = (id: string) => {
    dispatch({ type: 'TOGGLE_EXPAND_PRODUCT', payload: id });
  };

  const toggleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      dispatch({ type: 'DESELECT_ALL_PRODUCTS' });
    } else {
      dispatch({ type: 'SELECT_ALL_PRODUCTS' });
    }
  };

  // Memoize rows để tránh re-render không cần thiết
  const rowData = useMemo(() => {
    return filteredProducts.map(product => ({
      product,
      isSelected: selectedProducts.includes(product.id),
      isExpanded: expandedProduct === product.id,
    }));
  }, [filteredProducts, selectedProducts, expandedProduct]);

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const { product, isSelected, isExpanded } = rowData[index];
    
    return (
      <div style={style}>
        <ProductTableRow
          product={product}
          isSelected={isSelected}
          isExpanded={isExpanded}
          onSelect={() => toggleSelection(product.id)}
          onExpand={() => toggleExpand(product.id)}
        />
      </div>
    );
  };

  if (filteredProducts.length === 0) {
    return <div className="text-center py-8">Không có sản phẩm nào được tìm thấy</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <input
                  type="checkbox"
                  checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sản phẩm
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                SKU
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Giá
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tồn kho
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trạng thái
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Hành động
              </th>
            </tr>
          </thead>
        </table>

        <div style={{ height: 'calc(100vh - 300px)', width: '100%' }}>
          <AutoSizer>
            {({ height, width }) => (
              <List
                height={height}
                itemCount={rowData.length}
                itemSize={80} // Chiều cao mỗi hàng
                width={width}
              >
                {Row}
              </List>
            )}
          </AutoSizer>
        </div>
      </div>
    </div>
  );
};

export default ProductTable;
```

### 4. Tối ưu hóa ProductForm với React Hook Form

```tsx
// src/components/admin/products/ProductForm/index.tsx
import { useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Tab } from '@headlessui/react';
import BasicInfoTab from './tabs/BasicInfoTab';
import ImagesAndVariantsTab from './tabs/ImagesAndVariantsTab';
import InventoryTab from './tabs/InventoryTab';
import SeoDescriptionTab from './tabs/SeoDescriptionTab';
import CosmeticInfoTab from './tabs/CosmeticInfoTab';
import GiftsTab from './tabs/GiftsTab';
import { Product } from '@/components/admin/products/types';

// Schema validation
const productSchema = yup.object({
  name: yup.string().required('Tên sản phẩm là bắt buộc'),
  sku: yup.string().required('SKU là bắt buộc'),
  price: yup.number().required('Giá sản phẩm là bắt buộc').min(0, 'Giá không được âm'),
  // Thêm các validation rules khác
}).required();

type ProductFormProps = {
  initialData?: Partial<Product>;
  onSubmit: (data: Product) => void;
  isLoading?: boolean;
};

const ProductForm = ({ initialData = {}, onSubmit, isLoading = false }: ProductFormProps) => {
  const methods = useForm({
    resolver: yupResolver(productSchema),
    defaultValues: {
      name: '',
      sku: '',
      price: 0,
      currentPrice: 0,
      description: {
        short: '',
        full: '',
      },
      seo: {
        metaTitle: '',
        metaDescription: '',
        keywords: [],
      },
      status: 'active',
      brandId: '',
      categoryIds: [],
      tags: [],
      cosmetic_info: {
        skinType: [],
        concerns: [],
        ingredients: [],
        volume: {
          value: 0,
          unit: 'ml',
        },
        usage: '',
        madeIn: '',
        expiry: {
          shelf: 24,
          afterOpening: 12,
        },
      },
      variants: [],
      images: [],
      inventory: [],
      flags: {
        isBestSeller: false,
        isNew: false,
        isOnSale: false,
        hasGifts: false,
      },
      gifts: [],
      ...initialData,
    },
  });

  // Cập nhật form khi initialData thay đổi
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      Object.entries(initialData).forEach(([key, value]) => {
        methods.setValue(key as any, value as any);
      });
    }
  }, [initialData, methods]);

  const handleSubmit = methods.handleSubmit((data) => {
    onSubmit(data as Product);
  });

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <Tab.Group>
          <Tab.List className="flex space-x-1 border-b border-gray-200">
            <Tab className={({ selected }) =>
              `px-4 py-2 text-sm font-medium ${
                selected
                  ? 'text-pink-600 border-b-2 border-pink-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`
            }>
              Thông tin cơ bản
            </Tab>
            <Tab className={({ selected }) =>
              `px-4 py-2 text-sm font-medium ${
                selected
                  ? 'text-pink-600 border-b-2 border-pink-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`
            }>
              Hình ảnh & Biến thể
            </Tab>
            <Tab className={({ selected }) =>
              `px-4 py-2 text-sm font-medium ${
                selected
                  ? 'text-pink-600 border-b-2 border-pink-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`
            }>
              Kho hàng
            </Tab>
            <Tab className={({ selected }) =>
              `px-4 py-2 text-sm font-medium ${
                selected
                  ? 'text-pink-600 border-b-2 border-pink-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`
            }>
              SEO & Mô tả
            </Tab>
            <Tab className={({ selected }) =>
              `px-4 py-2 text-sm font-medium ${
                selected
                  ? 'text-pink-600 border-b-2 border-pink-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`
            }>
              Thông tin mỹ phẩm
            </Tab>
            <Tab className={({ selected }) =>
              `px-4 py-2 text-sm font-medium ${
                selected
                  ? 'text-pink-600 border-b-2 border-pink-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`
            }>
              Quà tặng
            </Tab>
          </Tab.List>
          <Tab.Panels className="mt-4">
            <Tab.Panel>
              <BasicInfoTab />
            </Tab.Panel>
            <Tab.Panel>
              <ImagesAndVariantsTab />
            </Tab.Panel>
            <Tab.Panel>
              <InventoryTab />
            </Tab.Panel>
            <Tab.Panel>
              <SeoDescriptionTab />
            </Tab.Panel>
            <Tab.Panel>
              <CosmeticInfoTab />
            </Tab.Panel>
            <Tab.Panel>
              <GiftsTab />
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-pink-500"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-pink-600 text-white rounded-md shadow-sm hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 disabled:opacity-50"
          >
            {isLoading ? 'Đang lưu...' : 'Lưu sản phẩm'}
          </button>
        </div>
      </form>
    </FormProvider>
  );
};

export default ProductForm;
```

### 5. Server-side Pagination và Filtering

```typescript
// src/pages/admin/products/index.tsx
import { useState } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '@/components/admin/AdminLayout';
import ProductTable from '@/components/admin/products/components/ProductTable';
import ProductTableSummary from '@/components/admin/products/components/ProductTableSummary';
import ProductFilter from '@/components/admin/products/components/ProductFilter';
import BulkActionBar from '@/components/admin/products/components/BulkActionBar';
import { Pagination } from '@/components/admin/common';
import { ProductsProvider } from '@/context/admin/ProductsContext';
import { useProducts } from '@/hooks/admin/useProducts';
import { ProductFilterState } from '@/components/admin/products/components/ProductFilter';

export default function AdminProducts() {
  const router = useRouter();
  const { page = '1', limit = '10', ...queryParams } = router.query;
  
  const [filterState, setFilterState] = useState<ProductFilterState>({
    search: queryParams.search as string || '',
    category: queryParams.category as string || '',
    brand: queryParams.brand as string || '',
    status: queryParams.status as string || '',
    priceRange: {
      min: Number(queryParams.minPrice) || 0,
      max: Number(queryParams.maxPrice) || 0,
    },
    sortBy: queryParams.sortBy as string || 'createdAt',
    sortOrder: queryParams.sortOrder as 'asc' | 'desc' || 'desc',
  });

  // Sử dụng React Query để fetch dữ liệu
  const { data, isLoading, error } = useProducts({
    ...filterState,
    page: Number(page),
    limit: Number(limit),
  });

  const handlePageChange = (newPage: number) => {
    router.push({
      pathname: router.pathname,
      query: { ...router.query, page: newPage.toString() },
    });
  };

  const handleLimitChange = (newLimit: number) => {
    router.push({
      pathname: router.pathname,
      query: { ...router.query, limit: newLimit.toString(), page: '1' },
    });
  };

  const handleFilterChange = (newFilter: ProductFilterState) => {
    setFilterState(newFilter);
    
    // Cập nhật URL với filter mới
    router.push({
      pathname: router.pathname,
      query: {
        page: '1',
        limit,
        search: newFilter.search || undefined,
        category: newFilter.category || undefined,
        brand: newFilter.brand || undefined,
        status: newFilter.status || undefined,
        minPrice: newFilter.priceRange.min || undefined,
        maxPrice: newFilter.priceRange.max || undefined,
        sortBy: newFilter.sortBy || undefined,
        sortOrder: newFilter.sortOrder || undefined,
      },
    });
  };

  return (
    <AdminLayout title="Quản lý sản phẩm">
      <ProductsProvider>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <ProductTableSummary
              totalItems={data?.totalItems || 0}
              totalActive={data?.stats.totalActive || 0}
              totalOutOfStock={data?.stats.totalOutOfStock || 0}
              totalDiscontinued={data?.stats.totalDiscontinued || 0}
            />
            
            <div className="flex flex-col sm:flex-row gap-2">
              <button className="px-4 py-2 bg-pink-600 text-white rounded-md shadow-sm hover:bg-pink-700">
                Thêm sản phẩm
              </button>
              <button className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">
                Xuất dữ liệu
              </button>
              <button className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">
                Nhập dữ liệu
              </button>
            </div>
          </div>

          <ProductFilter
            filter={filterState}
            onFilterChange={handleFilterChange}
          />
          
          <BulkActionBar />

          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-600 p-4 rounded-md">
              Đã xảy ra lỗi khi tải dữ liệu. Vui lòng thử lại sau.
            </div>
          ) : (
            <>
              <ProductTable
                products={data?.products || []}
              />
              
              <Pagination
                currentPage={Number(page)}
                totalItems={data?.totalItems || 0}
                itemsPerPage={Number(limit)}
                onPageChange={handlePageChange}
                onItemsPerPageChange={handleLimitChange}
              />
            </>
          )}
        </div>
      </ProductsProvider>
    </AdminLayout>
  );
}

// Server-side data fetching
export const getServerSideProps = async (context) => {
  // Ở đây có thể thực hiện prefetch data cho React Query
  // hoặc cung cấp dữ liệu ban đầu để tránh loading state khi client-side render
  return {
    props: {}, // will be passed to the page component as props
  };
};
```

## Kết quả kỳ vọng

Sau khi triển khai các tối ưu hóa trên, module Products sẽ có:

1. **Hiệu suất render tốt hơn**: Nhờ virtualization và tối ưu React hooks
2. **Quản lý state tập trung**: Sử dụng Context API + useReducer
3. **Caching và tái sử dụng data**: Nhờ React Query
4. **Pagination và filtering hiệu quả**: Chuyển sang server-side
5. **Form handling tối ưu**: Sử dụng React Hook Form
6. **Code splitting**: Tải các tab của form khi cần thiết

## Các bước triển khai

1. Triển khai Context API và reducer
2. Tích hợp React Query
3. Cập nhật ProductTable với virtualization
4. Nâng cấp ProductForm với React Hook Form
5. Triển khai server-side pagination và filtering
6. Thực hiện code splitting nâng cao 