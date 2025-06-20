# Hướng dẫn sửa lỗi CORS

## Vấn đề
Frontend `https://project-final-livid.vercel.app` bị lỗi CORS khi gọi API từ backend `https://backendyumin.vercel.app`.

## Nguyên nhân
1. Biến môi trường `FRONTEND_URL` trên Vercel backend chưa được cấu hình đúng
2. Cấu hình CORS chưa bao gồm URL frontend production

## Giải pháp đã thực hiện

### 1. Cập nhật code CORS
- ✅ Đã thêm `https://project-final-livid.vercel.app` vào danh sách allowed origins trong `src/main.ts`
- ✅ Đã thêm `https://project-final-livid.vercel.app` vào danh sách allowed origins trong `api/index.ts`
- ✅ Đã thêm logging để debug CORS issues
- ✅ Đã cập nhật file `.env` local

### 2. Cần thực hiện trên Vercel Dashboard

**Bước 1: Truy cập Vercel Dashboard**
1. Đi tới https://vercel.com/dashboard
2. Chọn project backend (`backendyumin`)

**Bước 2: Cấu hình Environment Variables**
1. Vào tab "Settings" → "Environment Variables"
2. Tìm biến `FRONTEND_URL` (nếu có) hoặc tạo mới
3. Set giá trị: `https://project-final-livid.vercel.app`
4. Chọn Environment: `Production`, `Preview`, `Development` (tất cả)
5. Click "Save"

**Bước 3: Redeploy**
1. Vào tab "Deployments"
2. Click "..." trên deployment mới nhất
3. Chọn "Redeploy"
4. Hoặc push code mới để trigger deployment

## Kiểm tra

### 1. Kiểm tra logs
Sau khi deploy, kiểm tra logs trong Vercel Dashboard:
- Vào tab "Functions"
- Click vào function để xem logs
- Tìm dòng log: `CORS Origin check: https://project-final-livid.vercel.app`
- Đảm bảo không có lỗi `CORS blocked origin`

### 2. Test API
Mở browser console trên `https://project-final-livid.vercel.app` và test:
```javascript
fetch('https://backendyumin.vercel.app/api/health')
  .then(response => response.json())
  .then(data => console.log('Success:', data))
  .catch(error => console.error('Error:', error));
```

## Backup Solution
Nếu vẫn có vấn đề, có thể tạm thời set CORS origin = '*' (không khuyến khích cho production):

```typescript
// Trong api/index.ts và src/main.ts
origin: '*'  // Thay vì function check origin
```

## Các URL cần đảm bảo
- Frontend: `https://project-final-livid.vercel.app`
- Backend: `https://backendyumin.vercel.app`
- API Base: `https://backendyumin.vercel.app/api`

## Lưu ý
- Sau khi cập nhật environment variables, cần redeploy để áp dụng
- Có thể mất 1-2 phút để propagate changes
- Kiểm tra cả browser cache (hard refresh với Ctrl+Shift+R)
