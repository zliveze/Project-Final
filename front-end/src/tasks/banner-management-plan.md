# Kế hoạch thiết kế giao diện quản lý Banner chiến dịch

## Phân tích hiện trạng

Hiện nay, hệ thống đã có một số thành phần liên quan đến Banner chiến dịch:

1. **Herobanners.tsx**: Component hiển thị banner ở trang chủ người dùng
2. **BannerTable.tsx**: Component hiển thị danh sách banner ở trang admin
3. **Trang admin/banners/index.tsx**: Trang quản lý banner trong admin

Tuy nhiên, hiện tại chưa có đầy đủ các thành phần CRUD cho việc quản lý Banner chiến dịch, đặc biệt là các component dạng Popup cho việc thêm/sửa/xóa/xem chi tiết banner.

## Mô hình dữ liệu Banner

Dựa trên file `Campaigns.txt` và `Herobanners.tsx`, mô hình dữ liệu Banner cần bao gồm:

```ts
interface Banner {
  _id: string;
  title: string;           // Tiêu đề banner
  campaignId: string;      // ID chiến dịch liên kết
  desktopImage: string;    // URL ảnh cho desktop
  mobileImage: string;     // URL ảnh cho mobile
  alt: string;             // Mô tả alt cho ảnh
  href: string;            // Link khi click vào banner
  active: boolean;         // Trạng thái hiển thị
  order: number;           // Thứ tự hiển thị
  createdAt: Date;
  updatedAt: Date;
}
```

## Kế hoạch thiết kế các component

### 1. Tạo Model Banner

- Tạo file `src/modelsText/Banners.txt` định nghĩa cấu trúc dữ liệu cho banner

### 2. Tạo các component Popup CRUD

#### 2.1. BannerModal.tsx

- Component chung cho các modal banner, bao gồm header, footer và content container
- Props: title, onClose, children, confirmText, onConfirm, isSubmitting

#### 2.2. BannerForm.tsx

- Form nhập liệu cho banner (dùng cho thêm mới và chỉnh sửa)
- Bao gồm các trường: title, campaignId, desktopImage, mobileImage, alt, href, active, order
- Validation dữ liệu nhập
- Upload ảnh cho desktop và mobile
- Chọn chiến dịch liên kết

#### 2.3. BannerDetail.tsx

- Hiển thị chi tiết banner
- Xem trước ảnh desktop và mobile
- Thông tin chi tiết các trường dữ liệu

#### 2.4. BannerDeleteConfirm.tsx

- Xác nhận xóa banner
- Hiển thị thông tin cơ bản của banner cần xóa

### 3. Cập nhật và hoàn thiện các thành phần hiện có

#### 3.1. Cập nhật trang Admin Banner

- Thêm logic hiển thị/ẩn các modal
- Xử lý CRUD thông qua API

#### 3.2. Cập nhật BannerTable

- Thêm các chức năng cho việc lọc và tìm kiếm banner
- Cải thiện UI/UX

## Chi tiết triển khai

### 1. Tạo files

1. `src/modelsText/Banners.txt`
2. `src/components/admin/banners/BannerModal.tsx`
3. `src/components/admin/banners/BannerForm.tsx`
4. `src/components/admin/banners/BannerDetail.tsx`
5. `src/components/admin/banners/BannerDeleteConfirm.tsx`

### 2. Cập nhật files

1. `src/pages/admin/banners/index.tsx`
2. `src/components/admin/BannerTable.tsx`

### 3. Quy trình làm việc

1. Tạo model Banners.txt
2. Tạo các component modal và form
3. Cập nhật trang admin và danh sách banner
4. Tích hợp chức năng CRUD

## Giao diện UX/UI

- Sử dụng Tailwind CSS cho styling
- Responsive cho cả desktop và mobile
- Thiết kế phải nhất quán với phong cách chung của admin
- Sử dụng React Icons cho biểu tượng
- Tập trung vào trải nghiệm người dùng: thông báo lỗi, loading state, confirmation 