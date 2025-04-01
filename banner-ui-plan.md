# Kế hoạch nâng cấp giao diện quản lý Banner

## 1. Cải tiến hiện tại

Dựa trên `front-end/src/pages/admin/banners/index.tsx` và tham khảo từ cấu trúc quản lý Brand (`front-end/src/components/admin/brands`), các cải tiến sẽ bao gồm:

### 1.1. Tổ chức lại Component
- Tạo các component riêng biệt tương tự cấu trúc của Brand:
  - `BannerTable.tsx`: Hiển thị danh sách banner dạng bảng
  - `BannerAddModal.tsx`: Modal thêm mới banner
  - `BannerEditModal.tsx`: Modal chỉnh sửa banner
  - `BannerDetailModal.tsx`: Modal xem chi tiết banner
  - `BannerDeleteModal.tsx`: Modal xác nhận xóa banner
  - `BannerForm.tsx`: Form dùng chung cho thêm/sửa banner

### 1.2. Cải tiến BannerTable
- Thêm cột hiển thị ảnh thu nhỏ của banner (thumbnail)
- Thêm cột hiển thị thời gian hiệu lực (startDate - endDate)
- Hiển thị trạng thái active/inactive rõ ràng hơn với mã màu
- Thêm phân trang, lọc và tìm kiếm nâng cao
- Cải thiện nút điều chỉnh thứ tự hiển thị (di chuyển lên/xuống)

### 1.3. Cải tiến BannerForm
- Tích hợp upload ảnh (cho cả desktop và mobile)
- Thêm xem trước ảnh đã upload
- Thêm validation đầy đủ cho form
- Tích hợp datepicker cho chọn ngày bắt đầu/kết thúc
- Thêm tùy chọn chọn Campaign từ danh sách

### 1.4. Thêm chức năng mới
- Bật/tắt trạng thái active nhanh từ bảng
- Preview banner trước khi lưu
- Chế độ xem banner theo thời gian thực (để người dùng thấy banner sẽ xuất hiện như thế nào ở trang chủ)
- Cho phép sắp xếp banner bằng kéo thả (drag and drop)
- Thêm bộ lọc banner theo trạng thái, theo campaign và theo thời gian hiệu lực

### 1.5. UI/UX cải tiến
- Hiển thị các thông báo success/error rõ ràng khi thao tác
- Hiệu ứng loading khi đang xử lý dữ liệu
- Cải thiện responsive design cho cả desktop và mobile
- Hiệu ứng chuyển động trơn tru cho modal và các thao tác

## 2. Kế hoạch triển khai

### 2.1. Các file cần tạo:
- `/components/admin/banners/BannerTable.tsx`
- `/components/admin/banners/BannerForm.tsx`
- `/components/admin/banners/BannerAddModal.tsx`
- `/components/admin/banners/BannerEditModal.tsx`
- `/components/admin/banners/BannerDetailModal.tsx`
- `/components/admin/banners/BannerDeleteModal.tsx`

### 2.2. Cập nhật file:
- `/pages/admin/banners/index.tsx`: Tích hợp các component mới và xử lý logic

### 2.3. Các thư viện sử dụng:
- React Hook Form: Quản lý form validation
- DatePicker: Chọn ngày bắt đầu/kết thúc
- React-beautiful-dnd: Kéo thả sắp xếp thứ tự
- Cloudinary/AWS S3: Upload và quản lý ảnh

### 2.4. Cải thiện UX/UI:
- Sử dụng skeleton loading
- Toast notifications cho thông báo
- Tooltips cho các tùy chọn
- Modal animations
- Khu vực xem trước banner 