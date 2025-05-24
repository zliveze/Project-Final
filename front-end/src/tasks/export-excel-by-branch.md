# Xuất Excel sản phẩm theo chi nhánh

- [x] Nhiệm vụ 1: **Backend** - Cập nhật `AdminProductsController` để endpoint xuất Excel chấp nhận `branchId` làm query parameter (thông qua việc cập nhật `QueryProductDto`).
- [ ] Nhiệm vụ 2: **Backend** - Cập nhật `ProductsService.findAllForExport` để lọc sản phẩm theo `branchId` nếu được cung cấp và sửa lỗi.
    - [x] Sửa đổi `matchStage` để bao gồm điều kiện lọc theo `inventory.branchId` hoặc `variantInventory.branchId`.
    - [x] Đảm bảo rằng trường "Tồn kho" trong file Excel phản ánh tồn kho của chi nhánh đã chọn (bao gồm cả xử lý cho sản phẩm có biến thể), chứ không phải tổng tồn kho.
    - [ ] Khắc phục lỗi "Unauthorized" khi xuất theo một chi nhánh (cần kiểm tra lại sau các thay đổi).
    - [x] Khắc phục lỗi "không được" khi xuất tất cả chi nhánh (đã sửa ở frontend, nút không còn bị disabled).
    - [x] Đảm bảo các trường xuất ra đúng yêu cầu: "Loại hàng", "nhóm hàng", "mã hàng", "mã vạch", "tên hàng", "giá bán", "giá vốn", "tồn kho", "Hình ảnh".
- [x] Nhiệm vụ 3: **Frontend** - Tạo state và UI cho modal chọn chi nhánh trong `front-end/src/pages/admin/products/index.tsx`.
    - [x] Thêm state để quản lý hiển thị modal.
    - [x] Thêm state để lưu danh sách chi nhánh và chi nhánh được chọn.
- [x] Nhiệm vụ 4: **Frontend** - Gọi API lấy danh sách chi nhánh và hiển thị trong modal.
    - [x] Tạo hàm gọi API (sử dụng `fetchBranchesList` từ hook `useBranches`).
    - [x] Gọi `fetchBranchesList` khi mở modal.
- [x] Nhiệm vụ 5: **Frontend** - Cập nhật logic nút "Xuất Excel".
    - [x] Khi nhấp, mở modal chọn chi nhánh (`handleOpenExportModal`).
    - [x] Đảm bảo request API xuất Excel (cả khi có và không có `branchId`) được gửi đúng cách với token xác thực (đã kiểm tra, token được gửi).
    - [x] Sửa lỗi nút "Xuất Excel" bị vô hiệu hóa khi không chọn chi nhánh.
