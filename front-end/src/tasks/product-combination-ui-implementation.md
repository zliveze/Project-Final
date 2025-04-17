# Triển khai giao diện tổ hợp biến thể sản phẩm

## Mô tả
Cập nhật giao diện trang chi tiết sản phẩm để hỗ trợ hiển thị và chọn các tổ hợp biến thể. Tổ hợp biến thể cho phép quản lý chi tiết hơn các biến thể sản phẩm với nhiều thuộc tính kết hợp (như màu sắc, kích thước, tông màu) và giá riêng cho từng tổ hợp.

## Các thay đổi đã thực hiện

### 1. Cập nhật ProductVariants.tsx
- Thêm interface `VariantCombination` để định nghĩa cấu trúc dữ liệu cho tổ hợp biến thể
- Cập nhật interface `Variant` để bổ sung trường `combinations`
- Thêm state `selectedCombinationId` để theo dõi tổ hợp đang được chọn
- Cập nhật các phương thức xử lý sự kiện để hỗ trợ chọn tổ hợp
- Thêm giao diện hiển thị danh sách tổ hợp biến thể
- Cập nhật logic để tự động chọn tổ hợp phù hợp khi chọn màu sắc, kích thước, tông màu

### 2. Cập nhật ProductInfo.tsx
- Cập nhật interface `Variant` để bổ sung trường `combinationInventory`
- Cập nhật interface `ProductInfoProps` để hỗ trợ tổ hợp biến thể
- Thêm state `selectedCombination` để theo dõi tổ hợp đang được chọn
- Cập nhật logic tính giá hiển thị để hỗ trợ giá riêng của tổ hợp
- Cập nhật logic xử lý tồn kho để hiển thị số lượng tồn kho riêng của từng tổ hợp
- Cập nhật logic thêm vào giỏ hàng để hỗ trợ tổ hợp biến thể
- Cập nhật giao diện hiển thị chi nhánh để hiển thị tồn kho của tổ hợp tại từng chi nhánh

### 3. Cập nhật [slug].tsx
- Import `VariantCombination` từ ProductVariants.tsx
- Thêm state `selectedCombination` để theo dõi tổ hợp đang được chọn
- Cập nhật phương thức `handleSelectVariant` để hỗ trợ chọn tổ hợp
- Cập nhật `processedVariants` để bổ sung thông tin tồn kho của tổ hợp
- Cập nhật props truyền vào ProductInfo để hỗ trợ tổ hợp biến thể

## Cách hoạt động

1. Khi người dùng truy cập trang chi tiết sản phẩm, hệ thống sẽ tải thông tin sản phẩm bao gồm các biến thể và tổ hợp biến thể.

2. Người dùng có thể chọn biến thể sản phẩm bằng cách chọn màu sắc, kích thước, tông màu.

3. Sau khi chọn biến thể, hệ thống sẽ hiển thị danh sách các tổ hợp thuộc biến thể đó (nếu có).

4. Người dùng có thể chọn một tổ hợp cụ thể, và hệ thống sẽ hiển thị:
   - Giá riêng của tổ hợp đó (nếu có)
   - Số lượng tồn kho riêng của tổ hợp đó tại từng chi nhánh

5. Người dùng có thể chọn chi nhánh để xem tồn kho của tổ hợp tại chi nhánh đó.

6. Khi thêm vào giỏ hàng, hệ thống sẽ lưu thông tin về tổ hợp đã chọn và chi nhánh đã chọn.

## Lợi ích

- Quản lý chi tiết hơn các biến thể sản phẩm với nhiều thuộc tính kết hợp
- Thiết lập giá riêng cho từng tổ hợp thuộc tính
- Quản lý tồn kho chính xác đến từng tổ hợp tại mỗi chi nhánh
- Giao diện trực quan, dễ sử dụng cho người dùng

## Lưu ý

- Cần đảm bảo dữ liệu tổ hợp biến thể được trả về đúng định dạng từ API
- Cần kiểm tra kỹ logic tính giá và tồn kho để đảm bảo hiển thị chính xác
- Cần kiểm tra tương thích với các tính năng khác như giỏ hàng, danh sách yêu thích
- Cần đảm bảo rằng số lượng tồn kho được hiển thị chính xác cho từng tổ hợp tại từng chi nhánh
- Cần kiểm tra kỹ logic chọn chi nhánh để đảm bảo hiển thị đúng tồn kho của tổ hợp tại chi nhánh đó
