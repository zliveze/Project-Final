# Tóm Tắt Kế Hoạch Tích Hợp Header và SubNavigation

## Tổng Quan

Dự án này nhằm gộp hai component `Header.tsx` và `SubNavigation.tsx` thành một hệ thống header thống nhất với UI/UX được cải thiện và logic quản lý hiệu quả hơn. Mục tiêu là tạo ra một trải nghiệm người dùng liền mạch và thân thiện hơn, đồng thời đơn giản hóa cấu trúc code.

## Những Vấn Đề Hiện Tại

1. **Trùng lặp code**: Cả hai component đều chứa logic mobile menu riêng biệt
2. **Quản lý trạng thái phân tán**: Trạng thái menu được quản lý riêng lẻ trong từng component
3. **Thiếu tích hợp dữ liệu động**: Menu danh mục hiện đang hardcode thay vì lấy từ API
4. **Thiếu sự nhất quán**: Một số phần UI thiếu sự nhất quán trong thiết kế

## Giải Pháp Đề Xuất

### Cấu Trúc Mới

```
- MainHeader/
  ├── TopHeader (thông báo từ model Notifications)
  ├── MiddleHeader (logo, tìm kiếm, tài khoản, giỏ hàng)
  ├── BottomHeader (điều hướng, danh mục)
  └── MobileSideMenu (menu mobile tích hợp)
```

### Các Tính Năng Chính

1. **Tích hợp dữ liệu động**:
   - Danh mục sản phẩm (từ model Categories)
   - Thương hiệu nổi bật (từ model Brands)
   - Thông báo hệ thống (từ model Notifications)

2. **Cải tiến UI/UX**:
   - Mega menu cho danh mục sản phẩm
   - Thanh thông báo phía trên header
   - Menu mobile tích hợp với trải nghiệm tốt hơn
   - Hiển thị sản phẩm nổi bật trong menu "Hàng Mới Về" và "Bán Chạy"

3. **Quản lý trạng thái**: 
   - Sử dụng React Context hoặc hook để quản lý trạng thái chung
   - Đơn giản hóa logic hiển thị/ẩn các menu

### Lộ Trình Triển Khai

| Giai Đoạn | Mô Tả | Thời Gian |
|-----------|-------|-----------|
| 1. Tái cấu trúc | Tạo cấu trúc components mới và di chuyển logic hiện tại | 1-2 ngày |
| 2. Tích hợp dữ liệu | Thêm hooks/context và kết nối với API | 2-3 ngày |
| 3. Nâng cấp UI/UX | Cải thiện thiết kế và thêm tính năng mới | 2-3 ngày |
| 4. Kiểm thử & Triển khai | Kiểm tra và tối ưu hóa | 1-2 ngày |

## Kết Quả Kỳ Vọng

- **Code gọn gàng hơn**: Giảm ~30% số lượng code trùng lặp
- **Trải nghiệm tốt hơn**: Navigation trở nên trực quan và dễ sử dụng hơn
- **Hiệu suất tốt hơn**: Tối ưu hóa việc tải dữ liệu và render
- **Khả năng mở rộng**: Dễ dàng thêm tính năng mới trong tương lai

## Mẫu Code Minh Họa

```tsx
// MainHeader.tsx (Component chính)
import React, { useState, useEffect } from 'react';
import TopHeader from './components/TopHeader';
import MiddleHeader from './components/MiddleHeader';
import BottomHeader from './components/BottomHeader';
import MobileSideMenu from './components/MobileSideMenu';
import { useHeaderContext } from '@/context/HeaderContext';

export default function MainHeader() {
  const { 
    isMobileMenuOpen, 
    setMobileMenuOpen,
    notifications,
    categories,
    featuredBrands
  } = useHeaderContext();

  return (
    <header className="w-full">
      {/* Thông báo hệ thống */}
      <TopHeader notifications={notifications} />
      
      {/* Logo, tìm kiếm, tài khoản, giỏ hàng */}
      <MiddleHeader 
        onMenuToggle={() => setMobileMenuOpen(!isMobileMenuOpen)} 
      />
      
      {/* Navigation chính */}
      <BottomHeader 
        categories={categories}
        featuredBrands={featuredBrands}
      />
      
      {/* Menu mobile */}
      <MobileSideMenu 
        isOpen={isMobileMenuOpen} 
        onClose={() => setMobileMenuOpen(false)}
        categories={categories}
        featuredBrands={featuredBrands}
      />
    </header>
  );
}
```

## Các Công Nghệ Sử Dụng

- **React Hooks & Context**: Quản lý trạng thái
- **TailwindCSS**: Styling
- **React Icons**: Icons
- **Framer Motion (tùy chọn)**: Animations
- **SWR hoặc React Query**: Tải dữ liệu

## Tác Động Đến Hệ Thống

- **Thay thế**: Header.tsx và SubNavigation.tsx sẽ được thay thế bằng MainHeader
- **Cập nhật**: Các trang sử dụng hai component này cần được cập nhật để sử dụng MainHeader mới
- **Không ảnh hưởng**: Các phần khác của ứng dụng sẽ không bị ảnh hưởng

## Kết Luận

Việc tích hợp Header và SubNavigation không chỉ giúp cải thiện trải nghiệm người dùng mà còn giúp đơn giản hóa cấu trúc code. Bằng cách sử dụng dữ liệu động từ các model có sẵn (Categories, Brands, Notifications), chúng ta có thể tạo ra một header linh hoạt, dễ bảo trì và mở rộng trong tương lai. 