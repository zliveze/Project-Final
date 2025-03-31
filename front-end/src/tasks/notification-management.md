# Kế hoạch hoàn thiện giao diện quản lý thông báo

## Phân tích hiện trạng
- Đã có component cơ bản cho trang quản lý thông báo: `/pages/admin/notifications/index.tsx`
- Đã có component hiển thị bảng dữ liệu thông báo: `/components/admin/NotificationTable.tsx`
- Chưa có model cụ thể cho thông báo, sẽ cần tạo mới
- Các thông báo sẽ được hiển thị ở phần `NotificationSection.tsx` trên giao diện người dùng

## Mô hình dữ liệu cho thông báo
Dựa vào các model hiện có, chúng ta sẽ tạo model cho thông báo với cấu trúc sau:
```javascript
{
  "_id": "ObjectId",
  "content": "string", // Nội dung thông báo
  "type": "string", // Loại thông báo: voucher, shipping, promotion, system, etc.
  "link": "string", // Đường dẫn nếu có (tùy chọn)
  "priority": "number", // Mức độ ưu tiên hiển thị
  "startDate": "date", // Ngày bắt đầu hiển thị
  "endDate": "date", // Ngày kết thúc hiển thị (nếu không có thì không giới hạn)
  "isActive": "boolean", // Trạng thái hiển thị
  "backgroundColor": "string", // Màu nền (tùy chọn)
  "textColor": "string", // Màu chữ (tùy chọn)
  "createdAt": "date",
  "updatedAt": "date"
}
```

## Các component cần tạo mới
1. **Các component popup CRUD**:
   - `NotificationAddModal.tsx`: Modal thêm thông báo mới
   - `NotificationEditModal.tsx`: Modal sửa thông báo
   - `NotificationViewModal.tsx`: Modal xem chi tiết thông báo
   - `NotificationForm.tsx`: Component form chung cho thêm/sửa thông báo

2. **Cải tiến các component hiện có**:
   - Hoàn thiện chức năng cho trang `index.tsx` để quản lý trạng thái của các modal
   - Cập nhật `NotificationTable.tsx` để hiển thị đầy đủ thông tin

## Chi tiết triển khai

### 1. Tạo thư mục riêng cho module thông báo
Tạo thư mục `/components/admin/notifications/` để chứa các component liên quan

### 2. Tạo các component popup CRUD
#### a. NotificationForm.tsx:
- Form chung cho thêm/sửa thông báo
- Các trường dữ liệu:
  - Nội dung thông báo
  - Loại thông báo (select)
  - Đường dẫn (nếu có)
  - Mức độ ưu tiên
  - Ngày bắt đầu/kết thúc hiển thị
  - Trạng thái hiển thị
  - Tùy chỉnh màu sắc (màu nền, màu chữ)

#### b. NotificationAddModal.tsx:
- Modal popup thêm thông báo mới
- Sử dụng component NotificationForm với các giá trị mặc định

#### c. NotificationEditModal.tsx:
- Modal popup chỉnh sửa thông báo
- Sử dụng component NotificationForm với dữ liệu thông báo được truyền vào

#### d. NotificationViewModal.tsx:
- Modal xem chi tiết thông báo
- Hiển thị preview thông báo như trên giao diện người dùng
- Hiển thị đầy đủ thông tin chi tiết của thông báo

### 3. Cập nhật trang quản lý thông báo (index.tsx)
- Thêm state để quản lý trạng thái mở/đóng của các modal
- Implement chức năng thêm/sửa/xóa/xem chi tiết thông báo
- Thêm các component modal đã tạo vào trang

### 4. Cải tiến NotificationTable.tsx
- Cập nhật hiển thị thông tin phù hợp với model mới
- Thêm tính năng phân trang (pagination)
- Hoàn thiện tính năng lọc và tìm kiếm

## Kế hoạch triển khai
1. Tạo thư mục notifications và các file component cần thiết
2. Phát triển NotificationForm.tsx với các trường dữ liệu cần thiết
3. Phát triển các modal CRUD (Add, Edit, View)
4. Cập nhật trang quản lý thông báo (index.tsx)
5. Kiểm tra và hoàn thiện giao diện

## Các cải tiến bổ sung
- Thêm tính năng preview thông báo trước khi lưu
- Tính năng kéo thả để sắp xếp thứ tự ưu tiên hiển thị thông báo
- Hỗ trợ tùy chỉnh màu sắc với color picker
- Hỗ trợ tải ảnh cho thông báo (nếu cần) 