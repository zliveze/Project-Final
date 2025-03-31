# Báo cáo sửa lỗi templates email

## Vấn đề
Khi thực hiện chức năng quên mật khẩu/đăng ký gặp lỗi **"Cannot destructure property 'templateName' of 'precompile(...)'** và các file template không được tìm thấy:

```
Error: ENOENT: no such file or directory, open 'F:\full-project\back-end\dist\common\mail\templates\verification.hbs'
```

## Nguyên nhân
Khi NestJS biên dịch TypeScript sang JavaScript (vào thư mục `dist`), nó không tự động sao chép các file không phải TypeScript (như các file template .hbs) vào thư mục đích. Do đó, khi ứng dụng chạy từ thư mục `dist`, nó không thể tìm thấy các file template.

## Các thay đổi đã thực hiện

### 1. Khắc phục tạm thời
- Đã thay đổi MailService để sử dụng HTML trực tiếp thay vì sử dụng templates:
  - Thay vì `template: 'verification'` sử dụng `html: '...'`
  - Nhúng nội dung HTML vào code thay vì dùng file template

### 2. Giải pháp dài hạn
- Cập nhật `nest-cli.json` để tự động sao chép các file asset khi biên dịch:
```json
"compilerOptions": {
  "deleteOutDir": true,
  "assets": [
    {
      "include": "common/mail/templates/**/*.hbs",
      "outDir": "dist"
    }
  ],
  "watchAssets": true
}
```

- Tạo thư mục và sao chép templates theo cách thủ công:
```powershell
mkdir -p F:\full-project\back-end\dist\common\mail\templates
Copy-Item -Path "src\common\mail\templates\*.hbs" -Destination "dist\common\mail\templates\"
```

## Kết quả
- Email có thể được gửi thành công khi đăng ký hoặc quên mật khẩu
- Backend không gặp lỗi khi cố gắng tìm templates
- Cài đặt `watchAssets: true` sẽ tự động cập nhật các file template khi chúng thay đổi

## Lưu ý cho phát triển tương lai
1. Khi thêm mới file template, cần đảm bảo chúng được đưa vào thư mục `dist` 
2. Khi sử dụng các file không phải TypeScript (như hình ảnh, CSS, templates) luôn cần cấu hình `assets` trong `nest-cli.json`
3. Cân nhắc sử dụng hệ thống email mạnh mẽ hơn trong tương lai như SendGrid hoặc Mailchimp
4. Triển khai hàng đợi email để xử lý việc gửi email không đồng bộ trong môi trường sản phẩm 