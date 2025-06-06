# Nhiệm vụ sửa lỗi Mixed Content

[x] Sửa URL API từ HTTP sang HTTPS trong file next.config.ts
[] Kiểm tra các file khác có sử dụng URL HTTP trực tiếp và sửa nếu cần
[] Kiểm tra lại hoạt động của ứng dụng sau khi sửa

## Giải thích lỗi
Lỗi "Mixed Content" xảy ra khi trang web được tải qua HTTPS (kết nối an toàn) nhưng lại cố gắng tải các tài nguyên qua HTTP (kết nối không an toàn). Trình duyệt sẽ chặn các yêu cầu này vì lý do bảo mật.

Trong trường hợp này, trang web tại https://project-final-livid.vercel.app/ đang cố gắng gọi API từ https://backendyumin.vercel.app/api (sử dụng HTTP thay vì HTTPS). 