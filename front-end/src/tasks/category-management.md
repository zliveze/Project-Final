# Kế hoạch hoàn thiện giao diện quản lý danh mục sản phẩm (Admin)

## Phân tích hiện trạng

Hiện tại, giao diện quản lý danh mục đã có các tính năng cơ bản sau:
- Trang danh sách danh mục (`src/pages/admin/categories/index.tsx`)
- Component hiển thị bảng danh mục (`src/components/admin/CategoryTable.tsx`)
- Chức năng xóa danh mục (modal xác nhận)
- Dữ liệu mẫu với các trường cơ bản

Tuy nhiên, cần hoàn thiện thêm:
1. Trang tạo mới danh mục
2. Trang chỉnh sửa danh mục
3. Trang xem chi tiết danh mục
4. Tổ chức thư mục components cho danh mục (categories)
5. Hoàn thiện các chức năng CRUD đầy đủ

## Kế hoạch thực hiện

### 1. Tổ chức thư mục components
[x] Tạo thư mục `src/components/admin/categories`
[x] Di chuyển và cập nhật `CategoryTable.tsx` vào thư mục categories

### 2. Tạo các components cần thiết
[x] Tạo `CategoryForm.tsx` - form dùng chung cho tạo mới và chỉnh sửa
[x] Tạo `CategoryDetail.tsx` - hiển thị chi tiết danh mục
[x] Tạo `CategoryHierarchy.tsx` - hiển thị cấu trúc phân cấp danh mục

### 3. Tạo các trang quản lý
[x] Tạo `src/pages/admin/categories/add.tsx` - trang thêm danh mục mới
[x] Tạo `src/pages/admin/categories/[id].tsx` - trang xem chi tiết danh mục
[x] Tạo `src/pages/admin/categories/edit/[id].tsx` - trang chỉnh sửa danh mục

### 4. Cập nhật giao diện hiện có
[x] Cập nhật CategoryTable để hiển thị đúng theo model Categories.txt
[x] Cập nhật trang index.tsx để sử dụng component mới

### 5. Bổ sung các tính năng
[x] Xử lý phân cấp danh mục (parentId, level)
[x] Quản lý hình ảnh danh mục
[x] Xử lý trạng thái (active/inactive)
[x] Xử lý danh mục nổi bật (featured)
[x] Sắp xếp thứ tự hiển thị (order)

### 6. Chuyển đổi sang modal popup và các tính năng bổ sung
[x] Tạo `CategoryAddModal.tsx` - modal thêm danh mục mới
[x] Tạo `CategoryEditModal.tsx` - modal chỉnh sửa danh mục
[x] Tạo `CategoryDetailModal.tsx` - modal xem chi tiết danh mục
[x] Tạo `CategoryDeleteModal.tsx` - modal xác nhận xóa danh mục
[x] Cập nhật trang index.tsx để sử dụng các modal thay vì điều hướng trang
[x] Lưu trữ các trang cũ trong thư mục archived để tham khảo
[x] Tích hợp Pagination cho CategoryTable và CategoryHierarchy
[x] Tích hợp thông báo toast sử dụng react-hot-toast
[x] Thêm xử lý lỗi với toast notifications cho tất cả modal

## Chi tiết các tính năng

### Form tạo/chỉnh sửa danh mục cần có:
- Tên danh mục (name)
- Mô tả (description)
- Slug (tự động tạo từ tên hoặc nhập thủ công)
- Danh mục cha (parentId - dropdown)
- Trạng thái (status - radio/select)
- Upload hình ảnh (image)
- Đánh dấu nổi bật (featured - checkbox)
- Thứ tự hiển thị (order - number input)

### Trang chi tiết cần hiển thị:
- Thông tin cơ bản danh mục
- Danh mục cha (nếu có)
- Danh mục con (nếu có)
- Số lượng sản phẩm thuộc danh mục
- Trạng thái
- Thời gian tạo/cập nhật

### Trang danh sách cần bổ sung:
- Lọc theo danh mục cha
- Lọc theo cấp độ danh mục
- Lọc theo featured
- Sắp xếp theo các tiêu chí khác nhau 