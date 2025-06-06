# Hướng dẫn Deploy Backend NestJS lên Vercel

## Các bước thực hiện

1. **Đăng nhập vào Vercel**
   - Truy cập [vercel.com](https://vercel.com) và đăng nhập bằng tài khoản GitHub, GitLab hoặc Bitbucket.

2. **Import Project**
   - Nhấp vào "Add New..." > "Project"
   - Chọn repository chứa mã nguồn backend
   - Chọn thư mục `back-end` làm root directory

3. **Cấu hình Environment Variables**
   - Thêm tất cả biến môi trường cần thiết (xem danh sách bên dưới)
   - Đảm bảo các biến môi trường quan trọng như MongoDB URI, JWT Secret đã được cấu hình

4. **Deploy**
   - Nhấp vào "Deploy"
   - Đợi quá trình build và deploy hoàn tất

5. **Kiểm tra**
   - Truy cập endpoint health check: `https://your-project.vercel.app/api/health`
   - Kiểm tra Swagger API docs: `https://your-project.vercel.app/api/docs`

## Danh sách Environment Variables cần thiết

### Database & Authentication
- `MONGODB_URI`: Connection string MongoDB
- `JWT_SECRET`: Secret key cho JWT
- `JWT_EXPIRATION`: Thời gian hết hạn JWT (48h)
- `JWT_REFRESH_SECRET`: Secret key cho refresh token
- `JWT_REFRESH_EXPIRATION`: Thời gian hết hạn refresh token (48h)

### Admin Configuration
- `JWT_ADMIN_EXPIRATION`: Thời gian hết hạn JWT admin (1h)
- `JWT_ADMIN_REFRESH_EXPIRATION`: Thời gian hết hạn refresh token admin (1h)
- `SUPER_ADMIN_NAME`: Tên super admin
- `SUPER_ADMIN_EMAIL`: Email super admin
- `SUPER_ADMIN_PASSWORD`: Mật khẩu super admin
- `SUPER_ADMIN_PHONE`: Số điện thoại super admin

### Frontend Configuration
- `FRONTEND_URL`: URL của frontend (https://project-final-livid.vercel.app)

### Email Configuration
- `EMAIL_SERVICE`: smtp
- `EMAIL_USER`: Email gửi
- `EMAIL_PASSWORD`: Mật khẩu email
- `EMAIL_FROM`: Email người gửi

### OAuth Configuration
- `GOOGLE_CLIENT_ID`: Google OAuth Client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth Client Secret
- `GOOGLE_CALLBACK_URL`: URL callback Google OAuth

### Cloudinary Configuration
- `CLOUDINARY_CLOUD_NAME`: Tên cloud Cloudinary
- `CLOUDINARY_API_KEY`: API key Cloudinary
- `CLOUDINARY_API_SECRET`: API secret Cloudinary
- `CLOUDINARY_UPLOAD_PRESET`: Upload preset
- `CLOUDINARY_FOLDER_BANNER`: Thư mục banner
- `CLOUDINARY_FOLDER_PRODUCT`: Thư mục sản phẩm
- `CLOUDINARY_FOLDER_CATEGORY`: Thư mục danh mục
- `CLOUDINARY_FOLDER_USER`: Thư mục người dùng
- `CLOUDINARY_FOLDER_BLOG`: Thư mục blog

### Payment Configuration
- `STRIPE_SECRET_KEY`: Stripe secret key
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Stripe publishable key
- `STRIPE_WEBHOOK_SECRET`: Stripe webhook secret
- `STRIPE_WEBHOOK_URL`: URL webhook Stripe

- `MOMO_PARTNER_CODE`: Mã đối tác MoMo
- `MOMO_ACCESS_KEY`: Access key MoMo
- `MOMO_SECRET_KEY`: Secret key MoMo
- `MOMO_API_ENDPOINT`: Endpoint API MoMo
- `MOMO_IPN_URL`: URL IPN MoMo
- `MOMO_REDIRECT_URL`: URL redirect MoMo

### Shipping Configuration
- `VIETTEL_POST_URL`: URL API Viettel Post
- `VIETTEL_POST_USERNAME`: Username Viettel Post
- `VIETTEL_POST_PASSWORD`: Password Viettel Post
- `VIETTEL_POST_WEBHOOK_URL`: URL webhook Viettel Post

### AI Configuration
- `GEMINI_API_KEY`: API key Gemini AI
- `GEMINI_API_URL`: URL API Gemini
- `GEMINI_MODEL_NAME`: Tên model Gemini

### System Configuration
- `NODE_ENV`: production

## Lưu ý quan trọng

1. **Serverless Functions**: Vercel chạy trên serverless, không phải server truyền thống
2. **Cold Start**: Lần đầu request có thể chậm do cold start
3. **Timeout**: Maximum 30 giây cho mỗi request
4. **Memory**: Giới hạn memory tùy theo plan Vercel
5. **File Upload**: Cần cấu hình đặc biệt cho file upload lớn
6. **Database**: Nên sử dụng MongoDB Atlas hoặc database cloud
7. **Session**: Cần cấu hình session store phù hợp với serverless

## Troubleshooting

### Lỗi thường gặp:
1. **Environment variables không được load**: Kiểm tra cấu hình trong Vercel Dashboard
2. **CORS error**: Kiểm tra cấu hình CORS trong `main.ts` và `api/index.ts`
3. **Database connection**: Kiểm tra MongoDB URI và network access
4. **Function timeout**: Tối ưu code để giảm thời gian xử lý

### Logs:
- Xem logs trong Vercel Dashboard > Functions tab
- Sử dụng `console.log` để debug (tránh quá nhiều logs) 