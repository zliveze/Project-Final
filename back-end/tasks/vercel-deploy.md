# Nhiệm vụ cấu hình backend để deploy lên Vercel

[x] Kiểm tra cấu trúc dự án hiện tại
[x] Tạo file vercel.json
[x] Tạo file api/index.ts cho serverless function
[x] Kiểm tra cấu hình CORS
[x] Thêm health check endpoint
[x] Tạo file hướng dẫn README_VERCEL_DEPLOY.md
[] Kiểm tra cấu hình MongoDB và các biến môi trường
[] Kiểm tra cấu hình Cloudinary
[] Kiểm tra cấu hình file upload
[] Tối ưu hóa cho serverless

## Lưu ý

1. Đã cấu hình các file cần thiết:
   - vercel.json: Cấu hình build và routes
   - api/index.ts: Entry point cho serverless function
   - .vercelignore: Loại trừ các file không cần thiết

2. Các biến môi trường cần được cấu hình trong Vercel Dashboard:
   - Database & Authentication
   - Admin Configuration
   - Frontend Configuration
   - Email Configuration
   - OAuth Configuration
   - Cloudinary Configuration
   - Payment Configuration
   - Shipping Configuration
   - AI Configuration
   - System Configuration

3. Sau khi deploy, cần kiểm tra:
   - Health check endpoint: https://your-project.vercel.app/api/health
   - Swagger API docs: https://your-project.vercel.app/api/docs
   - CORS configuration
   - Database connection
   - File upload functionality 