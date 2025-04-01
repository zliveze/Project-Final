# Kế hoạch tích hợp Frontend-Backend cho Quản lý Thông báo

## Phân tích giao diện Frontend

### Giao diện Admin:
1. **Trang Quản lý Thông báo (`/admin/notifications`)**:
   - Hiển thị bảng danh sách thông báo với các cột: nội dung, loại, trạng thái, thời gian hiển thị, ngày tạo và thao tác
   - Hỗ trợ tìm kiếm và lọc theo loại, trạng thái
   - Các thao tác: xem chi tiết, chỉnh sửa, ẩn/hiện, xóa thông báo

2. **Các Modal:**
   - **NotificationAddModal**: Form thêm thông báo mới
   - **NotificationEditModal**: Form chỉnh sửa thông báo
   - **NotificationViewModal**: Xem chi tiết thông báo
   - **NotificationForm**: Component chung dùng cho cả thêm và chỉnh sửa

### Các Component Frontend chính:
- **NotificationTable**: Hiển thị danh sách thông báo dạng bảng
- **NotificationForm**: Form nhập/chỉnh sửa thông tin thông báo
- **NotificationAddModal**: Modal thêm thông báo mới
- **NotificationEditModal**: Modal chỉnh sửa thông báo
- **NotificationViewModal**: Modal xem chi tiết thông báo

## Phân tích Backend Endpoints

### Endpoints cho Admin:
1. **GET /api/admin/notifications**
   - Lấy danh sách thông báo với phân trang, lọc, sắp xếp
   - Tham số: page, limit, search, type, isActive, sortBy, sortOrder

2. **GET /api/admin/notifications/statistics**
   - Lấy thống kê về thông báo: tổng số, đang hiển thị, đã ẩn, sắp hết hạn

3. **GET /api/admin/notifications/:id**
   - Lấy chi tiết một thông báo

4. **POST /api/admin/notifications**
   - Tạo thông báo mới
   - Body: CreateNotificationDto

5. **PUT /api/admin/notifications/:id**
   - Cập nhật thông tin thông báo
   - Body: UpdateNotificationDto

6. **PATCH /api/admin/notifications/:id/toggle-status**
   - Bật/tắt trạng thái thông báo

7. **DELETE /api/admin/notifications/:id**
   - Xóa thông báo

### Endpoints cho User:
1. **GET /api/notifications**
   - Lấy danh sách thông báo đang hiển thị cho người dùng

## Kế hoạch tích hợp

### Danh sách nhiệm vụ

#### 1. Tạo API Context
[x] Nhiệm vụ 1: Tạo NotificationContext để quản lý các thao tác với API thông báo

#### 2. Tích hợp API cho Admin
[x] Nhiệm vụ 2: Tích hợp API lấy danh sách thông báo với phân trang, lọc
[x] Nhiệm vụ 3: Tích hợp API lấy thống kê thông báo
[x] Nhiệm vụ 4: Tích hợp API lấy chi tiết thông báo
[x] Nhiệm vụ 5: Tích hợp API tạo thông báo mới
[x] Nhiệm vụ 6: Tích hợp API cập nhật thông báo
[x] Nhiệm vụ 7: Tích hợp API bật/tắt trạng thái thông báo
[x] Nhiệm vụ 8: Tích hợp API xóa thông báo

#### 3. Tích hợp API cho User
[x] Nhiệm vụ 9: Tạo component hiển thị thông báo cho người dùng
[x] Nhiệm vụ 10: Tích hợp API lấy danh sách thông báo cho người dùng

#### 4. Cải thiện trải nghiệm người dùng
[x] Nhiệm vụ 11: Thêm hiệu ứng loading khi tương tác với API
[x] Nhiệm vụ 12: Xử lý và hiển thị thông báo lỗi
[x] Nhiệm vụ 13: Thêm xác nhận trước khi xóa thông báo

#### 5. Kiểm thử
[x] Nhiệm vụ 14: Kiểm thử tích hợp các chức năng

## Chi tiết kế hoạch thực hiện

### 1. Tạo NotificationContext

Tạo file `src/contexts/NotificationContext.tsx` để quản lý trạng thái và các thao tác API liên quan đến thông báo:
- Sử dụng React Context API để chia sẻ dữ liệu và hàm xử lý giữa các component
- Triển khai các hàm gọi API: getNotifications, getStatistics, getNotification, createNotification, updateNotification, toggleStatus, deleteNotification
- Quản lý trạng thái loading, error cho từng thao tác

### 2. Cập nhật Component Admin

Cập nhật file `pages/admin/notifications/index.tsx`:
- Sử dụng NotificationContext thay cho các hàm fetch trực tiếp
- Cập nhật các hàm xử lý sự kiện để sử dụng context

Cập nhật các component modal:
- Sử dụng NotificationContext để truyền dữ liệu và xử lý sự kiện

### 3. Tạo Component hiển thị thông báo cho User

Tạo component `components/common/NotificationBanner.tsx`:
- Hiển thị thông báo đang hoạt động theo độ ưu tiên
- Sử dụng NotificationContext để lấy dữ liệu
- Thêm hiệu ứng chạy thông báo (marquee) nếu cần

### 4. Cải thiện trải nghiệm người dùng

- Thêm skeleton loading khi đang tải dữ liệu
- Xử lý và hiển thị thông báo lỗi với toast
- Thêm modal xác nhận trước khi xóa
- Cập nhật UI/UX của các form và bảng

### 5. Kiểm thử

- Kiểm thử tất cả các chức năng CRUD
- Kiểm thử trên các trình duyệt khác nhau
- Kiểm tra khả năng phản hồi trên các thiết bị khác nhau 