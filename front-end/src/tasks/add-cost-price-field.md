# Thêm và xử lý trường Giá Vốn cho sản phẩm

- [x] Nhiệm vụ 1: **Schema** - Cập nhật `ProductSchema` (`back-end/src/products/schemas/product.schema.ts`) để thêm trường `costPrice` (kiểu Number). Đặt vị trí gần các trường giá khác.
- [x] Nhiệm vụ 2: **Import Logic** - Cập nhật hàm `importProductsFromExcel` trong `products.service.ts`:
    - [x] Đọc giá trị "Giá vốn" từ file Excel.
    - [x] Lưu giá trị này vào trường `costPrice` mới khi tạo hoặc cập nhật sản phẩm.
- [x] Nhiệm vụ 3: **Export Logic** - Cập nhật hàm `findAllForExport` trong `products.service.ts` để cột "Giá vốn" trong file Excel xuất ra lấy dữ liệu từ trường `costPrice` mới.
