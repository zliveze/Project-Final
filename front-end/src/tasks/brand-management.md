# Kế hoạch hoàn thiện giao diện quản lý thương hiệu (Brands) - Admin

## Mô hình dữ liệu Brand
```json
{
  "_id": "ObjectId",
  "name": "string", // Tên thương hiệu
  "description": "string", // Mô tả thương hiệu
  "logo": {
    "url": "string",
    "alt": "string"
  },
  "origin": "string", // Xuất xứ thương hiệu
  "website": "string",
  "featured": "boolean",
  "status": "string", // ["active", "inactive"]
  "socialMedia": {
    "facebook": "string",
    "instagram": "string",
    "youtube": "string"
  },
  "createdAt": "date",
  "updatedAt": "date"
}
```

## Nhiệm vụ
[x] Nhiệm vụ 1: Tạo component BrandForm để quản lý form thêm/sửa thương hiệu
[x] Nhiệm vụ 2: Tạo component BrandAddModal cho popup thêm thương hiệu mới
[x] Nhiệm vụ 3: Tạo component BrandEditModal cho popup chỉnh sửa thương hiệu
[x] Nhiệm vụ 4: Tạo component BrandDetailModal cho popup xem chi tiết thương hiệu
[x] Nhiệm vụ 5: Tạo component BrandDeleteModal cho popup xác nhận xóa thương hiệu
[x] Nhiệm vụ 6: Cập nhật trang index.tsx để tích hợp tất cả các modal popup
[x] Nhiệm vụ 7: Kiểm tra lại giao diện và hoàn thiện

## Hướng thiết kế
1. **Màu sắc**:
   - Thêm mới: Hồng (Pink)
   - Chỉnh sửa: Xanh dương (Blue)
   - Xem chi tiết: Xám (Gray)
   - Xóa: Đỏ (Red)

2. **Cấu trúc**:
   - Mỗi modal sẽ được thiết kế dạng popup
   - Form thêm/sửa chứa đầy đủ các trường theo mô hình dữ liệu
   - Các trường bắt buộc: tên, mô tả, trạng thái
   - Hiển thị thông báo toast sau khi thực hiện các thao tác CRUD
   - Phân trang và tìm kiếm thương hiệu

3. **Yêu cầu chức năng**:
   - Thêm thương hiệu mới
   - Chỉnh sửa thông tin thương hiệu 
   - Xem chi tiết thương hiệu
   - Xóa thương hiệu
   - Hiển thị danh sách thương hiệu theo trang
   - Tìm kiếm và lọc thương hiệu
   - Upload hình ảnh logo

## Cấu trúc thư mục
```
src/
  components/
    admin/
      brands/
        BrandForm.tsx
        BrandAddModal.tsx
        BrandEditModal.tsx
        BrandDetailModal.tsx
        BrandDeleteModal.tsx
  pages/
    admin/
      brands/
        index.tsx
``` 