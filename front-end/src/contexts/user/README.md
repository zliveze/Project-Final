# Tích hợp API Backend cho Profile

## Giới thiệu
Tài liệu này mô tả việc tích hợp API backend vào Profile Context để quản lý thông tin người dùng và các tính năng liên quan.

## Cấu trúc thư mục

```
front-end/src/contexts/user/
├── ProfileContext.tsx    - Context chính để quản lý profile người dùng
├── UserApiService.ts     - Service gọi API backend để lấy/cập nhật dữ liệu
└── README.md             - Tài liệu hướng dẫn
```

## Tổng quan về các thành phần

### 1. UserApiService

`UserApiService` là một service chịu trách nhiệm gọi các API endpoint liên quan đến người dùng. Service này cung cấp một bộ các phương thức đầy đủ để tương tác với backend:

- Quản lý thông tin profile: `getProfile`, `updateProfile`
- Quản lý địa chỉ: `addAddress`, `updateAddress`, `deleteAddress`, `setDefaultAddress`
- Quản lý wishlist: `getWishlist`, `addToWishlist`, `removeFromWishlist`
- Quản lý đơn hàng: `getOrders`, `getOrderDetail`, `cancelOrder`, `requestReturnOrder`, `downloadInvoice`, `buyAgain`
- Quản lý thông báo: `getNotifications`, `markNotificationAsRead`, `markAllNotificationsAsRead`, `deleteNotification`
- Quản lý đánh giá: `getReviews`, `updateReview`, `deleteReview`

### 2. ProfileContext

`ProfileContext` là một React Context cung cấp trạng thái và hành vi liên quan đến profile người dùng cho toàn bộ ứng dụng. Context này sử dụng `UserApiService` để tương tác với backend và quản lý:

- Dữ liệu người dùng: thông tin cá nhân, địa chỉ, wishlist, đơn hàng, thông báo, đánh giá
- Trạng thái xử lý: loading, error
- Tab hiện tại và bộ lọc
- Các handler xử lý tác vụ người dùng

## Cách sử dụng

### 1. Bọc ứng dụng bằng ProfileProvider

```tsx
// Trong page hoặc layout
import { ProfileProvider } from '../contexts/user/ProfileContext';

const MyPage = () => {
  return (
    <ProfileProvider>
      <YourComponent />
    </ProfileProvider>
  );
};
```

### 2. Sử dụng hook useProfile để truy cập context

```tsx
import { useProfile } from '../contexts/user/ProfileContext';

const UserProfile = () => {
  const { 
    user, 
    isLoading, 
    error,
    handleUpdateProfile 
  } = useProfile();

  const onSubmit = async (data) => {
    await handleUpdateProfile(data);
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div>
      <h1>Xin chào, {user.name}</h1>
      <ProfileForm onSubmit={onSubmit} />
    </div>
  );
};
```

## Các tính năng chính

### Quản lý tài khoản
- Hiển thị và cập nhật thông tin cá nhân
- Quản lý địa chỉ: thêm, sửa, xóa, đặt mặc định

### Danh sách yêu thích
- Hiển thị sản phẩm trong wishlist
- Thêm/xóa sản phẩm từ wishlist
- Thêm sản phẩm từ wishlist vào giỏ hàng

### Quản lý đơn hàng
- Xem danh sách đơn hàng
- Lọc đơn hàng theo trạng thái 
- Xem chi tiết đơn hàng
- Hủy đơn hàng
- Yêu cầu trả hàng
- Tải hóa đơn
- Mua lại sản phẩm từ đơn hàng

### Quản lý thông báo
- Hiển thị danh sách thông báo
- Đánh dấu đã đọc
- Xóa thông báo

### Quản lý đánh giá
- Hiển thị danh sách đánh giá
- Chỉnh sửa đánh giá
- Xóa đánh giá

## Xử lý lỗi và loading

Context có built-in xử lý lỗi và trạng thái loading:

```tsx
const { isLoading, error } = useProfile();

if (isLoading) return <LoadingIndicator />;
if (error) return <ErrorMessage message={error} />;
```

## Tích hợp với AuthContext

ProfileContext được tích hợp với AuthContext để:
- Kiểm tra trạng thái đăng nhập
- Chuyển hướng người dùng chưa đăng nhập đến trang đăng nhập
- Sử dụng chức năng đăng xuất 