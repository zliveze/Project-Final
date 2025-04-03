# Tối ưu API cho trang Admin Sản phẩm

## Giới thiệu

Trong quá trình cải thiện hiệu năng của trang quản lý sản phẩm admin, chúng tôi đã phát hiện một số vấn đề hiệu năng:

1. API trả về quá nhiều dữ liệu không cần thiết cho giao diện
2. Xử lý dữ liệu trên client quá nhiều
3. Số lượng request API lớn
4. Tốc độ load trang chậm

Để giải quyết các vấn đề này, chúng tôi đã tối ưu API backend và tạo các hook mới cho frontend.

## Cải tiến Backend

### 1. API mới tối ưu cho danh sách sản phẩm Admin

Chúng tôi đã tạo endpoint API mới `GET /admin/products/list` chuyên biệt cho giao diện admin với nhiều cải tiến:

- Sử dụng MongoDB Aggregation Pipeline để lọc dữ liệu tại database
- Tính toán tổng số lượng hàng tồn kho từ server
- Chỉ trả về các trường dữ liệu cần thiết cho UI
- Định dạng đúng giá và các trường khác phù hợp với UI
- Lookup dữ liệu từ nhiều bảng trong một query (brands, categories)

### 2. DTO riêng biệt cho Admin UI

File `admin-list-product.dto.ts` định nghĩa chính xác cấu trúc dữ liệu cần thiết cho giao diện admin:

```typescript
export class AdminListProductItemDto {
  id: string;
  name: string;
  slug: string;
  sku: string;
  price: string;
  originalPrice: number;
  currentPrice: number;
  category: string;
  categoryIds: string[];
  brand: string;
  brandId: string;
  image: string;
  stock: number;
  status: string;
  flags: {
    isBestSeller: boolean;
    isNew: boolean;
    isOnSale: boolean;
    hasGifts: boolean;
  };
  createdAt: string;
  updatedAt: string;
}
```

### 3. Tối ưu truy vấn MongoDB

Sử dụng `$lookup`, `$addFields`, `$match`, `$project` và các toán tử MongoDB khác để tối ưu hiệu năng truy vấn:

```javascript
// Truy vấn sản phẩm với aggregation pipeline
const products = await this.productModel.aggregate([
  { $match: query },
  {
    $lookup: {
      from: 'brands',
      localField: 'brandId',
      foreignField: '_id',
      as: 'brandInfo'
    }
  },
  {
    $lookup: {
      from: 'categories',
      localField: 'categoryIds',
      foreignField: '_id',
      as: 'categoryInfo'
    }
  },
  {
    $addFields: {
      totalStock: {
        $sum: '$inventory.quantity'
      },
      primaryImage: {
        $ifNull: [
          { $arrayElemAt: [{ $filter: { input: '$images', as: 'img', cond: { $eq: ['$$img.isPrimary', true] } } }, 0] },
          { $arrayElemAt: ['$images', 0] },
          { url: '' }
        ]
      },
    }
  },
  {
    $project: {
      _id: 1,
      name: 1,
      slug: 1,
      sku: 1,
      price: 1,
      currentPrice: 1,
      status: 1,
      brandId: 1,
      categoryIds: 1,
      brandName: { $ifNull: [{ $arrayElemAt: ['$brandInfo.name', 0] }, ''] },
      categoryNames: '$categoryInfo.name',
      image: '$primaryImage.url',
      stock: '$totalStock',
      flags: 1,
      createdAt: 1,
      updatedAt: 1,
    }
  },
]);
```

## Cải tiến Frontend

### Hook useProductAdmin mới

Chúng tôi đã tạo hook `useProductAdmin` để kết nối với API đã tối ưu:

```typescript
export const useProductAdmin = ({ initialPage = 1, initialLimit = 10 } = {}) => {
  // ... implementation ...
  return {
    products,
    loading,
    error,
    filters,
    totalItems,
    totalPages,
    selectedProductIds,
    fetchProducts,
    changePage,
    changeLimit,
    searchProducts,
    applyFilters,
    toggleProductSelection,
    selectAllProducts,
    clearSelection,
    deleteMultipleProducts,
    updateMultipleProductsStatus,
    updateMultipleProductsFlag,
    isAllSelected,
    hasSelection
  };
};
```

## Lợi ích

1. **Giảm kích thước dữ liệu**: Giảm tối đa dữ liệu được truyền qua mạng
2. **Giảm xử lý ở client**: Tính toán được thực hiện tại server
3. **Giảm số lượng request**: Data được lấy trong một request
4. **Tăng tốc độ tải**: API phản hồi nhanh hơn nhờ truy vấn tối ưu
5. **Cải thiện trải nghiệm**: Giao diện mượt mà và phản hồi nhanh chóng

## Cách sử dụng

Để sử dụng API đã tối ưu, hãy import hook `useProductAdmin`:

```typescript
import { useProductAdmin } from '@/hooks/useProductAdmin';

function ProductsPage() {
  const {
    products,
    loading,
    totalItems,
    // ... other properties and methods
  } = useProductAdmin();
  
  // ... rest of component
}
``` 