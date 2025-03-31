# Kế hoạch phát triển giao diện quản lý sự kiện cho Admin

## 1. Tổng quan

Phát triển giao diện quản lý sự kiện (Events) cho trang Admin với đầy đủ chức năng CRUD (Create, Read, Update, Delete). Giao diện này sẽ cho phép quản trị viên tạo, quản lý và theo dõi các sự kiện khuyến mãi, có thể gán sản phẩm vào sự kiện với giá đặc biệt, và theo dõi thời gian diễn ra sự kiện.

## 2. Phân tích mô hình dữ liệu

Dựa trên mô hình `Events.txt`:
```
{
  "_id": "ObjectId",
  "title": "string",
  "description": "string",
  "tags": ["string"],
  "startDate": "date",
  "endDate": "date",
  "products": [
    {
      "productId": "ObjectId",
      "variantId": "ObjectId", 
      "adjustedPrice": "number"
    }
  ],
  "createdAt": "date",
  "updatedAt": "date"
}
```

## 3. Cấu trúc thư mục

```
src/
├── components/
│   └── admin/
│       └── events/
│           ├── EventsPage.tsx             # Trang chính danh sách sự kiện
│           ├── EventsTable.tsx            # Bảng hiển thị sự kiện
│           ├── EventCreateModal.tsx       # Popup tạo sự kiện mới
│           ├── EventEditModal.tsx         # Popup chỉnh sửa sự kiện
│           ├── EventDeleteModal.tsx       # Popup xác nhận xóa sự kiện
│           ├── EventDetailModal.tsx       # Popup xem chi tiết sự kiện
│           ├── EventProductsTable.tsx     # Bảng quản lý sản phẩm trong sự kiện
│           └── EventProductAddModal.tsx   # Popup thêm sản phẩm vào sự kiện
└── pages/
    └── admin/
        └── events/
            ├── index.tsx                  # Route chính cho trang quản lý sự kiện
            └── [id].tsx                   # Route cho trang chi tiết sự kiện (nếu cần)
```

## 4. Các chức năng chính

### 4.1. Trang danh sách sự kiện (EventsPage)
- Hiển thị bảng danh sách tất cả các sự kiện
- Bộ lọc theo trạng thái (Sắp diễn ra, Đang diễn ra, Đã kết thúc)
- Tìm kiếm theo tên sự kiện
- Nút tạo sự kiện mới
- Các hành động: Xem chi tiết, Chỉnh sửa, Xóa

### 4.2. Tạo sự kiện mới (EventCreateModal)
- Form tạo sự kiện với các trường:
  * Tiêu đề sự kiện
  * Mô tả
  * Tags
  * Ngày bắt đầu
  * Ngày kết thúc
  * Nút thêm sản phẩm vào sự kiện (mở EventProductAddModal)

### 4.3. Xem chi tiết sự kiện (EventDetailModal)
- Hiển thị thông tin chi tiết sự kiện
- Danh sách sản phẩm trong sự kiện
- Trạng thái sự kiện (dựa trên thời gian)
- Biểu đồ thống kê (nếu cần)

### 4.4. Chỉnh sửa sự kiện (EventEditModal)
- Form chỉnh sửa với các trường tương tự tạo mới
- Quản lý sản phẩm trong sự kiện:
  * Thêm sản phẩm
  * Xóa sản phẩm
  * Điều chỉnh giá sản phẩm trong sự kiện

### 4.5. Xóa sự kiện (EventDeleteModal)
- Xác nhận xóa sự kiện
- Cảnh báo tác động đến sản phẩm liên quan

### 4.6. Quản lý sản phẩm trong sự kiện (EventProductsTable & EventProductAddModal)
- Tìm kiếm và thêm sản phẩm vào sự kiện
- Thiết lập giá khuyến mãi cho sản phẩm trong sự kiện
- Xóa sản phẩm khỏi sự kiện

## 5. Giao diện UI/UX

### 5.1. Bảng danh sách sự kiện
- Hiển thị các cột: ID, Tiêu đề, Ngày bắt đầu, Ngày kết thúc, Trạng thái, Số lượng sản phẩm, Hành động
- Phân trang
- Color-coding cho trạng thái (sắp diễn ra: xanh dương, đang diễn ra: xanh lá, đã kết thúc: xám)

### 5.2. Form tạo/chỉnh sửa sự kiện
- Layout dễ sử dụng với các trường được nhóm hợp lý
- Date picker cho trường ngày tháng
- Tags input cho trường tags
- Bảng quản lý sản phẩm với khả năng thêm/xóa/chỉnh sửa
- Preview realtime (nếu có thể)

### 5.3. Popup chi tiết sự kiện
- Dashboard nhỏ hiển thị thông tin tổng quan
- Bảng sản phẩm trong sự kiện
- Thời gian còn lại (đồng hồ đếm ngược nếu đang diễn ra)

## 6. Tích hợp với API

### 6.1. API Endpoints cần thiết
- GET /api/admin/events - Lấy danh sách sự kiện
- GET /api/admin/events/:id - Lấy chi tiết sự kiện
- POST /api/admin/events - Tạo sự kiện mới
- PUT /api/admin/events/:id - Cập nhật sự kiện
- DELETE /api/admin/events/:id - Xóa sự kiện
- GET /api/admin/products - Lấy danh sách sản phẩm để thêm vào sự kiện
- POST /api/admin/events/:id/products - Thêm sản phẩm vào sự kiện
- DELETE /api/admin/events/:id/products/:productId - Xóa sản phẩm khỏi sự kiện

### 6.2. State Management
- Sử dụng React Query hoặc Redux Toolkit để quản lý trạng thái
- Caching data để tối ưu hiệu suất
- Xử lý loading states và error states

## 7. Kế hoạch phát triển

### 7.1. Giai đoạn 1: Setup cơ bản
- Tạo các component cơ bản
- Setup routing
- Tạo UI mockup cho các component

### 7.2. Giai đoạn 2: Phát triển CRUD cơ bản
- Phát triển EventsTable với data mẫu
- Phát triển các modal Create/Edit/Delete
- Phát triển UI chi tiết sự kiện

### 7.3. Giai đoạn 3: Quản lý sản phẩm trong sự kiện
- Phát triển EventProductsTable
- Phát triển EventProductAddModal
- Xử lý logic thêm/xóa/cập nhật sản phẩm

### 7.4. Giai đoạn 4: Tích hợp API và hoàn thiện
- Kết nối với API backend
- Xử lý validation
- Hoàn thiện UI/UX
- Testing và debugging

## 8. Đề xuất cải tiến

- Thêm tính năng Preview sự kiện như hiển thị trên trang chủ
- Thêm biểu đồ thống kê về hiệu quả sự kiện
- Thêm tính năng lặp lại sự kiện (tạo sự kiện mới dựa trên sự kiện đã có)
- Tích hợp hệ thống thông báo khi sự kiện sắp bắt đầu/kết thúc 