# Triển khai tổ hợp biến thể sản phẩm

## Mô tả
Triển khai tính năng quản lý tổ hợp biến thể sản phẩm, cho phép mỗi biến thể có thể có nhiều tổ hợp thuộc tính (như màu sắc, kích thước) với giá và số lượng tồn kho riêng biệt cho mỗi tổ hợp tại mỗi chi nhánh.

## Các thay đổi đã thực hiện

### 1. Cập nhật ProductContext.tsx
- Thêm phương thức `updateCombinationInventory` để cập nhật tồn kho cho tổ hợp biến thể
- Cập nhật interface để hỗ trợ tổ hợp biến thể

### 2. Cập nhật types.ts
- Thêm interface `VariantCombination` để định nghĩa cấu trúc dữ liệu cho tổ hợp biến thể
- Thêm interface `CombinationInventoryItem` để định nghĩa cấu trúc dữ liệu cho tồn kho tổ hợp biến thể
- Cập nhật interface `ProductVariant` để bổ sung trường `combinations`

### 3. Cập nhật useProductVariants.ts
- Cập nhật hook để hỗ trợ quản lý tổ hợp biến thể
- Thêm logic để tạo và quản lý tổ hợp biến thể dựa trên các thuộc tính của biến thể

### 4. Cập nhật useProductInventory.ts
- Thêm state và phương thức để quản lý tồn kho tổ hợp biến thể
- Thêm phương thức `handleSelectVariantForCombinations` để chọn biến thể cần quản lý tổ hợp
- Thêm phương thức `handleClearVariantSelection` để hủy chọn biến thể
- Thêm phương thức `handleCombinationInventoryChange` để cập nhật số lượng tồn kho cho tổ hợp

### 5. Cập nhật VariantForm.tsx
- Thêm giao diện để hiển thị và quản lý tổ hợp biến thể
- Thêm logic để tự động tạo tổ hợp từ các thuộc tính của biến thể
- Thêm giao diện để nhập giá cho từng tổ hợp

### 6. Cập nhật InventoryTab.tsx
- Thêm giao diện để hiển thị và quản lý tồn kho tổ hợp biến thể
- Thêm nút để chọn biến thể cần quản lý tổ hợp
- Thêm bảng hiển thị danh sách tổ hợp và số lượng tồn kho

### 7. Cập nhật ProductForm/index.tsx
- Kết nối các thành phần lại với nhau
- Truyền các props cần thiết cho InventoryTab

## Cách sử dụng
1. Tạo biến thể sản phẩm với các thuộc tính (màu sắc, kích thước, tông màu)
2. Hệ thống sẽ tự động tạo các tổ hợp dựa trên các thuộc tính đã nhập
3. Thiết lập giá cho từng tổ hợp trong form biến thể
4. Quản lý tồn kho cho từng tổ hợp trong tab Tồn kho:
   - Chọn chi nhánh
   - Chọn biến thể
   - Nhập số lượng cho từng tổ hợp

## Lưu ý
- Khi cập nhật số lượng tồn kho cho tổ hợp, hệ thống sẽ tự động cập nhật tổng số lượng tồn kho cho biến thể và chi nhánh
- Khi thêm/xóa thuộc tính của biến thể, hệ thống sẽ tự động cập nhật danh sách tổ hợp
- Mỗi tổ hợp có thể có giá riêng hoặc sử dụng giá của biến thể
