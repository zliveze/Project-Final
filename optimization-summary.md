# Tổng kết tối ưu hóa backend MongoDB

## 1. Thêm Indexes

### ReviewSchema
- Đã thêm các index đơn cho các trường tìm kiếm phổ biến: userId, productId, status, rating, createdAt, isDeleted
- Đã thêm các compound index cho các truy vấn phổ biến: 
  - { productId: 1, status: 1 }
  - { productId: 1, status: 1, isDeleted: 1 }
  - { userId: 1, isDeleted: 1 }
  - { productId: 1, rating: 1, status: 1 }

### Kiểm tra và sử dụng Text Indexes 
- Đã thêm kiểm tra text index trong ProductsService để sử dụng hiệu quả hơn khi tìm kiếm

## 2. Tối ưu truy vấn với Projection

### ReviewsService
- Đã thêm projection chính xác cho các phương thức:
  - findAllByUser: chỉ lấy thông tin cần thiết cho hiển thị đánh giá của người dùng
  - findAllByProduct: chỉ lấy thông tin cần thiết cho hiển thị đánh giá của sản phẩm
  - findAll: chỉ lấy các trường cần thiết cho danh sách đánh giá

### ProductsService
- Đã tối ưu projection trong các phương thức:
  - findAllLight: chỉ lấy các trường cần thiết cho hiển thị danh sách sản phẩm
  - findAllForAdmin: chỉ lấy các trường cần thiết cho giao diện admin

## 3. Sử dụng .lean() cho truy vấn chỉ đọc

- Đã thêm .lean() cho tất cả các phương thức chỉ đọc trong ReviewsService và ProductsService
- Điều này giúp giảm đáng kể thời gian xử lý và bộ nhớ sử dụng vì không phải tạo các đối tượng Mongoose đầy đủ

## 4. Tối ưu Aggregation Pipeline

### ReviewsService
- Thay thế nhiều truy vấn countDocuments thành một aggregation duy nhất trong phương thức countByStatus
- Cải thiện pipeline getRatingDistribution để tính toán hiệu quả hơn

### ProductsService
- Đã thay thế nhiều truy vấn và xử lý bằng một aggregation pipeline duy nhất trong findAllForAdmin
- Sử dụng $facet để đếm tổng và phân trang trong cùng một pipeline
- Sử dụng $lookup để nối dữ liệu từ các collection brands và categories
- Sử dụng $addFields để tính toán các trường phụ thuộc

## 5. Giảm thiểu truy vấn trong vòng lặp

- Thay thế các truy vấn riêng lẻ trong vòng lặp map() bằng aggregation pipeline với $lookup
- Khi cần thực hiện nhiều truy vấn, sử dụng Promise.all() để chạy song song
- Trong ProductsService.findAllForAdmin, đã chuyển đổi từ việc thực hiện truy vấn riêng lẻ để lấy thông tin thương hiệu và danh mục sang việc sử dụng $lookup trong aggregation pipeline

## 6. Các tối ưu khác

- Sử dụng Promise.all() để thực hiện song song các truy vấn đếm và lấy dữ liệu
- Xử lý đúng đắn các ObjectId trong filter
- Cải thiện việc xử lý các tham số boolean từ query string
- Thêm xử lý lỗi rõ ràng và log lỗi

## Kết quả

Các tối ưu hóa này có thể mang lại những cải thiện đáng kể:
1. **Giảm thời gian phản hồi**: Giảm thời gian truy vấn database
2. **Tăng throughput**: Xử lý nhiều request hơn với cùng tài nguyên
3. **Giảm tải database**: Truy vấn ít hơn, hiệu quả hơn
4. **Cải thiện khả năng mở rộng**: Hệ thống có thể phát triển với lượng dữ liệu lớn hơn 