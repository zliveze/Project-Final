# Fix Order Controller Invalid ID Error

- [x] Nhiệm vụ 1: Phân tích `OrdersUserController` để tìm cách `orderId` được truyền vào hàm `findOne`.
  - Phát hiện: `orderId` được lấy từ `@Param('id')`. Nếu URL là `/orders/user`, thì `id` sẽ là "user".
- [x] Nhiệm vụ 2: Phân tích `OrdersService` để tìm cách `orderId` được xử lý trong hàm `findOne`.
  - Phát hiện: `OrdersService.findOne` kiểm tra `Types.ObjectId.isValid(id)`. Nếu `id` là "user", sẽ ném lỗi `NotFoundException("Invalid order ID: user")`.
- [x] Nhiệm vụ 3: Xác định nguyên nhân frontend gọi API `/orders/user` thay vì một endpoint hợp lệ cho danh sách đơn hàng của người dùng (ví dụ: `/orders`).
  - Phát hiện: Hàm `getOrders` trong `front-end/src/contexts/user/UserApiService.ts` đã gọi sai URL `${API_URL}/orders/user?...`.
- [x] Nhiệm vụ 4: Sửa lỗi ở frontend để gọi đúng API endpoint.
  - Đã sửa URL trong `UserApiService.ts` thành `${API_URL}/orders?...`.
- [ ] Nhiệm vụ 5: Kiểm tra lại chức năng sau khi sửa lỗi.
