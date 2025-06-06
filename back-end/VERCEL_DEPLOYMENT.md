# Hướng dẫn Deploy Backend NestJS lên Vercel

## Chuẩn bị

### 1. Cài đặt Vercel CLI (tùy chọn)
```bash
npm i -g vercel
```

### 2. Cấu hình Environment Variables
Trong Vercel Dashboard, thêm các biến môi trường sau:

#### Database & Authentication
- `MONGODB_URI`: Connection string MongoDB
- `JWT_SECRET`: Secret key cho JWT
- `JWT_EXPIRATION`: Thời gian hết hạn JWT (48h)
- `JWT_REFRESH_SECRET`: Secret key cho refresh token
- `JWT_REFRESH_EXPIRATION`: Thời gian hết hạn refresh token (48h)

#### Admin Configuration
- `JWT_ADMIN_EXPIRATION`: Thời gian hết hạn JWT admin (1h)
- `JWT_ADMIN_REFRESH_EXPIRATION`: Thời gian hết hạn refresh token admin (1h)
- `SUPER_ADMIN_NAME`: Tên super admin
- `SUPER_ADMIN_EMAIL`: Email super admin
- `SUPER_ADMIN_PASSWORD`: Mật khẩu super admin
- `SUPER_ADMIN_PHONE`: Số điện thoại super admin

#### Frontend Configuration
- `FRONTEND_URL`: URL của frontend (https://project-final-livid.vercel.app)

#### Email Configuration
- `EMAIL_SERVICE`: smtp
- `EMAIL_USER`: Email gửi
- `EMAIL_PASSWORD`: Mật khẩu email
- `EMAIL_FROM`: Email người gửi

#### OAuth Configuration
- `GOOGLE_CLIENT_ID`: Google OAuth Client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth Client Secret
- `GOOGLE_CALLBACK_URL`: URL callback Google OAuth

#### Cloudinary Configuration
- `CLOUDINARY_CLOUD_NAME`: Tên cloud Cloudinary
- `CLOUDINARY_API_KEY`: API key Cloudinary
- `CLOUDINARY_API_SECRET`: API secret Cloudinary
- `CLOUDINARY_UPLOAD_PRESET`: Upload preset
- `CLOUDINARY_FOLDER_BANNER`: Thư mục banner
- `CLOUDINARY_FOLDER_PRODUCT`: Thư mục sản phẩm
- `CLOUDINARY_FOLDER_CATEGORY`: Thư mục danh mục
- `CLOUDINARY_FOLDER_USER`: Thư mục người dùng
- `CLOUDINARY_FOLDER_BLOG`: Thư mục blog

#### Payment Configuration
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

#### Shipping Configuration
- `VIETTEL_POST_URL`: URL API Viettel Post
- `VIETTEL_POST_USERNAME`: Username Viettel Post
- `VIETTEL_POST_PASSWORD`: Password Viettel Post
- `VIETTEL_POST_WEBHOOK_URL`: URL webhook Viettel Post

#### AI Configuration
- `GEMINI_API_KEY`: API key Gemini AI
- `GEMINI_API_URL`: URL API Gemini
- `GEMINI_MODEL_NAME`: Tên model Gemini

#### System Configuration
- `NODE_ENV`: production

## Cách Deploy

### Phương pháp 1: Deploy qua Vercel Dashboard
1. Đăng nhập vào [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import repository từ GitHub
4. Chọn thư mục `back-end` làm root directory
5. Thêm các environment variables
6. Click "Deploy"

### Phương pháp 2: Deploy qua CLI
```bash
cd back-end
vercel --prod
```

### Phương pháp 3: Deploy qua Git
1. Push code lên GitHub
2. Vercel sẽ tự động deploy khi có commit mới

## Cấu trúc Files quan trọng

- `vercel.json`: Cấu hình deployment Vercel
- `api/index.ts`: Entry point cho serverless function
- `.vercelignore`: Files/folders bị bỏ qua khi deploy
- `package.json`: Đã thêm script `vercel-build`

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

## URL sau khi deploy
- API: `https://your-project.vercel.app/api`
- Swagger: `https://your-project.vercel.app/api/docs`
- Health check: `https://your-project.vercel.app/api/health`
