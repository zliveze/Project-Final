# Kế hoạch tách nhỏ trang Profile

## Mục tiêu
- Tách các phần còn lại trong file index.tsx thành các component nhỏ hơn, dễ quản lý
- Cải thiện cấu trúc code, giảm kích thước component chính
- Tạo khả năng tái sử dụng cao cho các component
- Dễ dàng bảo trì và mở rộng trong tương lai

## Phân tích hiện trạng
Hiện tại, file `src/pages/profile/index.tsx` chứa quá nhiều code và logic:
- Khai báo dữ liệu giả lập (mock data)
- Quản lý nhiều state khác nhau
- Xử lý nhiều hàm handler cho các chức năng khác nhau
- Có component con `OrderDetailModal` được định nghĩa trong cùng file
- UI phức tạp với nhiều tab và điều kiện hiển thị

Các component con đã được tách ra:
- `ProfileInfo.tsx`: Hiển thị và cập nhật thông tin người dùng
- `AddressList.tsx`: Quản lý danh sách địa chỉ
- `WishlistItems.tsx`: Hiển thị danh sách sản phẩm yêu thích
- `OrderHistory.tsx`: Hiển thị lịch sử đơn hàng
- `Notifications.tsx`: Quản lý thông báo
- `MyReviews.tsx`: Hiển thị và quản lý đánh giá sản phẩm
- `OrderDetail.tsx`: Component hiển thị chi tiết đơn hàng (đã có nhưng chưa được sử dụng)

## Kế hoạch tách component

### 1. Tách Data và Types
Tạo các file riêng để quản lý dữ liệu và types:

#### File: `src/components/profile/types/index.ts`
- Định nghĩa tất cả các types dùng trong Profile
- Loại bỏ việc định nghĩa types inline

#### File: `src/mock/profileData.ts`
- Chuyển tất cả dữ liệu giả lập ra file riêng
- Dễ dàng thay đổi dữ liệu test mà không ảnh hưởng đến logic

### 2. Tách Component OrderDetailModal

#### File: `src/components/profile/OrderDetailModal.tsx`
- Chuyển OrderDetailModal từ file index.tsx sang file riêng
- Tách các utility functions (formatDate, formatCurrency, getStatusColor, getStatusText)
- Tạo các prop types rõ ràng

### 3. Tách Component ProfileSidebar

#### File: `src/components/profile/ProfileSidebar.tsx`
- Tách phần sidebar hiển thị avatar và menu tab
- Props: user, activeTab, onTabChange, notificationCount
- Sử dụng lại trong các trang profile khác nếu cần

### 4. Tách Component ProfileHeader

#### File: `src/components/profile/ProfileHeader.tsx`
- Tách phần header của trang Profile
- Props: title, onBack, onLogout
- Có thể tái sử dụng ở các trang khác

### 5. Tách Component AddressManager

#### File: `src/components/profile/AddressManager.tsx`
- Tách phần quản lý địa chỉ từ tab account
- Sử dụng AddressList đã có và bổ sung các chức năng
- Props: addresses, user, onAddAddress, onUpdateAddress, onDeleteAddress, onSetDefaultAddress

### 6. Tách Component OrderFilters

#### File: `src/components/profile/OrderFilters.tsx`
- Tách phần filter và search đơn hàng
- Props: orderStatusFilter, searchOrderQuery, onFilterChange, onSearchChange, onSearchSubmit
- Dễ dàng tái sử dụng cho các trang khác có filter tương tự

### 7. Tách Component OrdersTab

#### File: `src/components/profile/OrdersTab.tsx`
- Tách toàn bộ nội dung tab đơn hàng
- Sử dụng OrderFilters và OrderHistory
- Quản lý trạng thái filter và search trong component này

### 8. Tách Context API cho Profile

#### File: `src/context/ProfileContext.tsx`
- Tạo context để quản lý state chung của Profile
- Giảm việc truyền props nhiều tầng
- Dễ dàng access state và các hàm từ bất kỳ component con nào

### 9. Tách Custom Hooks

#### File: `src/hooks/useProfileData.ts`
- Tách logic xử lý data
- Xử lý các side effects (useEffect)
- Tách các hàm xử lý sự kiện

#### File: `src/hooks/useOrderManagement.ts`
- Tách logic quản lý đơn hàng
- Bao gồm các hàm filter, search, view detail, download invoice...

#### File: `src/hooks/useNotifications.ts`
- Tách logic quản lý thông báo
- Hàm đánh dấu đã đọc, xóa thông báo...

### 10. Cập nhật lại file index.tsx

- Import và sử dụng các component đã tách
- Sử dụng Context Provider để cung cấp state
- File chính chỉ còn vai trò điều phối, sắp xếp layout

## Chi tiết các Component cần tạo mới

### 1. OrderDetailModal.tsx
```tsx
// imports...

interface OrderDetailModalProps {
  order: Order;
  onClose: () => void;
  onBuyAgain: (orderId: string) => void;
  onDownloadInvoice: (orderId: string) => void;
  onCancelOrder?: (orderId: string) => void;
  onReturnOrder?: (orderId: string) => void;
}

// Chuyển các utility functions thành custom hooks hoặc helpers riêng
// Cấu trúc lại HTML/JSX để dễ đọc và maintain
```

### 2. ProfileSidebar.tsx
```tsx
// imports...

interface ProfileSidebarProps {
  user: User;
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  notificationCount: number;
}

// Component sidebar với avatar, thông tin ngắn gọn và menu tab
```

### 3. ProfileHeader.tsx
```tsx
// imports...

interface ProfileHeaderProps {
  title: string;
  onBack: () => void;
  onLogout: () => void;
}

// Component header với nút back và logout
```

### 4. OrderFilters.tsx
```tsx
// imports...

interface OrderFiltersProps {
  orderStatusFilter: OrderStatusType;
  searchOrderQuery: string;
  onFilterChange: (status: OrderStatusType) => void;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  onClearFilters: () => void;
}

// Component filter và search đơn hàng
```

## Lộ trình thực hiện

### Giai đoạn 1: Chuẩn bị
1. Tách types và mock data
2. Tạo ProfileContext và các custom hooks

### Giai đoạn 2: Tách các component chính
1. Tách OrderDetailModal
2. Tách ProfileSidebar và ProfileHeader
3. Tạo OrderFilters và OrdersTab

### Giai đoạn 3: Tích hợp và tối ưu
1. Cập nhật lại index.tsx để sử dụng các component mới
2. Kiểm tra và đảm bảo tính nhất quán giữa các component
3. Tối ưu performance và UX

### Giai đoạn 4: Kiểm thử và hoàn thiện
1. Kiểm tra các tính năng đã hoạt động đúng sau khi tái cấu trúc
2. Cải thiện accessibility và responsive design
3. Cập nhật documentation và comments

## Kết quả mong đợi
- Code dễ đọc, dễ bảo trì hơn
- Các component có trách nhiệm rõ ràng, độc lập
- Giảm complexity của component chính
- Dễ dàng mở rộng tính năng mới trong tương lai
- Tăng khả năng tái sử dụng component 