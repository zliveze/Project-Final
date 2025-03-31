import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import { User, WishlistItem, Order, Notification, Review, Address, TabType, OrderStatusType } from '../components/profile/types';
import { mockUser, mockWishlistItems, mockOrders, mockNotifications, mockReviews } from '../mock/profileData';

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
  selectedOrder: Order | null;
  setSelectedOrder: React.Dispatch<React.SetStateAction<Order | null>>;
  showOrderModal: boolean;
  setShowOrderModal: React.Dispatch<React.SetStateAction<boolean>>;
  orderStatusFilter: OrderStatusType;
  setOrderStatusFilter: React.Dispatch<React.SetStateAction<OrderStatusType>>;
  searchOrderQuery: string;
  setSearchOrderQuery: React.Dispatch<React.SetStateAction<string>>;
  
  // Các hàm xử lý
  handleUpdateProfile: (updatedData: Partial<User>) => void;
  handleAddAddress: (address: Omit<Address, 'addressId'>) => void;
  handleUpdateAddress: (updatedAddress: Address) => void;
  handleDeleteAddress: (addressId: string) => void;
  handleSetDefaultAddress: (addressId: string) => void;
  handleRemoveFromWishlist: (productId: string, variantId?: string | null) => void;
  handleAddToCart: (productId: string, variantId?: string | null) => void;
  handleViewOrderDetails: (orderId: string) => void;
  handleDownloadInvoice: (orderId: string) => void;
  handleCancelOrder: (orderId: string) => void;
  handleReturnOrder: (orderId: string) => void;
  handleBuyAgain: (orderId: string) => void;
  handleLogout: () => void;
  handleMarkAsRead: (notificationId: string) => void;
  handleMarkAllAsRead: () => void;
  handleDeleteNotification: (notificationId: string) => void;
  handleEditReview: (reviewId: string, updatedData: Partial<Review>) => void;
  handleDeleteReview: (reviewId: string) => void;
  handleOrderStatusFilterChange: (status: OrderStatusType) => void;
  handleSearchOrderChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSearchOrderSubmit: (e: React.FormEvent) => void;
  handleTabChange: (tab: TabType) => void;
}

const ProfileContext = createContext<ProfileContextProps | undefined>(undefined);

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  
  // States
  const [user, setUser] = useState<User>(mockUser);
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>(mockWishlistItems);
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [reviews, setReviews] = useState<Review[]>(mockReviews || []);
  const [activeTab, setActiveTab] = useState<TabType>('account');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderStatusFilter, setOrderStatusFilter] = useState<OrderStatusType>('all');
  const [searchOrderQuery, setSearchOrderQuery] = useState('');
  
  // Phát hiện tab từ URL query params khi component mount hoặc URL thay đổi
  useEffect(() => {
    const { tab } = router.query;
    if (tab && typeof tab === 'string') {
      if (['account', 'wishlist', 'orders', 'notifications', 'reviews'].includes(tab)) {
        setActiveTab(tab as TabType);
      }
    }
  }, [router.query]);
  
  // Update URL khi tab thay đổi
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    router.push({
      pathname: router.pathname,
      query: { ...router.query, tab }
    }, undefined, { shallow: true });
  };
  
  // Handler functions
  const handleUpdateProfile = (updatedData: Partial<User>) => {
    setUser(prevUser => ({ ...prevUser, ...updatedData }));
    toast.success('Cập nhật thông tin thành công!');
  };
  
  const handleAddAddress = (address: Omit<Address, 'addressId'>) => {
    const newAddress = {
      ...address,
      addressId: `new-${Date.now()}`,
      isDefault: user.addresses.length === 0 // Nếu là địa chỉ đầu tiên thì set mặc định
    };
    
    setUser(prevUser => ({
      ...prevUser,
      addresses: [...prevUser.addresses, newAddress]
    }));
    
    toast.success('Thêm địa chỉ mới thành công!');
    
    // Ẩn form thêm địa chỉ nếu cần
    // setShowAddressForm(false);
  };
  
  const handleUpdateAddress = (updatedAddress: Address) => {
    setUser(prevUser => ({
      ...prevUser,
      addresses: prevUser.addresses.map(address => 
        address.addressId === updatedAddress.addressId ? updatedAddress : address
      )
    }));
    
    toast.success('Cập nhật địa chỉ thành công!');
  };
  
  const handleDeleteAddress = (addressId: string) => {
    setUser(prevUser => ({
      ...prevUser,
      addresses: prevUser.addresses.filter(address => address.addressId !== addressId)
    }));
    
    toast.success('Xóa địa chỉ thành công!');
  };
  
  const handleSetDefaultAddress = (addressId: string) => {
    setUser(prevUser => ({
      ...prevUser,
      addresses: prevUser.addresses.map(address => ({
        ...address,
        isDefault: address.addressId === addressId
      }))
    }));
    
    toast.success('Đã đặt làm địa chỉ mặc định!');
  };
  
  const handleRemoveFromWishlist = (productId: string, variantId?: string | null) => {
    setWishlistItems(prevItems => 
      prevItems.filter(item => 
        !(item._id === productId && item.variantId === variantId)
      )
    );
    
    toast.success('Đã xóa sản phẩm khỏi danh sách yêu thích!');
  };
  
  const handleAddToCart = (productId: string, variantId?: string | null) => {
    // Giả lập thêm sản phẩm vào giỏ hàng
    toast.success('Đã thêm sản phẩm vào giỏ hàng!');
  };
  
  const handleViewOrderDetails = (orderId: string) => {
    const order = orders.find(order => order._id === orderId);
    if (order) {
      setSelectedOrder(order);
      setShowOrderModal(true);
    }
  };
  
  const handleDownloadInvoice = (orderId: string) => {
    // Giả lập tải hóa đơn
    toast.info('Đang tải xuống hóa đơn...');
    setTimeout(() => {
      toast.success('Tải xuống hóa đơn thành công!');
    }, 1500);
  };
  
  const handleCancelOrder = (orderId: string) => {
    // Giả lập hủy đơn hàng
    if (window.confirm('Bạn có chắc muốn hủy đơn hàng này?')) {
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order._id === orderId ? { ...order, status: 'cancelled' } : order
        )
      );
      
      toast.success('Hủy đơn hàng thành công!');
      
      // Đóng modal chi tiết đơn hàng
      setShowOrderModal(false);
    }
  };
  
  const handleReturnOrder = (orderId: string) => {
    // Giả lập yêu cầu trả hàng
    toast.info('Đã gửi yêu cầu trả hàng. Chúng tôi sẽ liên hệ với bạn sớm!');
    setShowOrderModal(false);
  };
  
  const handleBuyAgain = (orderId: string) => {
    // Giả lập mua lại sản phẩm
    toast.success('Đã thêm các sản phẩm vào giỏ hàng!');
    
    // Đóng modal chi tiết đơn hàng
    setShowOrderModal(false);
    
    // Chuyển hướng đến trang giỏ hàng
    // router.push('/cart');
  };
  
  const handleLogout = () => {
    if (window.confirm('Bạn có chắc muốn đăng xuất?')) {
      // Giả lập đăng xuất
      router.push('/login');
      toast.success('Đăng xuất thành công!');
    }
  };
  
  const handleMarkAsRead = (notificationId: string) => {
    setNotifications(prevNotifications => 
      prevNotifications.map(notification => 
        notification._id === notificationId
          ? { ...notification, isRead: true }
          : notification
      )
    );
  };
  
  const handleMarkAllAsRead = () => {
    setNotifications(prevNotifications => 
      prevNotifications.map(notification => ({ ...notification, isRead: true }))
    );
    
    toast.success('Đã đánh dấu tất cả thông báo là đã đọc');
  };
  
  const handleDeleteNotification = (notificationId: string) => {
    setNotifications(prevNotifications => 
      prevNotifications.filter(notification => notification._id !== notificationId)
    );
    
    toast.success('Đã xóa thông báo');
  };
  
  const handleEditReview = (reviewId: string, updatedData: Partial<Review>) => {
    setReviews(prevReviews => 
      prevReviews.map(review => 
        review._id === reviewId
          ? { 
              ...review, 
              ...updatedData,
              updatedAt: new Date().toISOString() 
            }
          : review
      )
    );
    
    toast.success('Cập nhật đánh giá thành công!');
  };
  
  const handleDeleteReview = (reviewId: string) => {
    setReviews(prevReviews => 
      prevReviews.filter(review => review._id !== reviewId)
    );
    
    toast.success('Xóa đánh giá thành công!');
  };
  
  const handleOrderStatusFilterChange = (status: OrderStatusType) => {
    setOrderStatusFilter(status);
  };
  
  const handleSearchOrderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchOrderQuery(e.target.value);
  };
  
  const handleSearchOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Search logic is handled by useEffect in OrdersTab component
  };
  
  return (
    <ProfileContext.Provider
      value={{
        user,
        setUser,
        wishlistItems,
        setWishlistItems,
        orders,
        setOrders,
        notifications,
        setNotifications,
        reviews,
        setReviews,
        activeTab,
        setActiveTab,
        selectedOrder,
        setSelectedOrder,
        showOrderModal,
        setShowOrderModal,
        orderStatusFilter,
        setOrderStatusFilter,
        searchOrderQuery,
        setSearchOrderQuery,
        handleUpdateProfile,
        handleAddAddress,
        handleUpdateAddress,
        handleDeleteAddress,
        handleSetDefaultAddress,
        handleRemoveFromWishlist,
        handleAddToCart,
        handleViewOrderDetails,
        handleDownloadInvoice,
        handleCancelOrder,
        handleReturnOrder,
        handleBuyAgain,
        handleLogout,
        handleMarkAsRead,
        handleMarkAllAsRead,
        handleDeleteNotification,
        handleEditReview,
        handleDeleteReview,
        handleOrderStatusFilterChange,
        handleSearchOrderChange,
        handleSearchOrderSubmit,
        handleTabChange
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
};

// Hook để sử dụng ProfileContext
export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}; 