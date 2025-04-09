import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import { User, WishlistItem, Order, Notification, Review, Address, TabType, OrderStatusType } from '../../components/profile/types';
import { mockUser, mockWishlistItems, mockOrders, mockNotifications, mockReviews } from '../../mock/profileData';
import { UserApiService } from './UserApiService';
import { useAuth } from '../AuthContext';

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
  isLoading: boolean;
  error: string | null;

  // Các hàm xử lý
  handleUpdateProfile: (updatedData: Partial<User>) => Promise<void>;
  handleAddAddress: (address: Omit<Address, '_id'>) => Promise<void>; // Use Omit<Address, '_id'>
  handleUpdateAddress: (updatedAddress: Address) => Promise<void>;
  handleDeleteAddress: (_id: string) => Promise<void>; // Use _id
  handleSetDefaultAddress: (_id: string) => Promise<void>; // Use _id
  handleRemoveFromWishlist: (productId: string, variantId?: string | null) => Promise<void>;
  handleAddToCart: (productId: string, variantId?: string | null) => void;
  handleViewOrderDetails: (orderId: string) => Promise<void>;
  handleDownloadInvoice: (orderId: string) => Promise<void>;
  handleCancelOrder: (orderId: string) => Promise<void>;
  handleReturnOrder: (orderId: string) => Promise<void>;
  handleBuyAgain: (orderId: string) => Promise<void>;
  handleLogout: () => Promise<void>;
  handleMarkAsRead: (notificationId: string) => Promise<void>;
  handleMarkAllAsRead: () => Promise<void>;
  handleDeleteNotification: (notificationId: string) => Promise<void>;
  handleEditReview: (reviewId: string, updatedData: Partial<Review>) => Promise<void>;
  handleDeleteReview: (reviewId: string) => Promise<void>;
  handleOrderStatusFilterChange: (status: OrderStatusType) => void;
  handleSearchOrderChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSearchOrderSubmit: (e: React.FormEvent) => void;
  handleTabChange: (tab: TabType) => void;
}

const ProfileContext = createContext<ProfileContextProps | undefined>(undefined);

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const { logout, isAuthenticated, isLoading: authLoading, user: authUser } = useAuth(); // Thêm isLoading và user từ useAuth

  // States
  const [user, setUser] = useState<User>(mockUser);
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('account');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderStatusFilter, setOrderStatusFilter] = useState<OrderStatusType>('all');
  const [searchOrderQuery, setSearchOrderQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Kiểm tra xác thực và lấy dữ liệu ban đầu
  useEffect(() => {
    // Chỉ thực hiện khi AuthContext đã load xong
    if (!authLoading) {
      if (isAuthenticated && authUser) {
        // Nếu đã xác thực, fetch dữ liệu user profile
        fetchUserData(authUser._id); // Truyền userId vào fetchUserData
      } else {
        // Nếu chưa xác thực, chuyển hướng đến trang đăng nhập chính xác
        router.push('/auth/login');
      }
    }
  }, [isAuthenticated, authLoading, authUser, router]); // Thêm authLoading và authUser vào dependencies

  // Hàm lấy dữ liệu người dùng từ API - nhận userId làm tham số
  const fetchUserData = async (userId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Lấy dữ liệu profile
      console.log('Bắt đầu lấy profile người dùng');
      let userProfile;

      try {
      // Lấy dữ liệu profile đầy đủ từ API
      userProfile = await UserApiService.getProfile(); // Gọi API để lấy profile đầy đủ
      setUser(userProfile); // Cập nhật state với profile đầy đủ
      console.log('Đã lấy profile đầy đủ từ API:', userProfile);

      // Kiểm tra xem userProfile có tồn tại không trước khi tiếp tục
      if (userProfile && userProfile._id) {
        // Thực hiện các API call khác với userId đã có (lấy từ userProfile)
        try {
          console.log('Đang lấy wishlist với userId:', userProfile._id);
          // Lấy danh sách wishlist - Tạm thời vô hiệu hóa backend
          try {
            const wishlist = await UserApiService.getWishlist();
            setWishlistItems(wishlist);
            console.log('Lấy wishlist thành công:', wishlist);
          } catch (wishlistError) {
            console.error("Lỗi khi lấy wishlist:", wishlistError);
            // Set empty wishlist and don't show error to user
            setWishlistItems([]);
            // Don't show toast for wishlist errors as they're not critical
            // toast.warning('Không thể tải danh sách yêu thích. Vui lòng thử lại sau.');
          }

          // Lấy danh sách đơn hàng - Bắt lỗi nếu API chưa tồn tại
          try {
            const { orders: userOrders } = await UserApiService.getOrders();
            setOrders(userOrders);
            console.log('Đã lấy orders thành công:', userOrders);
          } catch (orderError) {
            console.warn("Lỗi khi lấy orders (có thể do API chưa tồn tại):", orderError);
            // Set orders thành mảng rỗng để tránh lỗi
            setOrders([]);
          }

          // Lấy danh sách thông báo
          const { notifications: userNotifications } = await UserApiService.getNotifications();
          setNotifications(userNotifications);
          console.log('Đã lấy notifications thành công:', userNotifications);

          // Lấy danh sách đánh giá
          const { reviews: userReviews } = await UserApiService.getReviews();
          setReviews(userReviews);
          console.log('Đã lấy reviews thành công:', userReviews);
        } catch (otherError) {
          console.error('Lỗi khi lấy dữ liệu bổ sung:', otherError);
          toast.warning('Một số dữ liệu không thể tải. Vui lòng làm mới trang.');

          // Trong môi trường phát triển, sử dụng dữ liệu mẫu
          if (process.env.NODE_ENV === 'development') {
            setWishlistItems(mockWishlistItems);
            setOrders(mockOrders);
            setNotifications(mockNotifications);
            setReviews(mockReviews);
            console.log('Sử dụng dữ liệu mẫu cho các phần khác trong môi trường phát triển');
          }
        }
      } else {
        // Xử lý trường hợp userProfile không hợp lệ sau khi gọi API
        console.error('Dữ liệu profile lấy từ API không hợp lệ:', userProfile);
        throw new Error('Dữ liệu profile không hợp lệ sau khi gọi API');
      }
    } catch (profileError) {
      console.error('Lỗi khi lấy profile từ API:', profileError);

        // Kiểm tra nếu lỗi là do phiên đăng nhập hết hạn
        if (profileError instanceof Error &&
            profileError.message.includes('Phiên đăng nhập đã hết hạn')) {
          toast.error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.');

          // Đăng xuất người dùng
          await logout(); // Sử dụng logout từ useAuth

          // Chuyển hướng đến trang đăng nhập
          router.push('/auth/login'); // Sửa đường dẫn
          return;
        }

        // Hiển thị thông báo lỗi cụ thể nếu có
        const errorMessage = profileError instanceof Error ?
          profileError.message : 'Không thể lấy thông tin người dùng';

        toast.error(errorMessage);
        setError(errorMessage);

        // Nếu lỗi không phải 401, vẫn tiếp tục với mock data trong môi trường dev
        if (process.env.NODE_ENV === 'development') {
          setUser(mockUser);
          setWishlistItems(mockWishlistItems);
          setOrders(mockOrders);
          setNotifications(mockNotifications);
          setReviews(mockReviews);
          console.log('Sử dụng dữ liệu mẫu trong môi trường phát triển do lỗi profile');
        } else {
          return; // Dừng lại nếu không có profile trong môi trường production
        }
      }
    } catch (err) {
      console.error('Lỗi khi lấy dữ liệu người dùng:', err);
      const errorMessage = err instanceof Error ? err.message : 'Đã xảy ra lỗi khi tải dữ liệu';
      setError(errorMessage);
      toast.error(errorMessage);

      // Sử dụng dữ liệu mẫu khi có lỗi xảy ra (chỉ dùng cho môi trường dev)
      if (process.env.NODE_ENV === 'development') {
        setUser(mockUser);
        setWishlistItems(mockWishlistItems);
        setOrders(mockOrders);
        setNotifications(mockNotifications);
        setReviews(mockReviews);
        console.log('Sử dụng dữ liệu mẫu trong môi trường phát triển do lỗi tổng thể');
      }
    } finally {
      setIsLoading(false);
    }
  };

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

  // Handler functions với API integration
  const handleUpdateProfile = async (updatedData: Partial<User>) => {
    try {
      setIsLoading(true);
      const updatedUser = await UserApiService.updateProfile(updatedData);
      setUser(updatedUser);
      toast.success('Cập nhật thông tin thành công!');
    } catch (err) {
      console.error('Lỗi khi cập nhật thông tin:', err);
      toast.error(err instanceof Error ? err.message : 'Đã xảy ra lỗi khi cập nhật thông tin');
    } finally {
      setIsLoading(false);
    }
  };

  // Updated handleAddAddress to match the prop type
  const handleAddAddress = async (address: Omit<Address, '_id'>) => {
    try {
      setIsLoading(true);
      // Ensure the passed address object matches Omit<Address, '_id'> if needed,
      // but UserApiService.addAddress already expects this type after previous edits.
      const updatedUser = await UserApiService.addAddress(address);
      setUser(updatedUser);
      toast.success('Thêm địa chỉ mới thành công!');
    } catch (err) {
      console.error('Lỗi khi thêm địa chỉ:', err);
      toast.error(err instanceof Error ? err.message : 'Đã xảy ra lỗi khi thêm địa chỉ');
    } finally {
      setIsLoading(false);
    }
  };

  // Updated handleUpdateAddress to use _id
  const handleUpdateAddress = async (updatedAddress: Address) => {
    try {
      setIsLoading(true);
      const { _id, ...addressData } = updatedAddress; // Destructure _id
      if (!_id) {
        throw new Error("Không tìm thấy ID địa chỉ để cập nhật.");
      }
      // UserApiService.updateAddress expects Omit<Address, '_id'> or similar for data part
      // Ensure addressData matches what the API expects (it should if Address type is correct)
      const updatedUser = await UserApiService.updateAddress(_id, addressData as Omit<Address, '_id'>); // Pass _id and the rest
      setUser(updatedUser);
      toast.success('Cập nhật địa chỉ thành công!');
    } catch (err) {
      console.error('Lỗi khi cập nhật địa chỉ:', err);
      toast.error(err instanceof Error ? err.message : 'Đã xảy ra lỗi khi cập nhật địa chỉ');
    } finally {
      setIsLoading(false);
    }
  };

  // Updated handleDeleteAddress to use _id
  const handleDeleteAddress = async (_id: string) => { // Use _id
    try {
      setIsLoading(true);
      const updatedUser = await UserApiService.deleteAddress(_id); // Pass _id
      setUser(updatedUser);
      toast.success('Xóa địa chỉ thành công!');
    } catch (err) {
      console.error('Lỗi khi xóa địa chỉ:', err);
      toast.error(err instanceof Error ? err.message : 'Đã xảy ra lỗi khi xóa địa chỉ');
    } finally {
      setIsLoading(false);
    }
  };

  // Updated handleSetDefaultAddress to use _id
  const handleSetDefaultAddress = async (_id: string) => { // Use _id
    try {
      setIsLoading(true);
      const updatedUser = await UserApiService.setDefaultAddress(_id); // Pass _id
      setUser(updatedUser);
      toast.success('Đã đặt làm địa chỉ mặc định!');
    } catch (err) {
      console.error('Lỗi khi đặt địa chỉ mặc định:', err);
      toast.error(err instanceof Error ? err.message : 'Đã xảy ra lỗi khi đặt địa chỉ mặc định');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFromWishlist = async (productId: string, variantId?: string | null) => {
    try {
      setIsLoading(true);
      await UserApiService.removeFromWishlist(productId);

      // Cập nhật danh sách wishlist trên giao diện
      setWishlistItems(prevItems =>
        prevItems.filter(item => item._id !== productId)
      );

      toast.success('Đã xóa sản phẩm khỏi danh sách yêu thích!');
    } catch (err) {
      console.error('Lỗi khi xóa sản phẩm khỏi wishlist:', err);
      toast.error(err instanceof Error ? err.message : 'Đã xảy ra lỗi khi xóa sản phẩm');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = (productId: string, variantId?: string | null) => {
    // Giả lập thêm sản phẩm vào giỏ hàng - tích hợp với CartContext (nếu có)
    toast.success('Đã thêm sản phẩm vào giỏ hàng!');
  };

  const handleViewOrderDetails = async (orderId: string) => {
    try {
      setIsLoading(true);

      // Nếu đã có trong state thì không cần gọi API
      const existingOrder = orders.find(order => order._id === orderId);
      if (existingOrder) {
        setSelectedOrder(existingOrder);
        setShowOrderModal(true);
      } else {
        // Gọi API để lấy chi tiết đơn hàng
        const orderDetail = await UserApiService.getOrderDetail(orderId);
        setSelectedOrder(orderDetail);
        setShowOrderModal(true);
      }
    } catch (err) {
      console.error('Lỗi khi lấy chi tiết đơn hàng:', err);
      toast.error(err instanceof Error ? err.message : 'Đã xảy ra lỗi khi lấy chi tiết đơn hàng');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadInvoice = async (orderId: string) => {
    try {
      setIsLoading(true);
      toast.info('Đang tải xuống hóa đơn...');

      const blob = await UserApiService.downloadInvoice(orderId);

      // Tạo đường dẫn URL từ blob và tạo link download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice_${orderId}.pdf`);
      document.body.appendChild(link);
      link.click();

      // Xóa đường dẫn tạm
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Tải xuống hóa đơn thành công!');
    } catch (err) {
      console.error('Lỗi khi tải hóa đơn:', err);
      toast.error(err instanceof Error ? err.message : 'Đã xảy ra lỗi khi tải hóa đơn');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (window.confirm('Bạn có chắc muốn hủy đơn hàng này?')) {
      try {
        setIsLoading(true);
        const reason = window.prompt('Vui lòng cho biết lý do hủy đơn hàng:') || 'Người dùng hủy đơn';

        // Gọi API hủy đơn hàng
        const updatedOrder = await UserApiService.cancelOrder(orderId, reason);

        // Cập nhật danh sách đơn hàng
        setOrders(prevOrders =>
          prevOrders.map(order =>
            order._id === orderId ? updatedOrder : order
          )
        );

        // Cập nhật đơn hàng đang xem nếu cần
        if (selectedOrder && selectedOrder._id === orderId) {
          setSelectedOrder(updatedOrder);
        }

        toast.success('Hủy đơn hàng thành công!');

        // Đóng modal chi tiết đơn hàng
        setShowOrderModal(false);
      } catch (err) {
        console.error('Lỗi khi hủy đơn hàng:', err);
        toast.error(err instanceof Error ? err.message : 'Đã xảy ra lỗi khi hủy đơn hàng');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleReturnOrder = async (orderId: string) => {
    try {
      setIsLoading(true);
      const reason = window.prompt('Vui lòng cho biết lý do trả hàng:') || 'Không hài lòng với sản phẩm';

      // Gọi API yêu cầu trả hàng
      const updatedOrder = await UserApiService.requestReturnOrder(orderId, reason);

      // Cập nhật danh sách đơn hàng
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order._id === orderId ? updatedOrder : order
        )
      );

      // Cập nhật đơn hàng đang xem nếu cần
      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder(updatedOrder);
      }

      toast.info('Đã gửi yêu cầu trả hàng. Chúng tôi sẽ liên hệ với bạn sớm!');
      setShowOrderModal(false);
    } catch (err) {
      console.error('Lỗi khi yêu cầu trả hàng:', err);
      toast.error(err instanceof Error ? err.message : 'Đã xảy ra lỗi khi yêu cầu trả hàng');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBuyAgain = async (orderId: string) => {
    try {
      setIsLoading(true);

      // Gọi API mua lại sản phẩm
      const result = await UserApiService.buyAgain(orderId);

      if (result.success) {
        toast.success(result.message || 'Đã thêm các sản phẩm vào giỏ hàng!');

        // Đóng modal chi tiết đơn hàng
        setShowOrderModal(false);

        // Chuyển hướng đến trang giỏ hàng
        router.push('/cart');
      } else {
        throw new Error(result.message || 'Đã xảy ra lỗi khi thêm sản phẩm vào giỏ hàng');
      }
    } catch (err) {
      console.error('Lỗi khi mua lại sản phẩm:', err);
      toast.error(err instanceof Error ? err.message : 'Đã xảy ra lỗi khi thêm sản phẩm vào giỏ hàng');
    } finally {
      setIsLoading(false);
    }
  }; // Kết thúc handleBuyAgain

  const handleLogout = async () => {
    if (window.confirm('Bạn có chắc muốn đăng xuất?')) {
      try {
        await logout(); // Sử dụng logout từ useAuth
        router.push('/auth/login'); // Sửa đường dẫn
        toast.success('Đăng xuất thành công!');
      } catch (err) {
        console.error('Lỗi khi đăng xuất:', err);
        toast.error(err instanceof Error ? err.message : 'Đã xảy ra lỗi khi đăng xuất');
      }
    }
  }; // Thêm dấu ngoặc nhọn bị thiếu

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await UserApiService.markNotificationAsRead(notificationId);

      // Cập nhật trạng thái trên giao diện
      setNotifications(prevNotifications =>
        prevNotifications.map(notification =>
          notification._id === notificationId
            ? { ...notification, isRead: true }
            : notification
        )
      );
    } catch (err) {
      console.error('Lỗi khi đánh dấu thông báo đã đọc:', err);
      // Không hiển thị toast lỗi để tránh làm phiền người dùng với thao tác nhỏ này
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setIsLoading(true);
      await UserApiService.markAllNotificationsAsRead();

      // Cập nhật trạng thái trên giao diện
      setNotifications(prevNotifications =>
        prevNotifications.map(notification => ({ ...notification, isRead: true }))
      );

      toast.success('Đã đánh dấu tất cả thông báo là đã đọc');
    } catch (err) {
      console.error('Lỗi khi đánh dấu tất cả thông báo đã đọc:', err);
      toast.error(err instanceof Error ? err.message : 'Đã xảy ra lỗi khi cập nhật thông báo');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      setIsLoading(true);
      await UserApiService.deleteNotification(notificationId);

      // Cập nhật danh sách thông báo
      setNotifications(prevNotifications =>
        prevNotifications.filter(notification => notification._id !== notificationId)
      );

      toast.success('Đã xóa thông báo');
    } catch (err) {
      console.error('Lỗi khi xóa thông báo:', err);
      toast.error(err instanceof Error ? err.message : 'Đã xảy ra lỗi khi xóa thông báo');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditReview = async (reviewId: string, updatedData: Partial<Review>) => {
    try {
      setIsLoading(true);
      const updatedReview = await UserApiService.updateReview(reviewId, updatedData);

      // Cập nhật danh sách đánh giá
      setReviews(prevReviews =>
        prevReviews.map(review =>
          review._id === reviewId ? updatedReview : review
        )
      );

      toast.success('Cập nhật đánh giá thành công!');
    } catch (err) {
      console.error('Lỗi khi cập nhật đánh giá:', err);
      toast.error(err instanceof Error ? err.message : 'Đã xảy ra lỗi khi cập nhật đánh giá');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    try {
      setIsLoading(true);
      await UserApiService.deleteReview(reviewId);

      // Cập nhật danh sách đánh giá
      setReviews(prevReviews =>
        prevReviews.filter(review => review._id !== reviewId)
      );

      toast.success('Xóa đánh giá thành công!');
    } catch (err) {
      console.error('Lỗi khi xóa đánh giá:', err);
      toast.error(err instanceof Error ? err.message : 'Đã xảy ra lỗi khi xóa đánh giá');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOrderStatusFilterChange = (status: OrderStatusType) => {
    setOrderStatusFilter(status);

    // Lấy danh sách đơn hàng theo trạng thái từ API
    (async () => {
      try {
        setIsLoading(true);
        const { orders: filteredOrders } = await UserApiService.getOrders(status);
        setOrders(filteredOrders);
      } catch (err) {
        console.error('Lỗi khi lọc đơn hàng:', err);
        toast.error(err instanceof Error ? err.message : 'Đã xảy ra lỗi khi lọc đơn hàng');
      } finally {
        setIsLoading(false);
      }
    })();
  };

  const handleSearchOrderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchOrderQuery(e.target.value);
  };

  const handleSearchOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Tìm kiếm đơn hàng theo mã đơn - có thể thực hiện ở component OrdersTab
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
        isLoading,
        error,
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
