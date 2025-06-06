# Deploy Backend NestJS lên Vercel

## ✅ Đã cấu hình xong

Backend đã được cấu hình sẵn để deploy lên Vercel với các file:

- `vercel.json` - Cấu hình deployment
- `api/index.ts` - Entry point serverless
- `.vercelignore` - Loại trừ files không cần thiết
- `package.json` - Đã thêm script `vercel-build`

## 🚀 Cách deploy

### 1. Qua Vercel Dashboard (Khuyến nghị)
1. Đăng nhập [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import repository từ GitHub
4. **Quan trọng**: Chọn thư mục `back-end` làm Root Directory
5. Thêm Environment Variables (xem danh sách bên dưới)
6. Click "Deploy"

### 2. Qua CLI
```bash
cd back-end
npx vercel --prod
```

## 🔧 Environment Variables cần thiết

Trong Vercel Dashboard > Settings > Environment Variables, thêm:

### Cơ bản
- `NODE_ENV` = `production`
- `MONGODB_URI` = `mongodb+srv://...`
- `JWT_SECRET` = `your_jwt_secret`
- `FRONTEND_URL` = `https://project-final-livid.vercel.app`

### Email & OAuth
- `EMAIL_USER` = `your_email@gmail.com`
- `EMAIL_PASSWORD` = `your_app_password`
- `GOOGLE_CLIENT_ID` = `your_google_client_id`
- `GOOGLE_CLIENT_SECRET` = `your_google_client_secret`

### Cloudinary
- `CLOUDINARY_CLOUD_NAME` = `your_cloud_name`
- `CLOUDINARY_API_KEY` = `your_api_key`
- `CLOUDINARY_API_SECRET` = `your_api_secret`

### Payment
- `STRIPE_SECRET_KEY` = `sk_test_...`
- `STRIPE_WEBHOOK_SECRET` = `whsec_...`
- `MOMO_PARTNER_CODE` = `your_partner_code`
- `MOMO_ACCESS_KEY` = `your_access_key`
- `MOMO_SECRET_KEY` = `your_secret_key`

### Shipping
- `VIETTEL_POST_USERNAME` = `your_username`
- `VIETTEL_POST_PASSWORD` = `your_password`

### AI
- `GEMINI_API_KEY` = `your_gemini_api_key`

## 📝 Lưu ý quan trọng

1. **Root Directory**: Phải chọn `back-end` làm root directory trong Vercel
2. **Environment Variables**: Phải thêm đầy đủ các biến môi trường
3. **Database**: Sử dụng MongoDB Atlas (cloud database)
4. **CORS**: Đã cấu hình cho domain Vercel của bạn
5. **Serverless**: Timeout tối đa 30 giây, memory 1GB

## 🔗 URL sau khi deploy

- API: `https://your-backend.vercel.app/api`
- Swagger: `https://your-backend.vercel.app/api/docs`
- Health: `https://your-backend.vercel.app/api/health`

## 🐛 Troubleshooting

- **Build failed**: Kiểm tra TypeScript errors
- **Runtime error**: Xem logs trong Vercel Dashboard > Functions
- **CORS error**: Kiểm tra FRONTEND_URL environment variable
- **Database error**: Kiểm tra MONGODB_URI và network access

## 📚 Chi tiết đầy đủ

Xem file `VERCEL_DEPLOYMENT.md` để có hướng dẫn chi tiết hơn.
