# Hướng Dẫn Triển Khai Tích Hợp Header và SubNavigation

## Tổng Quan

Tài liệu này cung cấp các bước chi tiết để triển khai kế hoạch tích hợp Header và SubNavigation như đã mô tả trong các tài liệu kế hoạch và tóm tắt. Quá trình triển khai sẽ được chia thành 4 giai đoạn chính với các bước cụ thể trong mỗi giai đoạn.

## Giai Đoạn 1: Tái Cấu Trúc và Gộp Components

### Bước 1: Tạo Cấu Trúc Thư Mục Mới
```bash
mkdir -p src/components/common/header
```

### Bước 2: Tạo Context cho Header
1. Tạo file `src/context/HeaderContext.tsx`:
```bash
touch src/context/HeaderContext.tsx
```

2. Triển khai HeaderContext như trong mẫu mockup đã cung cấp:
```typescript
// Sao chép code từ mockup vào file HeaderContext.tsx
```

### Bước 3: Tạo Các Component Con
1. Tạo các file component mới:
```bash
touch src/components/common/header/MainHeader.tsx
touch src/components/common/header/TopHeader.tsx
touch src/components/common/header/MiddleHeader.tsx
touch src/components/common/header/BottomHeader.tsx
touch src/components/common/header/MobileSideMenu.tsx
touch src/components/common/header/CategoryMegaMenu.tsx
```

2. Triển khai từng component theo mockup đã cung cấp:
   - MainHeader.tsx: Component chính gộp tất cả các phần
   - TopHeader.tsx: Hiển thị thông báo 
   - MiddleHeader.tsx: Logo, tìm kiếm, giỏ hàng, wishlist, tài khoản
   - BottomHeader.tsx: Navigation chính (danh mục, thương hiệu, ...)
   - MobileSideMenu.tsx: Menu mobile tích hợp tất cả chức năng
   - CategoryMegaMenu.tsx: Menu danh mục nâng cao

### Bước 4: Cập Nhật Layout
1. Chỉnh sửa `src/layout/MainLayout.tsx` để sử dụng MainHeader mới:
```typescript
// Import HeaderProvider và MainHeader
// Bọc ứng dụng bằng HeaderProvider
// Thay thế Header và SubNavigation cũ bằng MainHeader
```

## Giai Đoạn 2: Tích Hợp Dữ Liệu Động

### Bước 1: Tạo API Endpoints
1. Tạo các API endpoints cần thiết trong thư mục `src/pages/api`:
```bash
mkdir -p src/pages/api/categories
mkdir -p src/pages/api/brands
mkdir -p src/pages/api/notifications
touch src/pages/api/categories/index.ts
touch src/pages/api/brands/index.ts
touch src/pages/api/notifications/active.ts
```

2. Triển khai API handlers để trả về dữ liệu từ các model:
```typescript
// src/pages/api/categories/index.ts
// Triển khai API để lấy danh mục

// src/pages/api/brands/index.ts
// Triển khai API để lấy thương hiệu với tham số ?featured=true

// src/pages/api/notifications/active.ts
// Triển khai API để lấy các thông báo đang hoạt động
```

### Bước 2: Tạo và Tích Hợp Hooks
1. Tạo các hooks để tải dữ liệu từ API:
```bash
mkdir -p src/hooks
touch src/hooks/useCategories.ts
touch src/hooks/useBrands.ts
touch src/hooks/useNotifications.ts
touch src/hooks/useCart.ts
```

2. Triển khai các hooks sử dụng SWR hoặc React Query:
```typescript
// src/hooks/useCategories.ts
import useSWR from 'swr';

export function useCategories() {
  const { data, error, isLoading } = useSWR('/api/categories');
  return {
    categories: data || [],
    isLoading,
    isError: error
  };
}

// Tương tự cho các hooks khác
```

3. Cập nhật HeaderContext để sử dụng các hooks này:
```typescript
// src/context/HeaderContext.tsx
import { useCategories } from '@/hooks/useCategories';
import { useBrands } from '@/hooks/useBrands';
import { useNotifications } from '@/hooks/useNotifications';
import { useCart } from '@/hooks/useCart';

// Sử dụng các hooks trong provider
```

## Giai Đoạn 3: Nâng Cấp UI/UX

### Bước 1: Mega Menu cho Danh Mục
1. Cập nhật `CategoryMegaMenu.tsx` với thiết kế mới:
```typescript
// Thay đổi layout thành grid với hình ảnh và nhiều cột
// Thêm phần quảng cáo ưu đãi đặc biệt
```

### Bước 2: Cải Thiện Menu Mobile
1. Nâng cấp `MobileSideMenu.tsx` với trải nghiệm tốt hơn:
```typescript
// Thêm hiệu ứng chuyển đổi mượt mà
// Cải thiện khả năng hiển thị danh mục con
// Thêm phần hiển thị thông tin người dùng
```

### Bước 3: Thêm Hiệu Ứng Chuyển Đổi
1. Thêm hiệu ứng khi hover vào các menu items:
```typescript
// Thêm hiệu ứng hover cho các liên kết
// Thêm hiệu ứng tooltip cho các icon
```

2. Tối ưu hóa hiệu ứng hiển thị/ẩn menu:
```typescript
// Sử dụng Framer Motion hoặc CSS transitions
// Đảm bảo trải nghiệm mượt mà khi mở/đóng menu
```

## Giai Đoạn 4: Kiểm Thử và Triển Khai

### Bước 1: Kiểm Thử Chức Năng
1. Kiểm tra tất cả các chức năng:
   - Hiển thị/ẩn mega menu
   - Hoạt động của mobile menu
   - Hiển thị thông báo hệ thống
   - Tải dữ liệu từ API

2. Kiểm tra trên các thiết bị khác nhau:
   - Desktop (các kích thước màn hình khác nhau)
   - Tablet (ngang và dọc)
   - Mobile (các kích thước khác nhau)

### Bước 2: Tối Ưu Hiệu Suất
1. Tối ưu hóa tải dữ liệu:
```typescript
// Thêm caching cho API calls
// Sử dụng SWR/React Query options như revalidation intervals
```

2. Tối ưu hóa rendering:
```typescript
// Sử dụng React.memo cho các component con
// Tối ưu re-renders bằng useMemo và useCallback
```

### Bước 3: Đảm Bảo Khả Năng Truy Cập
1. Kiểm tra và cải thiện accessibility:
   - Thêm ARIA attributes cho các menu
   - Đảm bảo keyboard navigation hoạt động tốt
   - Kiểm tra độ tương phản màu sắc

### Bước 4: Triển Khai
1. Loại bỏ các component cũ không còn sử dụng:
```bash
# Chỉ sau khi đảm bảo tất cả hoạt động tốt
rm src/components/common/Header.tsx
rm src/components/common/SubNavigation.tsx
```

2. Cập nhật tất cả các trang sử dụng Header và SubNavigation để sử dụng MainLayout mới

## Các Vấn Đề Tiềm Ẩn và Giải Pháp

### 1. Trạng Thái Toàn Cục
- **Vấn Đề**: Context có thể gây ra re-renders không cần thiết
- **Giải Pháp**: Chia nhỏ context hoặc sử dụng các kỹ thuật như context selectors

### 2. Hiệu Suất Mobile
- **Vấn Đề**: Menu phức tạp có thể chậm trên thiết bị cũ
- **Giải Pháp**: Lazy load các thành phần không cần thiết, sử dụng skeleton loading

### 3. Khả Năng Mở Rộng
- **Vấn Đề**: Cấu trúc cứng nhắc có thể khó thêm tính năng mới
- **Giải Pháp**: Thiết kế các component có khả năng cấu hình cao, tận dụng composition

## Checklist Triển Khai

- [ ] Tạo cấu trúc thư mục mới
- [ ] Tạo HeaderContext
- [ ] Triển khai các component con
- [ ] Cập nhật Layout để sử dụng MainHeader
- [ ] Tạo API endpoints
- [ ] Tích hợp dữ liệu động
- [ ] Nâng cấp UI/UX
- [ ] Kiểm thử trên các thiết bị
- [ ] Tối ưu hiệu suất
- [ ] Đảm bảo khả năng truy cập
- [ ] Loại bỏ code cũ
- [ ] Triển khai lên môi trường production 