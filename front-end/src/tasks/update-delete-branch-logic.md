# Cập nhật Logic Xóa Chi Nhánh

- [x] Phân tích mã nguồn hiện tại liên quan đến quản lý sản phẩm, chi nhánh và tồn kho.
- [x] Điều chỉnh logic xóa chi nhánh ở backend (`products.service.ts`):
    - Trong phương thức `removeBranchFromProducts(branchId: string)`:
        - Khi một chi nhánh bị xóa, tìm tất cả sản phẩm có `inventory`, `variantInventory`, hoặc `combinationInventory` liên quan đến `branchId` đó.
        - Đối với mỗi sản phẩm:
            - Lọc bỏ các mục tồn kho (`inventory`, `variantInventory`, `combinationInventory`) liên quan đến `branchId` bị xóa. Điều này tương đương với việc đặt tồn kho của chi nhánh đó về 0 cho sản phẩm này.
            - Tính toán lại tổng số lượng tồn kho (`finalTotalInventory`) và cập nhật `product.status` ('active', 'out_of_stock') dựa trên tổng tồn kho còn lại từ các chi nhánh khác.
- [ ] Kiểm tra và đảm bảo logic hoạt động đúng như mong đợi.
