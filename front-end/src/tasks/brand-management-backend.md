# Nhiệm vụ Backend Quản lý Thương hiệu (Brand)

## Nhiệm vụ
[x] Nhiệm vụ 1: Phân tích model Brand từ front-end/src/modelsText/Brands.txt
[x] Nhiệm vụ 2: Tạo schema Brand cho backend
[x] Nhiệm vụ 3: Tạo các DTO cho Brand (CreateBrandDto, UpdateBrandDto, QueryBrandDto, BrandResponseDto, PaginatedBrandsResponseDto, UploadBrandLogoDto)
[x] Nhiệm vụ 4: Tạo service BrandsService xử lý các chức năng CRUD và các tìm kiếm
[x] Nhiệm vụ 5: Tạo controller BrandsAdminController cho quản lý Brand của Admin
[x] Nhiệm vụ 6: Tạo controller BrandsUserController cho phía người dùng
[x] Nhiệm vụ 7: Tạo module BrandsModule và đăng ký vào AppModule
[x] Nhiệm vụ 8: Tạo unit test cho BrandsService

## Chức năng đã thực hiện

### API Admin
- `POST /admin/brands/upload/logo`: Upload logo thương hiệu mới
- `POST /admin/brands`: Tạo thương hiệu mới
- `GET /admin/brands`: Lấy danh sách thương hiệu có phân trang và lọc
- `GET /admin/brands/statistics`: Lấy thống kê thương hiệu
- `GET /admin/brands/:id`: Lấy chi tiết thương hiệu
- `PATCH /admin/brands/:id`: Cập nhật thông tin thương hiệu
- `PATCH /admin/brands/:id/toggle-status`: Bật/tắt trạng thái thương hiệu
- `PATCH /admin/brands/:id/toggle-featured`: Bật/tắt trạng thái nổi bật của thương hiệu
- `DELETE /admin/brands/:id`: Xóa thương hiệu

### API User
- `GET /brands/active`: Lấy danh sách thương hiệu đang hoạt động
- `GET /brands/featured`: Lấy danh sách thương hiệu nổi bật
- `GET /brands/:id`: Lấy chi tiết một thương hiệu

## Ghi chú
- Đã tích hợp với Cloudinary để xử lý hình ảnh logo
- Đã thêm kiểm tra quyền Admin và SuperAdmin để quản lý thương hiệu
- Đã thêm xử lý lỗi và logging đầy đủ 