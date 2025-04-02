## Nhiệm vụ phân tích và xây dựng backend cho Brands

[x] 1. Phân tích Models Brands.txt và các models liên quan
[x] 2. Phân tích giao diện quản lý Brands tại Admin
[x] 3. Phân tích cấu trúc và luồng xử lý của module Banner để tham khảo
[x] 4. Lên kế hoạch chi tiết cho việc xây dựng backend Brands
[x] 5. Triển khai backend theo kế hoạch đã đề ra

## Chi tiết phân tích

### 1. Phân tích Models Brands.txt
- Model Brand có các trường:
  - _id: ObjectId - ID của thương hiệu
  - name: string - Tên thương hiệu
  - description: string - Mô tả thương hiệu
  - logo: object {url: string, alt: string} - Logo thương hiệu
  - origin: string - Xuất xứ thương hiệu
  - website: string - Website của thương hiệu
  - featured: boolean - Có phải thương hiệu nổi bật
  - status: string - Trạng thái ["active", "inactive"]
  - socialMedia: object - Thông tin mạng xã hội
    + facebook: string
    + instagram: string 
    + youtube: string
  - createdAt: date - Ngày tạo
  - updatedAt: date - Ngày cập nhật

### 2. Phân tích giao diện Admin
#### Các chức năng chính:
- Thêm mới thương hiệu (BrandAddModal)
- Xem chi tiết thương hiệu (BrandDetailModal) 
- Chỉnh sửa thông tin thương hiệu (BrandEditModal)
- Xóa thương hiệu (BrandDeleteModal)
- Quản lý danh sách thương hiệu (BrandTable)
  + Phân trang
  + Tìm kiếm
  + Lọc theo trạng thái
  + Sắp xếp

#### Form xử lý dữ liệu (BrandForm):
- Upload logo
- Validate dữ liệu nhập
- Xử lý submit form
- Hiển thị lỗi validation

### 3. Phân tích module Banner và cơ chế xác thực

#### 3.1. Cấu trúc module Banner:
- Controller riêng cho Admin và User
- Service xử lý logic nghiệp vụ
- DTO cho request/response
- Schema Mongoose
- Unit test
- Tích hợp upload ảnh qua Cloudinary
- Phân quyền bảo mật với Guard
- Xử lý lỗi và logging

#### 3.2. Cơ chế xác thực:
- **AdminAuthContext**:
  + Quản lý trạng thái đăng nhập admin
  + Lưu trữ accessToken/refreshToken trong localStorage và cookies
  + Cung cấp các hàm login, logout, checkAuth
  + Tự động refresh token khi hết hạn

- **API Route trung gian**:
  + Tất cả request đi qua `/api/admin/*`
  + Kiểm tra và forward request đến backend
  + Gửi token trong header Authorization

- **Axios Interceptors**:
  + Tự động thêm token vào mọi request
  + Xử lý refresh token khi token hết hạn
  + Retry request sau khi refresh thành công

### 4. Kế hoạch xây dựng backend Brands

#### 4.1. Cấu trúc module
- Tạo BrandsModule
- Tạo BrandsAdminController và BrandsUserController
- Tạo BrandsService
- Tạo các DTO và Schema

#### 4.2. Các API cần thiết
##### Admin APIs:
- POST /admin/brands - Tạo thương hiệu mới
- GET /admin/brands - Lấy danh sách có phân trang
- GET /admin/brands/:id - Lấy chi tiết
- PATCH /admin/brands/:id - Cập nhật thông tin
- DELETE /admin/brands/:id - Xóa thương hiệu
- POST /admin/brands/upload/logo - Upload logo
- GET /admin/brands/statistics - Thống kê

##### User APIs (Public):
- GET /api/brands/public - Lấy danh sách thương hiệu active
  + Không yêu cầu xác thực
  + Chỉ trả về các thương hiệu có status="active"
  + Hỗ trợ filter:
    * featured=true/false - Lọc thương hiệu nổi bật
    * search - Tìm kiếm theo tên
    * sort - Sắp xếp theo tên, ngày tạo
  + Phân trang với limit và offset
  + Cache kết quả để tối ưu performance

- GET /api/brands/public/:id - Xem chi tiết thương hiệu
  + Không yêu cầu xác thực
  + Chỉ trả về thương hiệu active
  + Bao gồm thông tin:
    * Thông tin cơ bản
    * Logo
    * Social media
    * Các sản phẩm của thương hiệu (nếu có)
  + Cache kết quả

- GET /api/brands/public/featured - Lấy danh sách thương hiệu nổi bật
  + Không yêu cầu xác thực
  + Chỉ lấy các thương hiệu featured=true và active
  + Giới hạn số lượng trả về
  + Cache kết quả

#### 4.3. Tính năng bảo mật và xác thực
- **Xác thực qua API trung gian**:
  + Tạo API route `/api/admin/brands/*`
  + Kiểm tra token trong mọi request
  + Forward request đến backend kèm token

- **Xử lý token trong frontend**:
  + Tạo BrandContext quản lý state và API calls
  + Sử dụng axios interceptor để tự động:
    * Thêm token vào request
    * Refresh token khi hết hạn
    * Retry request sau khi refresh
  + Xử lý lỗi xác thực và redirect

- **Bảo mật khác**:
  + JWT cho xác thực
  + Phân quyền Admin/User
  + Rate limiting
  + Validate dữ liệu đầu vào

#### 4.4. Tích hợp upload ảnh
- Sử dụng Cloudinary
- Xử lý tối ưu hình ảnh
- Lưu trữ publicId để quản lý

#### 4.5. Tối ưu hiệu năng cho API public
- Thêm cache layer cho các API public:
  + Sử dụng Redis hoặc Memory cache
  + Cache theo key là query params
  + Thời gian cache tùy theo API:
    * Danh sách: 5-15 phút
    * Chi tiết: 30-60 phút
    * Featured: 15-30 phút
  + Tự động clear cache khi có update

- Rate limiting cho API public:
  + Giới hạn số request/IP
  + Tăng giới hạn cho client đã đăng ký
  + Custom error response khi quá giới hạn

- Response optimization:
  + Chỉ trả về các field cần thiết
  + Nén dữ liệu response
  + Pagination với cursor-based
  + ETags để tránh response không cần thiết

## Kết quả triển khai

### Backend (NestJS)
- ✅ Schema cho Brand model
- ✅ DTOs cho request/response
- ✅ Service xử lý logic
- ✅ Controllers cho admin và user
- ✅ Module đăng ký các components
- ✅ Phân quyền admin với AdminRolesGuard

### API trung gian (Next.js)
- ✅ API routes cho admin:
  + GET/POST /api/admin/brands
  + GET/PATCH/DELETE /api/admin/brands/[id]
  + POST /api/admin/brands/upload/logo
  + GET /api/admin/brands/statistics
- ✅ API routes cho user (public):
  + GET /api/brands/public
  + GET /api/brands/public/[id]
  + GET /api/brands/public/featured

### Frontend
- ✅ BrandContext để quản lý state và API calls
- ✅ Tích hợp với AdminAuthContext
- ✅ Xử lý token tự động 