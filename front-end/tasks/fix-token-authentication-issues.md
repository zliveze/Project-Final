# Nhiệm vụ sửa lỗi xác thực token cho Admin Dashboard

## Các vấn đề đã phát hiện
- [x] Vấn đề 1: `useApiStats` hook gặp vấn đề về kiểm tra xác thực và loop vô hạn
- [x] Vấn đề 2: Không đồng bộ giữa cơ chế lưu trữ token trong Context và các hook khác
- [x] Vấn đề 3: Hệ thống không kiểm tra cookie cùng với localStorage để xác thực
- [x] Vấn đề 4: Thiếu cơ chế ngăn chặn gọi API khi đã đăng xuất

## Giải pháp
- [x] Cải thiện `useApiStats.ts` để kiểm tra đồng thời localStorage và cookie
- [x] Thêm cơ chế giới hạn số lần gọi API để tránh vòng lặp vô hạn
- [x] Cải thiện AdminAuthContext để đồng bộ tốt hơn với hooks và SSR
- [x] Thêm chức năng resetFetchState để có thể reset trạng thái nếu cần

## Cách hoạt động của SSR và Client-side Auth
1. Khi truy cập trang, server sẽ kiểm tra cookie token trong request
2. Nếu có token hợp lệ, SSR sẽ tải dữ liệu ban đầu
3. Client-side sẽ tiếp tục kiểm tra token từ localStorage và cookie
4. Các yêu cầu API tiếp theo sẽ sử dụng token từ context, localStorage hoặc cookie

## Kiểm thử
- [ ] Kiểm tra trang admin/products sau khi đăng nhập
- [ ] Kiểm tra tính nhất quán của logs trong console
- [ ] Kiểm tra tính toàn vẹn của dữ liệu khi token hết hạn
- [ ] Kiểm tra quá trình làm mới token tự động 