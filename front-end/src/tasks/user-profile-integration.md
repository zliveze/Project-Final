# Nhiệm vụ tích hợp API Backend cho Profile

[x] Nhiệm vụ 1: Tạo service UserApiService để xử lý các cuộc gọi API liên quan đến người dùng
[x] Nhiệm vụ 2: Cập nhật ProfileContext để sử dụng UserApiService
[x] Nhiệm vụ 3: Thêm xử lý xác thực từ AuthContext
[x] Nhiệm vụ 4: Bổ sung xử lý lỗi và trạng thái loading
[x] Nhiệm vụ 5: Cập nhật các API endpoint phù hợp với backend
[x] Nhiệm vụ 6: Kiểm tra và sửa các handler trong ProfileContext để đảm bảo hoạt động đúng với backend
[ ] Nhiệm vụ 7: Cập nhật documents và định dạng API response/request
[ ] Nhiệm vụ 8: Test đầy đủ các chức năng: quản lý profile, địa chỉ, wishlist, đơn hàng, thông báo, đánh giá

## Các chức năng cần hoàn thiện

### Quản lý tài khoản người dùng
- [x] Hiển thị thông tin tài khoản
- [x] Cập nhật thông tin tài khoản
- [x] Thêm/sửa/xóa địa chỉ
- [x] Đặt địa chỉ mặc định

### Quản lý wishlist
- [x] Hiển thị danh sách sản phẩm yêu thích
- [x] Xóa sản phẩm khỏi wishlist
- [x] Thêm sản phẩm từ wishlist vào giỏ hàng

### Quản lý đơn hàng
- [x] Hiển thị danh sách đơn hàng
- [x] Lọc đơn hàng theo trạng thái
- [x] Xem chi tiết đơn hàng
- [x] Hủy đơn hàng
- [x] Yêu cầu trả hàng
- [x] Tải hóa đơn
- [x] Mua lại sản phẩm từ đơn hàng

### Quản lý thông báo
- [x] Hiển thị danh sách thông báo
- [x] Đánh dấu thông báo đã đọc
- [x] Đánh dấu tất cả là đã đọc
- [x] Xóa thông báo

### Quản lý đánh giá
- [x] Hiển thị danh sách đánh giá
- [x] Chỉnh sửa đánh giá
- [x] Xóa đánh giá 