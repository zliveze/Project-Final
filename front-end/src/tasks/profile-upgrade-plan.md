# KẾ HOẠCH NÂNG CẤP TRANG PROFILE

## Phân tích hiện trạng

### Cấu trúc Models

**1. Model Users:**
```
{
  "_id": "ObjectId",
  "name": "string", 
  "email": "string", 
  "phone": "string", 
  "password": "string", 
  "googleId": "string", 
  "addresses": [
    {
      "addressId": "ObjectId",
      "addressLine": "string",
      "city": "string", 
      "state": "string", 
      "country": "string", 
      "postalCode": "string", 
      "isDefault": "boolean" 
    }
  ],
  "role": "string", // ["user", "admin"]
  "wishlist": ["ObjectId","variantId": "ObjectId"], // Danh sách sản phẩm yêu thích
  "createdAt": "date",
  "updatedAt": "date"
}
```

**2. Model Orders:**
```
{
  "_id": "ObjectId",
  "userId": "ObjectId",
  "products": [
    {
      "productId": "ObjectId",
      "variantId": "ObjectId",
      "options": {
        "shade": "string",
        "size": "string"
      },
      "quantity": "number",
      "price": "number"
    }
  ],
  "totalPrice": "number",
  "voucher": {
    "voucherId": "ObjectId",
    "discountAmount": "number"
  },
  "finalPrice": "number",
  "status": "string", // ["pending", "shipped", "completed", "cancelled"]
  "shippingInfo": {
    "address": "string",
    "contact": "string"
  },
  "branchId": "ObjectId",
  "createdAt": "date",
  "updatedAt": "date"
}
```

### Cấu trúc Components hiện tại:

1. **ProfileInfo.tsx**: Hiển thị và chỉnh sửa thông tin cá nhân
2. **AddressList.tsx**: Quản lý địa chỉ người dùng (thêm, sửa, xóa, đặt mặc định)
3. **WishlistItems.tsx**: Hiển thị sản phẩm yêu thích 
4. **OrderHistory.tsx**: Hiển thị lịch sử đơn hàng
5. **OrderDetail.tsx**: Hiển thị chi tiết đơn hàng

## Kế hoạch nâng cấp

### Danh sách nhiệm vụ

[] **Nhiệm vụ 1: Cập nhật lại cấu trúc dữ liệu mẫu phù hợp với Models**
   - Cập nhật mockUser để phù hợp với cấu trúc User model
   - Cập nhật mockWishlistItems để phù hợp với cấu trúc Product model
   - Cập nhật mockOrders để phù hợp với cấu trúc Order model

[x] **Nhiệm vụ 2: Bổ sung chức năng quản lý thông báo**
   - Tạo component Notifications.tsx
   - Hiển thị danh sách thông báo
   - Đánh dấu đã đọc/chưa đọc
   - Lọc thông báo theo loại

[] **Nhiệm vụ 3: Cải thiện component ProfileInfo**
   - Bổ sung thêm các trường thông tin cần thiết (avatar, ngày sinh, giới tính)
   - Cải thiện giao diện để hiển thị tổng quan về hoạt động của người dùng
   - Thêm chức năng đổi mật khẩu

[] **Nhiệm vụ 4: Cải thiện component AddressList**
   - Cập nhật interface Address phù hợp với model
   - Sửa lại form thêm/sửa địa chỉ
   - Cải thiện UI hiển thị danh sách địa chỉ

[] **Nhiệm vụ 5: Cải thiện component WishlistItems**
   - Hiển thị thêm thông tin sản phẩm phù hợp với Product model
   - Thêm phân trang khi danh sách dài
   - Thêm chức năng lọc và sắp xếp

[x] **Nhiệm vụ 6: Cải thiện component OrderHistory**
   - Cập nhật interface Order phù hợp với model
   - Thêm chức năng lọc đơn hàng theo trạng thái, thời gian
   - Cải thiện UI để hiển thị trạng thái đơn hàng tốt hơn
   - Thêm phân trang cho danh sách đơn hàng

[x] **Nhiệm vụ 7: Cải thiện component OrderDetail**
   - Hiển thị đầy đủ thông tin từ Order model
   - Bổ sung timeline theo dõi trạng thái đơn hàng
   - Thêm chức năng đánh giá sản phẩm sau khi nhận hàng

[x] **Nhiệm vụ 8: Thêm tab Đánh giá của tôi**
   - Tạo component MyReviews.tsx
   - Hiển thị các đánh giá mà người dùng đã viết
   - Cho phép chỉnh sửa/xóa đánh giá

[] **Nhiệm vụ 9: Tích hợp Redux hoặc Context API**
   - Tổ chức lại state management với Redux hoặc Context
   - Tạo các actions/reducers hoặc contexts cho user data
   - Áp dụng các hooks cho các chức năng tái sử dụng

[] **Nhiệm vụ 10: Tối ưu giao diện Responsive**
   - Đảm bảo trang Profile có giao diện đẹp trên mobile
   - Tối ưu UX cho màn hình nhỏ
   - Tối ưu hiệu năng cho mobile

## Chi tiết kỹ thuật

### 1. Cập nhật lại dữ liệu mẫu:
- Dữ liệu mockUser cần bổ sung thêm trường avatar, birthday, gender
- Dữ liệu mockWishlistItems cần cập nhật phù hợp với cấu trúc sản phẩm mới
- Dữ liệu mockOrders cần cập nhật phù hợp với trạng thái đơn hàng

### 2. Component Notifications:
- Sử dụng modal hoặc dropdown để hiển thị thông báo
- Phân loại thông báo theo: đơn hàng, khuyến mãi, hệ thống
- Đánh dấu đã đọc/chưa đọc với API call giả lập

### 3. Cải thiện ProfileInfo:
- Thêm upload avatar (giả lập)
- Thêm form đổi mật khẩu
- Hiển thị tổng quan: số đơn hàng, tổng chi tiêu, điểm thưởng (nếu có)

### 4. Cải thiện OrderHistory:
- Thêm bộ lọc đơn hàng (theo trạng thái, thời gian)
- Thêm phân trang (pagination)
- Cải thiện hiển thị timeline trạng thái đơn hàng

### 5. Thêm tab Đánh giá của tôi:
- Hiển thị các đánh giá đã viết
- Cho phép chỉnh sửa/xóa đánh giá
- Liên kết đến sản phẩm đã đánh giá

## Triển khai

Thứ tự triển khai:
1. Cập nhật dữ liệu mẫu
2. Cải thiện các component hiện có
3. Tạo các component mới
4. Tích hợp và tối ưu 