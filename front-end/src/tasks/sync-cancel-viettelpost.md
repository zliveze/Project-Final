# Đồng bộ trạng thái Hủy đơn hàng sang Viettel Post

- [x] **Backend:** Cập nhật phương thức `cancelOrder` trong `OrdersService` để gọi API `UpdateOrder` của Viettel Post với `TYPE = 4` khi hủy đơn hàng và đơn hàng có `trackingCode`.
- [x] **Backend:** Thêm xử lý lỗi cho việc gọi API Viettel Post trong `cancelOrder`.
- [x] **Backend:** Thêm log chi tiết trong `OrdersService` và `ViettelPostService` để debug quá trình đồng bộ hủy đơn.
