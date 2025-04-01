# Kế hoạch triển khai Backend Quản lý Thông báo

## Phân tích Model Notifications
Dựa trên model `Notifications.txt`, cấu trúc dữ liệu thông báo bao gồm:
- `_id`: ObjectId - ID của thông báo
- `content`: string - Nội dung thông báo
- `type`: string - Loại thông báo (voucher, shipping, promotion, system)
- `link`: string (tùy chọn) - Đường dẫn liên kết của thông báo 
- `priority`: number - Mức độ ưu tiên hiển thị
- `startDate`: date - Ngày bắt đầu hiển thị
- `endDate`: date - Ngày kết thúc hiển thị
- `isActive`: boolean (mặc định: true) - Trạng thái hiển thị
- `backgroundColor`: string (tùy chọn) - Màu nền
- `textColor`: string (tùy chọn) - Màu chữ
- `createdAt`: date - Ngày tạo
- `updatedAt`: date - Ngày cập nhật

## Danh sách nhiệm vụ

### Thiết lập cơ bản
[x] Nhiệm vụ 1: Tạo module Notifications với cấu trúc chuẩn NestJS
[x] Nhiệm vụ 2: Tạo schema MongoDB cho model Notification
[x] Nhiệm vụ 3: Tạo các DTO cho Notification (Create, Update, Response)

### API cho Admin và Super Admin
[x] Nhiệm vụ 4: Tạo controller NotificationsAdmin với các endpoint:
   - GET /admin/notifications - Lấy danh sách thông báo (có phân trang, lọc)
   - GET /admin/notifications/:id - Lấy chi tiết một thông báo
   - POST /admin/notifications - Tạo thông báo mới
   - PATCH /admin/notifications/:id - Cập nhật thông báo
   - DELETE /admin/notifications/:id - Xóa thông báo
   - PATCH /admin/notifications/:id/toggle-status - Bật/tắt trạng thái thông báo

### API cho User
[x] Nhiệm vụ 5: Tạo controller NotificationsUser với các endpoint:
   - GET /notifications - Lấy danh sách thông báo hiện tại cho người dùng

### Bảo mật và phân quyền
[x] Nhiệm vụ 6: Cấu hình Guards và Decorators để đảm bảo chỉ Admin và Super Admin mới có quyền quản lý thông báo

### Tích hợp
[x] Nhiệm vụ 7: Cập nhật AppModule để nhập module Notifications
[x] Nhiệm vụ 8: Thêm các unit test cho service và controller

### Tài liệu API
[] Nhiệm vụ 9: Cập nhật Swagger để tạo tài liệu API cho module Notifications

## Mục tiêu
- Xây dựng backend hoàn chỉnh cho việc quản lý thông báo
- Đảm bảo phân quyền đúng (Admin và Super Admin có quyền quản lý)
- Tạo API hiệu quả cho việc hiển thị thông báo trên giao diện người dùng
- Hỗ trợ đầy đủ chức năng CRUD, kích hoạt/vô hiệu hóa thông báo
- Hỗ trợ phân trang, lọc và tìm kiếm thông báo 