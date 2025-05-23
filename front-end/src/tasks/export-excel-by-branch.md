# Xuất Excel sản phẩm theo chi nhánh

- [x] Nhiệm vụ 1: **Backend** - Cập nhật `AdminProductsController` để endpoint xuất Excel chấp nhận `branchId` làm query parameter (thông qua việc cập nhật `QueryProductDto`).
- [x] Nhiệm vụ 2: **Backend** - Cập nhật `ProductsService.findAllForExport` để lọc sản phẩm theo `branchId` nếu được cung cấp.
    - [x] Sửa đổi `matchStage` để bao gồm điều kiện lọc theo `inventory.branchId` hoặc `variantInventory.branchId`.
    - [x] Đảm bảo rằng trường "Tồn kho" trong file Excel phản ánh tồn kho của chi nhánh đã chọn, chứ không phải tổng tồn kho.
- [x] Nhiệm vụ 3: **Frontend** - Tạo state và UI cho modal chọn chi nhánh trong `front-end/src/pages/admin/products/index.tsx`.
    - [x] Thêm state để quản lý hiển thị modal.
    - [x] Thêm state để lưu danh sách chi nhánh và chi nhánh được chọn.
- [x] Nhiệm vụ 4: **Frontend** - Gọi API lấy danh sách chi nhánh và hiển thị trong modal.
    - [x] Tạo hàm gọi API (sử dụng `fetchBranchesList` từ hook `useBranches`).
    - [x] Gọi `fetchBranchesList` khi mở modal.
- [x] Nhiệm vụ 5: **Frontend** - Cập nhật logic nút "Xuất Excel".
    - [x] Khi nhấp, mở modal chọn chi nhánh (`handleOpenExportModal`).
    - [x] Sau khi chọn chi nhánh, gọi API xuất Excel với `branchId` đã chọn (`handleConfirmExportByBranch`).
