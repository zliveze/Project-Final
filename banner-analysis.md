# Phân tích Models Banner và các models liên quan

## 1. Model Banner
Dựa trên file `front-end/src/modelsText/Banners.txt`, model Banner có cấu trúc:

```javascript
{
  "_id": "ObjectId",
  "title": "string",           // Tiêu đề banner
  "campaignId": "string",      // ID của chiến dịch liên kết
  "desktopImage": "string",    // URL ảnh cho desktop
  "mobileImage": "string",     // URL ảnh cho mobile
  "alt": "string",             // Mô tả alt cho ảnh
  "href": "string",            // Link khi click vào banner (ví dụ: /shop?campaign=xxx)
  "active": "boolean",         // Trạng thái hiển thị
  "order": "number",           // Thứ tự hiển thị
  "startDate": "date",         // Ngày bắt đầu hiển thị banner (tùy chọn)
  "endDate": "date",           // Ngày kết thúc hiển thị banner (tùy chọn)
  "createdAt": "date",
  "updatedAt": "date"
}
```

## 2. Phân tích chức năng Banner
Từ file `front-end/src/pages/admin/banners/index.tsx`, các chức năng quản lý Banner bao gồm:

1. **Danh sách Banner**: Hiển thị danh sách các banner với thông tin cơ bản
2. **Xem chi tiết Banner**: Xem các thông tin chi tiết của một banner
3. **Thêm mới Banner**: Thêm một banner mới với thông tin cơ bản
4. **Chỉnh sửa Banner**: Cập nhật thông tin của banner hiện có
5. **Xóa Banner**: Xóa banner khỏi hệ thống
6. **Thay đổi thứ tự hiển thị**: Điều chỉnh thứ tự hiển thị của các banner (di chuyển lên/xuống)
7. **Bật/tắt trạng thái hiển thị**: Bật/tắt trạng thái active của banner

## 3. Mối quan hệ với các Models khác
- **Campaigns**: Có mối quan hệ với `campaignId`, để liên kết banner với một chiến dịch cụ thể
- **Order hiển thị**: Cần logic quản lý thứ tự hiển thị các banner (trường `order`)
- **Thời gian hiển thị**: Có quản lý thời gian hiệu lực thông qua `startDate` và `endDate`

## 4. Yêu cầu chức năng cho Backend:
1. CRUD cơ bản cho Banner
2. Quản lý trạng thái hiển thị (active/inactive)
3. Quản lý thứ tự hiển thị (order)
4. Lọc banner theo trạng thái, theo campaign
5. Lấy banner đang active trong khoảng thời gian hiện tại
6. Thống kê banner (tổng số, đang active, đã hết hạn, sắp hết hạn) 