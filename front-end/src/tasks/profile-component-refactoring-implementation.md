# Kế hoạch triển khai tách nhỏ Profile thành các Components

## Chi tiết triển khai

### Giai đoạn 1: Tách Types & Mock Data

#### 1.1. Tạo file Types
- **File**: `src/components/profile/types/index.ts`
- **Nội dung**: 
  - Định nghĩa tất cả types liên quan đến Profile
  - Đảm bảo export các types này để sử dụng trong các components
- **Deadline**: Ngày 1

#### 1.2. Tạo file Mock Data
- **File**: `src/mock/profileData.ts`
- **Nội dung**:
  - Chuyển dữ liệu mockUser, mockWishlistItems, mockOrders, mockNotifications từ index.tsx
  - Export dưới dạng constants để các file khác import
- **Deadline**: Ngày 1

### Giai đoạn 2: Tách Components Nhỏ

#### 2.1. OrderDetailModal
- **File**: `src/components/profile/OrderDetailModal.tsx`
- **Chức năng**: Hiển thị thông tin chi tiết đơn hàng
- **Phương pháp**:
  - Di chuyển component hiện có từ index.tsx
  - Tách các utility functions (formatDate, formatCurrency...)
  - Định nghĩa interface rõ ràng cho props
- **Deadline**: Ngày 2

#### 2.2. ProfileHeader  
- **File**: `src/components/profile/ProfileHeader.tsx`
- **Chức năng**: Hiển thị header với nút quay lại và đăng xuất
- **Phương pháp**:
  - Tách phần header từ index.tsx
  - Định nghĩa interface cho props
- **Deadline**: Ngày 2

#### 2.3. ProfileSidebar
- **File**: `src/components/profile/ProfileSidebar.tsx`
- **Chức năng**: Hiển thị avatar và menu tabs
- **Phương pháp**:
  - Tách phần sidebar từ index.tsx  
  - Xử lý hiển thị avatar, tên, thông tin
  - Hiển thị danh sách tab và badge cho notifications
- **Deadline**: Ngày 2

#### 2.4. AddressManager
- **File**: `src/components/profile/AddressManager.tsx`
- **Chức năng**: Quản lý địa chỉ người dùng
- **Phương pháp**:
  - Tách phần quản lý địa chỉ từ tab account
  - Sử dụng AddressList.tsx hiện có
- **Deadline**: Ngày 3

#### 2.5. OrderFilters
- **File**: `src/components/profile/OrderFilters.tsx`
- **Chức năng**: Filter và search đơn hàng
- **Phương pháp**:
  - Tách phần filter và search từ tab orders
  - Tách các hàm xử lý filter và search
- **Deadline**: Ngày 3

#### 2.6. OrdersTab
- **File**: `src/components/profile/OrdersTab.tsx`
- **Chức năng**: Container cho tab đơn hàng
- **Phương pháp**:
  - Tách toàn bộ nội dung tab đơn hàng
  - Sử dụng OrderFilters và OrderHistory
- **Deadline**: Ngày 3

### Giai đoạn 3: Tạo Custom Hooks và Context

#### 3.1. Profile Context
- **File**: `src/context/ProfileContext.tsx`
- **Chức năng**: Quản lý state chung cho Profile
- **Nội dung**:
  - Tạo context với state chung (user, wishlist, orders...)
  - Cung cấp các hàm thao tác với state
- **Deadline**: Ngày 4

#### 3.2. useProfileData
- **File**: `src/hooks/useProfileData.ts`
- **Chức năng**: Hook quản lý dữ liệu profile
- **Nội dung**:
  - Tách logic xử lý data
  - Xử lý các side effects
- **Deadline**: Ngày 4

#### 3.3. useOrderManagement
- **File**: `src/hooks/useOrderManagement.ts`
- **Chức năng**: Hook quản lý đơn hàng
- **Nội dung**:
  - Tách logic filter, search đơn hàng
  - Tách các hàm xử lý đơn hàng
- **Deadline**: Ngày 4

#### 3.4. useNotifications
- **File**: `src/hooks/useNotifications.ts`
- **Chức năng**: Hook quản lý thông báo
- **Nội dung**:
  - Tách logic quản lý thông báo
  - Tách các hàm xử lý thông báo
- **Deadline**: Ngày 5

### Giai đoạn 4: Cập nhật index.tsx

#### 4.1. Refactor index.tsx
- **Chức năng**: Sử dụng các component mới
- **Phương pháp**:
  - Import các component đã tách
  - Sử dụng ProfileContext
  - Giảm code trong file xuống mức tối thiểu
- **Deadline**: Ngày 5

### Giai đoạn 5: Kiểm thử và hoàn thiện

#### 5.1. Kiểm thử chức năng
- **Nội dung**:
  - Kiểm tra tất cả tính năng vẫn hoạt động tốt
  - Đảm bảo dữ liệu và event flow đúng
- **Deadline**: Ngày 6

#### 5.2. Tối ưu trải nghiệm
- **Nội dung**:
  - Cải thiện giao diện và trải nghiệm người dùng
  - Kiểm tra responsive
- **Deadline**: Ngày 6

#### 5.3. Cập nhật documentation
- **Nội dung**:
  - Cập nhật comment trong code
  - Tạo README mô tả cấu trúc và cách sử dụng các component
- **Deadline**: Ngày 7

## Thứ tự ưu tiên triển khai

1. Types và Mock Data
2. OrderDetailModal, ProfileHeader, ProfileSidebar
3. OrderFilters, OrdersTab
4. AddressManager
5. Context và Custom Hooks
6. Refactor index.tsx
7. Kiểm thử và tối ưu

## Mẫu code cho các file chính

### ProfileContext.tsx

```tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, WishlistItem, Order, Notification, Review, TabType, OrderStatusType } from '../components/profile/types';
import { mockUser, mockWishlistItems, mockOrders, mockNotifications } from '../mock/profileData';

interface ProfileContextProps {
  user: User;
  setUser: React.Dispatch<React.SetStateAction<User>>;
  wishlistItems: WishlistItem[];
  setWishlistItems: React.Dispatch<React.SetStateAction<WishlistItem[]>>;
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  notifications: Notification[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  reviews: Review[];
  setReviews: React.Dispatch<React.SetStateAction<Review[]>>;
  activeTab: TabType;
  setActiveTab: React.Dispatch<React.SetStateAction<TabType>>;
  orderStatusFilter: OrderStatusType;
  setOrderStatusFilter: React.Dispatch<React.SetStateAction<OrderStatusType>>;
  searchOrderQuery: string;
  setSearchOrderQuery: React.Dispatch<React.SetStateAction<string>>;
  
  // Các hàm helper và handlers
  handleUpdateProfile: (updatedData: Partial<User>) => void;
  handleAddAddress: (address: Omit<User['addresses'][0], 'addressId'>) => void;
  // Thêm các hàm handler khác...
}

const ProfileContext = createContext<ProfileContextProps | undefined>(undefined);

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Đặt tất cả state ở đây
  const [user, setUser] = useState(mockUser);
  const [wishlistItems, setWishlistItems] = useState(mockWishlistItems);
  // Thêm các state khác và handler...
  
  return (
    <ProfileContext.Provider value={{
      user,
      setUser,
      wishlistItems,
      setWishlistItems,
      // Thêm các state và hàm khác...
    }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfileContext = () => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfileContext must be used within a ProfileProvider');
  }
  return context;
};
```

### Hướng dẫn sử dụng Context trong index.tsx

```tsx
import { ProfileProvider } from '../context/ProfileContext';

const ProfilePage: NextPage = () => {
  return (
    <ProfileProvider>
      <DefaultLayout>
        <Head>
          <title>Trang cá nhân | YUMIN</title>
          <meta name="description" content="Quản lý thông tin cá nhân, địa chỉ và đơn hàng" />
        </Head>
        
        <div className="bg-[#fdf2f8] min-h-screen py-8">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <ProfileHeader title="Trang cá nhân" />
            
            <div className="flex flex-col md:flex-row gap-6">
              <ProfileSidebar />
              
              <ProfileContent />
            </div>
          </div>
        </div>
        
        <ToastContainer />
      </DefaultLayout>
    </ProfileProvider>
  );
};
```

## Kết quả cuối cùng

Khi hoàn thành, cấu trúc thư mục sẽ như sau:

```
src/
├── components/
│   └── profile/
│       ├── types/
│       │   └── index.ts
│       ├── ProfileInfo.tsx
│       ├── AddressList.tsx
│       ├── WishlistItems.tsx
│       ├── OrderHistory.tsx
│       ├── Notifications.tsx
│       ├── MyReviews.tsx
│       ├── OrderDetail.tsx
│       ├── OrderDetailModal.tsx (mới)
│       ├── ProfileHeader.tsx (mới)
│       ├── ProfileSidebar.tsx (mới)
│       ├── AddressManager.tsx (mới)
│       ├── OrderFilters.tsx (mới)
│       └── OrdersTab.tsx (mới)
├── context/
│   └── ProfileContext.tsx (mới)
├── hooks/
│   ├── useProfileData.ts (mới)
│   ├── useOrderManagement.ts (mới)
│   └── useNotifications.ts (mới)
├── mock/
│   └── profileData.ts (mới)
└── pages/
    └── profile/
        └── index.tsx (đã refactor)
```

Mỗi component sẽ có trách nhiệm rõ ràng, dễ hiểu, và dễ bảo trì, giúp trang Profile được tổ chức tốt hơn và dễ mở rộng trong tương lai. 