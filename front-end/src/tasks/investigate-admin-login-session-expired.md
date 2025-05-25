# Điều tra lỗi error=session_expired trên trang đăng nhập Admin

- [x] Kiểm tra `front-end/src/middleware.ts` để hiểu logic xử lý phiên và chuyển hướng cho các trang admin.
- [x] Kiểm tra trang `front-end/src/pages/admin/auth/login.tsx` xem cách nó hiển thị lỗi `session_expired` và xử lý cờ `adminLoggedOut`.
- [x] Kiểm tra `front-end/src/middleware.ts` để hiểu logic xử lý phiên và chuyển hướng cho các trang admin.
- [x] Kiểm tra trang `front-end/src/pages/admin/auth/login.tsx` xem cách nó hiển thị lỗi `session_expired` và xử lý cờ `adminLoggedOut`.
- [x] Kiểm tra `front-end/src/contexts/AdminAuthContext.tsx` để xem cách quản lý trạng thái đăng nhập, làm mới token và xử lý lỗi 401.
- [x] Kiểm tra `front-end/src/pages/_app.tsx` và cách `AdminAuthProvider` được sử dụng.
- [x] **Đã sửa lỗi lồng `AdminAuthProvider` trong `front-end/src/contexts/index.tsx`.**
- [x] **Xác nhận: Vòng lặp lỗi `session_expired` đã được giải quyết sau khi sửa lỗi lồng context.**
- [ ] (Đã giải quyết) Xác định nguyên nhân gây ra việc liên tục chuyển hướng với lỗi `session_expired` nếu vẫn còn sau khi sửa lỗi lồng context. Các giả thuyết chính còn lại:
    - Vấn đề với `adminRefreshToken` (không hợp lệ, hết hạn, không được backend chấp nhận khi refresh).
    - Một API call tự động được thực hiện trên trang login hoặc trong layout chung (nếu có) gây ra lỗi 401 và kích hoạt vòng lặp (ít khả năng hơn sau khi sửa lỗi lồng context).
- [ ] (Không cần thiết nữa) **Quan trọng:** Yêu cầu người dùng kiểm tra lại hoạt động sau khi sửa lỗi lồng context. Nếu vấn đề vẫn còn, kiểm tra Network tab trong trình duyệt khi lỗi xảy ra để theo dõi dòng request/response.
- [ ] (Không cần thiết cho lỗi này nữa) Kiểm tra xem trang `/admin/auth/login` có sử dụng `getLayout` để áp dụng một layout admin chung hay không. Nếu có, kiểm tra layout đó.
- [ ] (Không cần thiết cho lỗi này nữa) **Quan trọng:** Yêu cầu người dùng kiểm tra logic tạo và xác thực token phía backend (đặc biệt là `accessToken`, `refreshToken` và API refresh, bao gồm cả thời gian sống của token).
- [ ] (Đã giải quyết) Đề xuất và thực hiện giải pháp nếu có lỗi (có thể cần thay đổi ở cả frontend và backend).
