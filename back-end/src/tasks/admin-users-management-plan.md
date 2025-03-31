# Kế hoạch tích hợp chức năng quản lý User cho Admin

## 1. Cấu trúc backend

### DTO cần thiết:
- UserFilterDto: Tiêu chí lọc (tìm kiếm, trạng thái, vai trò, ...)
- UserPaginationDto: Phân trang (trang hiện tại, số item mỗi trang)
- UserResponseDto: Dữ liệu trả về cho frontend
- UpdateUserByAdminDto: Cập nhật thông tin người dùng bởi admin
- ResetPasswordDto: Đặt lại mật khẩu người dùng

### Endpoint API cần thiết:
- GET `/admin/users`: Lấy danh sách người dùng (có phân trang, lọc)
- GET `/admin/users/:id`: Lấy thông tin chi tiết người dùng
- PATCH `/admin/users/:id`: Cập nhật thông tin người dùng
- DELETE `/admin/users/:id`: Xóa người dùng (soft delete)
- POST `/admin/users/reset-password/:id`: Đặt lại mật khẩu
- PATCH `/admin/users/status/:id`: Thay đổi trạng thái (Active, Inactive, Blocked)
- PATCH `/admin/users/role/:id`: Thay đổi vai trò (chỉ SuperAdmin)

### Service mở rộng:
- `findAllWithFilters`: Lấy danh sách người dùng với bộ lọc và phân trang
- `findOneDetailed`: Lấy thông tin chi tiết 1 người dùng (bao gồm đơn hàng, địa chỉ, wishlist)
- `resetPasswordByAdmin`: Cho phép admin đặt lại mật khẩu
- `updateUserStatus`: Cập nhật trạng thái người dùng
- `updateUserRole`: Cập nhật vai trò người dùng

## 2. Tích hợp Frontend

### Context quản lý User:
- Tạo context mới: `AdminUserContext`
- Các state: danh sách người dùng, chi tiết người dùng, trạng thái loading, lỗi
- Các action: tải danh sách, xem chi tiết, chỉnh sửa, xóa, đặt lại mật khẩu, cập nhật trạng thái/vai trò

### Kết nối với API:
- Tạo các hàm gọi API trong `src/services/api/adminUser.ts`
- Sử dụng axios với token JWT phù hợp từ Admin Authentication
- Xử lý lỗi và hiển thị thông báo tương ứng

### Ánh xạ dữ liệu:
- Chuyển đổi dữ liệu từ backend sang định dạng phù hợp với components đã có
- Đảm bảo các thuộc tính phù hợp (ví dụ: `_id` -> `id`, `isActive`/`isBanned`/`isDeleted` -> `status`)

## 3. Bảo mật và phân quyền

### Trên Backend:
- Áp dụng `JwtAuthGuard` cho mọi API liên quan đến quản lý người dùng
- Áp dụng `RolesGuard` kèm decorator `@Roles('admin', 'superadmin')` cho hầu hết API
- Áp dụng `@Roles('superadmin')` cho các API nhạy cảm (thay đổi vai trò, xóa user admin)

### Trên Frontend:
- Kiểm tra vai trò `role` trước khi hiển thị các tính năng quan trọng
- Ẩn các tính năng nhạy cảm với người dùng không có quyền tương ứng

## 4. Kiểm thử
- Kiểm tra các trường hợp lọc và phân trang
- Kiểm tra quyền truy cập cho admin và superadmin
- Kiểm tra xử lý lỗi và hiển thị thông báo
- Kiểm tra toàn bộ flow từ UI đến database 