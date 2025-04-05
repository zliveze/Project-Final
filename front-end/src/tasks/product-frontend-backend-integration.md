# Nhiệm vụ tích hợp API Product vào giao diện Frontend

## Các nhiệm vụ cần thực hiện

[x] Nhiệm vụ 1: Cập nhật getServerSideProps trong trang chi tiết sản phẩm [slug].tsx để lấy dữ liệu từ API
[x] Nhiệm vụ 2: Tích hợp tính năng thêm vào giỏ hàng trong ProductInfo.tsx với API
[x] Nhiệm vụ 3: Tích hợp tính năng thêm vào danh sách yêu thích trong ProductInfo.tsx với API
[x] Nhiệm vụ 4: Tích hợp tính năng gửi đánh giá (ReviewForm.tsx) với API 
[x] Nhiệm vụ 5: Cập nhật ProductContext.tsx để hỗ trợ thêm các phương thức tương tác với giỏ hàng
[x] Nhiệm vụ 6: Sửa đổi component RecommendedProducts để lấy sản phẩm liên quan từ API
[x] Nhiệm vụ 7: Thêm thông báo (toast) khi thực hiện thành công các thao tác với sản phẩm
[x] Nhiệm vụ 8: Xử lý kiểm tra trạng thái đăng nhập trước khi thực hiện các thao tác yêu cầu xác thực

## Chi tiết triển khai

### Nhiệm vụ 1: Cập nhật getServerSideProps trong [slug].tsx

- Sử dụng API endpoint GET /products/slug/{slug} để lấy thông tin chi tiết sản phẩm
- Fetch đánh giá sản phẩm từ API endpoint GET /reviews/product/{productId}
- Fetch sản phẩm liên quan từ API endpoint GET /products với tham số relatedTo={productId}

### Nhiệm vụ 2: Tích hợp thêm vào giỏ hàng

- Cập nhật hàm handleAddToCart trong ProductInfo.tsx để gọi API POST /cart/add với dữ liệu sản phẩm
- Xử lý thông báo thành công/thất bại
- Cập nhật số lượng sản phẩm trong giỏ hàng trên giao diện header

### Nhiệm vụ 3: Tích hợp thêm vào danh sách yêu thích

- Cập nhật hàm handleAddToWishlist để gọi API POST /wishlist/add
- Thêm xử lý kiểm tra xác thực và chuyển hướng đến trang đăng nhập nếu chưa đăng nhập

### Nhiệm vụ 4: Tích hợp gửi đánh giá

- Cập nhật hàm onSubmit trong ReviewForm.tsx để gọi API POST /reviews
- Thêm xử lý tải lên hình ảnh đánh giá
- Cập nhật UI ngay lập tức sau khi gửi đánh giá thành công

### Nhiệm vụ 5: Cập nhật ProductContext

- Thêm các phương thức tương tác với giỏ hàng: addToCart, removeFromCart, updateCartQuantity
- Thêm các phương thức tương tác với wishlist: addToWishlist, removeFromWishlist
- Thêm các phương thức liên quan đến đánh giá: addReview, getProductReviews

### Nhiệm vụ 6: Cập nhật RecommendedProducts

- Sửa đổi component để sử dụng dữ liệu từ API thay vì dữ liệu mẫu
- Thêm xử lý loading state và error state

### Nhiệm vụ 7: Thêm thông báo 

- Đảm bảo mỗi hành động quan trọng đều hiển thị thông báo phù hợp cho người dùng
- Sử dụng toast từ react-toastify với các style phù hợp với thiết kế

### Nhiệm vụ 8: Xử lý kiểm tra trạng thái đăng nhập

- Tạo một hàm utility checkAuth để kiểm tra trạng thái đăng nhập
- Tích hợp hàm này vào các hành động yêu cầu xác thực
- Hiển thị modal đăng nhập hoặc chuyển hướng khi cần thiết 