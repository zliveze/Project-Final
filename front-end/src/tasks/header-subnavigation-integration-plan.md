# Kế Hoạch Gộp và Nâng Cấp Header và SubNavigation

## 1. Phân Tích Hiện Trạng

### 1.1. Cấu Trúc Hiện Tại
Hiện tại, giao diện header của ứng dụng được chia thành hai thành phần chính:
- `Header.tsx`: Chứa logo, thanh tìm kiếm, biểu tượng tài khoản, giỏ hàng và wishlist
- `SubNavigation.tsx`: Chứa danh mục sản phẩm, thương hiệu, hàng mới về, bán chạy và tra cứu đơn hàng

### 1.2. Vấn Đề
- Chia tách logic điều hướng thành hai component riêng biệt gây khó khăn trong việc quản lý trạng thái
- Trùng lặp code cho menu mobile trong cả hai component
- Các chức năng giống nhau (như menu) xuất hiện ở cả hai component với logic xử lý khác nhau
- Không tận dụng tối ưu các model dữ liệu để xây dựng menu động

## 2. Kế Hoạch Gộp và Nâng Cấp

### 2.1. Tạo Cấu Trúc Mới Cho Header

#### Component Chính:
```tsx
// MainHeader.tsx
- Tổng hợp tất cả chức năng của Header và SubNavigation
- Chia thành các phần: TopHeader (thông báo), MiddleHeader (logo, tìm kiếm, giỏ hàng), và BottomHeader (danh mục, điều hướng)
- Quản lý trạng thái chung cho cả 3 phần
```

#### Sub-components:
```tsx
// TopHeader.tsx: Hiển thị thông báo từ hệ thống (model Notifications)
// MiddleHeader.tsx: Logo, tìm kiếm, tài khoản, giỏ hàng, wishlist
// BottomHeader.tsx: Danh mục sản phẩm, điều hướng chính
// MobileSideMenu.tsx: Menu cho thiết bị di động (gộp tất cả các chức năng)
```

### 2.2. Tích Hợp Dữ Liệu Động

#### Sử dụng Models:
- **Thể Loại (Categories)**: Tải danh mục từ API để hiển thị trong menu danh mục
- **Thương Hiệu (Brands)**: Tải thương hiệu nổi bật cho menu thương hiệu
- **Thông Báo (Notifications)**: Hiển thị thông báo ở phần trên cùng của header
- **Người Dùng (Users)**: Hiển thị thông tin người dùng và chức năng liên quan

#### Logic Xử Lý:
- Tạo context hoặc hook để quản lý trạng thái header
- Thêm logic tải dữ liệu động từ API cho danh mục và thương hiệu
- Thêm tính năng hiển thị thông báo hệ thống từ model Notifications

### 2.3. Cải Tiến UI/UX

#### Các Cải Tiến Chính:
- Thiết kế lại menu mobile tích hợp để tất cả chức năng đều có sẵn trong một menu duy nhất
- Thêm hiệu ứng chuyển đổi mượt mà khi mở/đóng menu
- Cải thiện khả năng phản hồi trên các thiết bị khác nhau
- Thêm mega menu cho danh mục sản phẩm với hình ảnh và các liên kết phụ
- Thêm tính năng hiển thị sản phẩm gần đây đã xem

#### Tính Năng Mới:
- Thêm thanh thông báo phía trên header để hiển thị khuyến mãi và thông báo hệ thống
- Thêm chức năng chuyển đổi ngôn ngữ (nếu cần)
- Thêm hiển thị danh sách sản phẩm nổi bật khi di chuột vào "Hàng Mới Về" và "Bán Chạy"

## 3. Kế Hoạch Triển Khai

### 3.1. Giai Đoạn 1: Tái Cấu Trúc và Gộp Components
- Tạo các component mới: MainHeader, TopHeader, MiddleHeader, BottomHeader, MobileSideMenu
- Di chuyển logic từ Header và SubNavigation vào các component mới
- Đảm bảo tất cả chức năng hiện tại vẫn hoạt động bình thường

### 3.2. Giai Đoạn 2: Tích Hợp Dữ Liệu Động
- Tạo hooks và context để quản lý trạng thái và dữ liệu cho header
- Thêm logic để tải danh mục động từ API thay vì hardcode như hiện tại
- Thêm logic tải thương hiệu nổi bật
- Thêm chức năng hiển thị thông báo từ model Notifications

### 3.3. Giai Đoạn 3: Nâng Cấp UI/UX
- Cải thiện thiết kế cho mega menu danh mục
- Nâng cấp menu mobile với trải nghiệm tốt hơn
- Thêm các hiệu ứng chuyển đổi và hoạt ảnh cho menu
- Tối ưu hóa responsive cho tất cả kích thước màn hình

### 3.4. Giai Đoạn 4: Kiểm Thử và Triển Khai
- Kiểm tra trên nhiều thiết bị và trình duyệt khác nhau
- Đảm bảo khả năng truy cập (accessibility)
- Tối ưu hóa hiệu suất
- Triển khai vào sản phẩm

## 4. Lợi Ích Kỳ Vọng

- **Cải Thiện UX**: Trải nghiệm người dùng nhất quán và mượt mà hơn
- **Tối Ưu Hóa Code**: Giảm trùng lặp, dễ bảo trì và mở rộng
- **Tăng Tính Năng**: Bổ sung thêm các tính năng mới giúp cải thiện trải nghiệm mua sắm
- **Dễ Quản Lý**: Quản lý header và navigation trong một component duy nhất
- **Thích Ứng Dữ Liệu**: Sử dụng dữ liệu động thay vì hardcode giúp dễ dàng cập nhật

## 5. Tài Nguyên Cần Thiết

- **API Endpoints**: 
  - `/api/categories`: Lấy danh sách danh mục
  - `/api/brands?featured=true`: Lấy danh sách thương hiệu nổi bật
  - `/api/notifications/active`: Lấy danh sách thông báo đang hoạt động
- **Assets**: 
  - Icons và hình ảnh cho mega menu
  - Hình ảnh cho banner khuyến mãi trên header

## 6. Thời Gian Dự Kiến

- **Giai Đoạn 1**: 1-2 ngày
- **Giai Đoạn 2**: 2-3 ngày
- **Giai Đoạn 3**: 2-3 ngày
- **Giai Đoạn 4**: 1-2 ngày
- **Tổng thời gian**: 6-10 ngày 