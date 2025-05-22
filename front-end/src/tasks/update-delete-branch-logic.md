# Cập nhật Logic Xóa Chi Nhánh

- [x] Phân tích mã nguồn hiện tại liên quan đến quản lý sản phẩm, chi nhánh và tồn kho.
- [x] Điều chỉnh logic xóa chi nhánh ở backend (`products.service.ts`):
    - Trong phương thức `removeBranchFromProducts(branchId: string)`:
        - Khi một chi nhánh bị xóa, tìm tất cả sản phẩm có `inventory`, `variantInventory`, hoặc `combinationInventory` liên quan đến `branchId` đó.
        - Đối với mỗi sản phẩm:
            - Lọc bỏ các mục tồn kho (`inventory`, `variantInventory`, `combinationInventory`) liên quan đến `branchId` bị xóa. Điều này tương đương với việc đặt tồn kho của chi nhánh đó về 0 cho sản phẩm này.
            - Thêm kiểm tra null/undefined cho các mảng inventory trước khi thao tác.
            - Tính toán lại tổng số lượng tồn kho (`finalTotalInventory`) và cập nhật `product.status` ('active', 'out_of_stock') dựa trên tổng tồn kho còn lại từ các chi nhánh khác.
- [x] Điều chỉnh front-end để gọi đúng API endpoint khi xóa chi nhánh:
    - File `front-end/src/contexts/BranchContext.tsx` đã có hàm `forceDeleteBranch` gọi API `DELETE /admin/branches/:id/force`.
    - File `front-end/src/pages/admin/branches/index.tsx` đã được cập nhật để sử dụng `forceDeleteBranch` khi người dùng xác nhận xóa.
    - Đã import `toast` để xử lý thông báo.
- [ ] **Người dùng kiểm tra lại chức năng xóa chi nhánh và xóa sản phẩm trên giao diện.**
- [ ] **QUAN TRỌNG:** Nếu lỗi "Internal server error" vẫn còn khi xóa chi nhánh hoặc xóa sản phẩm, **người dùng cần cung cấp log lỗi chi tiết từ console của backend NestJS**. Không có log này, việc chẩn đoán và sửa lỗi sẽ rất khó khăn.
- [ ] Xem xét lại quyền của tài khoản admin khi thực hiện xóa sản phẩm (hiện tại yêu cầu `superadmin`).
- [ ] Xem xét lại Mongoose pre/post hooks trong `ProductSchema` và `BranchSchema` nếu có, vì chúng có thể gây lỗi khi xóa.
