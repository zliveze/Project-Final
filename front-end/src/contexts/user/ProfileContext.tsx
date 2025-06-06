import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import { User, WishlistItem, Order, Notification, Review, Address, TabType, OrderStatusType } from '../../components/profile/types';
import { mockUser, mockWishlistItems, mockOrders, mockNotifications, mockReviews } from '../../mock/profileData';
import { UserApiService } from './UserApiService';
import { useAuth } from '../AuthContext';
import { useOrder } from './OrderContext';

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
  const {
    fetchOrderDetail,
    downloadInvoice,
    cancelOrder,
    buyAgain,
    fetchOrderTracking,
    setOrderStatusFilter: setOrderContextFilter
  } = useOrder();

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

  // Hàm lấy dữ liệu người dùng từ API
  const fetchUserData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      let userProfile: User | null = null;

      // 1. Fetch Profile (critical)
      try {
        console.log('Bắt đầu lấy profile người dùng');
        const fetchedProfile = await UserApiService.getProfile();
        if (fetchedProfile) {
          setUser(fetchedProfile);
          userProfile = fetchedProfile;
          console.log('Đã lấy profile đầy đủ từ API:', userProfile);
        } else {
          console.log('Không lấy được profile từ API hoặc profile là null.');
          throw new Error('Không thể tải dữ liệu người dùng hoặc dữ liệu không tồn tại.');
        }
      } catch (profileError) {
        console.error('Lỗi khi lấy profile từ API:', profileError);
        if (profileError instanceof Error && profileError.message.includes('Phiên đăng nhập đã hết hạn')) {
          toast.error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.');
          await logout();
          router.push('/auth/login');
          return; // Stop execution, finally will still run
        }
        throw profileError; // Re-throw for other profile errors to be caught by the main catch
      }

      // If we reach here, profile was fetched successfully and userProfile should be set.
      if (userProfile && userProfile._id) {
        // Fetch other non-critical data. Each can have its own try/catch.
        try {
          console.log('Đang lấy wishlist với userId:', userProfile._id);
          const wishlist = await UserApiService.getWishlist();
          setWishlistItems(wishlist);
          console.log('Lấy wishlist thành công:', wishlist);
        } catch (wishlistError) {
          console.error("Lỗi khi lấy wishlist:", wishlistError);
          setWishlistItems([]); // Fallback to empty
        }

        try {
          const { orders: userOrders } = await UserApiService.getOrders();
          setOrders(userOrders);
          console.log('Đã lấy orders thành công:', userOrders);
        } catch (orderError) {
          console.warn("Lỗi khi lấy orders (có thể do API chưa tồn tại):", orderError);
          setOrders([]); // Fallback to empty
        }

        try {
          const { notifications: userNotifications } = await UserApiService.getNotifications();
          setNotifications(userNotifications);
          console.log('Đã lấy notifications thành công:', userNotifications);
        } catch (notificationError) {
            console.warn("Lỗi khi lấy notifications:", notificationError);
            setNotifications([]); // Fallback to empty
        }

        try {
          const { reviews: userReviews } = await UserApiService.getReviews();
          setReviews(userReviews);
          console.log('Đã lấy reviews thành công:', userReviews);
        } catch (reviewError) {
            console.warn("Lỗi khi lấy reviews:", reviewError);
            setReviews([]); // Fallback to empty
        }
      } else {
        // This case implies getProfile succeeded but returned invalid data not caught by the first check,
        // or userProfile was not set correctly. This should be treated as a critical error.
        console.error('Dữ liệu profile không hợp lệ hoặc null sau khi fetch (unexpected state):', userProfile);
        throw new Error('Dữ liệu profile không hợp lệ sau khi tải.');
      }
    } catch (err) { // Main catch block for critical errors
      console.error('Lỗi khi lấy dữ liệu người dùng:', err);
      const errorMessage = err instanceof Error ? err.message : 'Đã xảy ra lỗi khi tải dữ liệu';
      setError(errorMessage);
      toast.error(errorMessage);

      // Fallback to mock data in development environment
      if (process.env.NODE_ENV === 'development') {
        setUser(mockUser); // Ensure mockUser is set if profile fetch failed
        setWishlistItems(mockWishlistItems);
        setOrders(mockOrders);
        setNotifications(mockNotifications);
        setReviews(mockReviews);
        console.log('Sử dụng dữ liệu mẫu trong môi trường phát triển do lỗi tổng thể');
      }
      // In production, errors are logged and toasted. Session expiry returns earlier.
      // Other critical errors (like profile fetch failure) will land here.
    } finally {
      setIsLoading(false);
    }
  }, [logout, router, setUser, setWishlistItems, setOrders, setNotifications, setReviews, setIsLoading, setError]);

  // Kiểm tra xác thực và lấy dữ liệu ban đầu
  useEffect(() => {
    // Chỉ thực hiện khi AuthContext đã load xong
    if (!authLoading) {
      if (isAuthenticated && authUser) {
        // Nếu đã xác thực, fetch dữ liệu user profile
        fetchUserData(); // Call without arguments
      } else {
        // Nếu chưa xác thực, chuyển hướng đến trang đăng nhập chính xác
        router.push('/auth/login');
      }
    }
  }, [isAuthenticated, authLoading, authUser, router, fetchUserData]); // fetchUserData is now correctly in scope

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
      await UserApiService.removeFromWishlist(productId, variantId || '');

      // Cập nhật danh sách wishlist trên giao diện
      setWishlistItems(prevItems =>
        prevItems.filter(item =>
          !(item.productId === productId && item.variantId === variantId)
        )
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
    console.log(`Thêm sản phẩm ${productId} ${variantId ? `với biến thể ${variantId}` : ''} vào giỏ hàng`);
    toast.success('Đã thêm sản phẩm vào giỏ hàng!');
  };

  const handleViewOrderDetails = async (orderId: string) => {
    try {
      setIsLoading(true);
      console.log('Viewing order details for ID:', orderId);

      // Kiểm tra xem orders có tồn tại không
      if (orders && Array.isArray(orders)) {
        // Nếu đã có trong state thì không cần gọi API
        const existingOrder = orders.find(order => order._id === orderId);
        if (existingOrder) {
          setSelectedOrder(existingOrder);
          setShowOrderModal(true);
          setIsLoading(false);
          return;
        }
      }

      // Nếu không tìm thấy trong state, sử dụng OrderContext để lấy chi tiết đơn hàng
      const orderDetail = await fetchOrderDetail(orderId);

      if (orderDetail) {
        // Chuyển đổi từ OrderContext.Order sang ProfileContext.Order
        const convertedOrder: Order = {
          _id: orderDetail._id,
          orderNumber: orderDetail.orderNumber,
          createdAt: orderDetail.createdAt,
          status: orderDetail.status,
          products: orderDetail.items.map(item => ({
            productId: item.productId,
            variantId: item.variantId,
            name: item.name,
            image: item.image || '',
            options: item.options,
            quantity: item.quantity,
            price: item.price
          })),
          totalPrice: orderDetail.totalPrice,
          finalPrice: orderDetail.finalPrice,
          voucher: orderDetail.voucher ? {
            voucherId: orderDetail.voucher.voucherId,
            discountAmount: orderDetail.voucher.discountAmount
          } : undefined,
          shippingInfo: {
            address: `${orderDetail.shippingAddress.addressLine1}, ${orderDetail.shippingAddress.ward}, ${orderDetail.shippingAddress.district}, ${orderDetail.shippingAddress.province}`,
            contact: `${orderDetail.shippingAddress.fullName} - ${orderDetail.shippingAddress.phone}`
          }
        };

        // Lấy thông tin tracking nếu có
        try {
          const tracking = await fetchOrderTracking(orderId);
          if (tracking) {
            convertedOrder.tracking = {
              status: tracking.history.map(hist => ({
                state: hist.status,
                description: hist.description || '',
                timestamp: hist.timestamp
              })),
              shippingCarrier: tracking.carrier ? {
                name: tracking.carrier.name,
                trackingNumber: tracking.carrier.trackingNumber,
                trackingUrl: tracking.carrier.trackingUrl || ''
              } : undefined,
              estimatedDelivery: tracking.estimatedDelivery,
              actualDelivery: tracking.actualDelivery
            };
          }
        } catch (trackingError) {
          console.warn('Không thể lấy thông tin tracking:', trackingError);
        }

        setSelectedOrder(convertedOrder);
        setShowOrderModal(true);
      } else {
        toast.error('Không thể lấy thông tin đơn hàng');
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

      console.log('Downloading invoice for order ID:', orderId);

      // Kiểm tra xem orderId có phải là ID hợp lệ không
      if (!orderId || orderId === 'user' || orderId === 'undefined') {
        throw new Error('ID đơn hàng không hợp lệ');
      }

      // Sử dụng OrderContext để tải dữ liệu hóa đơn
      const response = await downloadInvoice(orderId);

      if (response) {
        try {
          // Import jsPDF
          const { jsPDF } = await import('jspdf');

          // Tạo một document PDF mới
          const doc = new jsPDF();

          // Lấy dữ liệu từ response (giả định response là JSON)
          let invoiceData;

          if (response instanceof Blob) {
            // Nếu response là Blob, đọc nội dung JSON từ Blob
            const text = await response.text();
            invoiceData = JSON.parse(text);
          } else {
            // Nếu response đã là object
            invoiceData = response;
          }

          // Thiết lập font và kích thước
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(20);

          // Tiêu đề
          doc.text('HÓA ĐƠN YUMIN COSMETICS', 105, 20, { align: 'center' });

          // Thông tin đơn hàng
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(12);
          doc.text(`Mã đơn hàng: ${invoiceData.orderNumber}`, 20, 40);
          doc.text(`Ngày: ${invoiceData.date}`, 20, 50);

          // Thông tin khách hàng
          doc.text('Thông tin khách hàng:', 20, 70);
          doc.text(`Tên: ${invoiceData.customerName}`, 30, 80);
          doc.text(`Địa chỉ: ${invoiceData.customerAddress}`, 30, 90);
          doc.text(`Điện thoại: ${invoiceData.customerPhone}`, 30, 100);

          // Bảng sản phẩm
          doc.setFontSize(12);
          doc.text('Danh sách sản phẩm:', 20, 120);

          // Header của bảng
          doc.setFont('helvetica', 'bold');
          doc.text('Sản phẩm', 20, 130);
          doc.text('SL', 130, 130);
          doc.text('Đơn giá', 150, 130);
          doc.text('Thành tiền', 180, 130);

          // Nội dung bảng
          doc.setFont('helvetica', 'normal');
          let y = 140;

          invoiceData.items.forEach((item: { name: string; quantity: number; price: number; total: number }) => {
            // Kiểm tra nếu y quá lớn, tạo trang mới
            if (y > 270) {
              doc.addPage();
              y = 20;

              // Thêm header cho trang mới
              doc.setFont('helvetica', 'bold');
              doc.text('Sản phẩm', 20, y);
              doc.text('SL', 130, y);
              doc.text('Đơn giá', 150, y);
              doc.text('Thành tiền', 180, y);
              doc.setFont('helvetica', 'normal');
              y += 10;
            }

            // Cắt tên sản phẩm nếu quá dài
            const productName = item.name.length > 40 ? item.name.substring(0, 37) + '...' : item.name;

            doc.text(productName, 20, y);
            doc.text(item.quantity.toString(), 130, y);
            doc.text(item.price.toLocaleString('vi-VN') + 'đ', 150, y);
            doc.text(item.total.toLocaleString('vi-VN') + 'đ', 180, y);

            y += 10;
          });

          // Tổng cộng
          y += 10;
          doc.text('Tạm tính:', 130, y);
          doc.text(invoiceData.subtotal.toLocaleString('vi-VN') + 'đ', 180, y);

          y += 10;
          doc.text('Phí vận chuyển:', 130, y);
          doc.text(invoiceData.shippingFee.toLocaleString('vi-VN') + 'đ', 180, y);

          if (invoiceData.discount > 0) {
            y += 10;
            doc.text('Giảm giá:', 130, y);
            doc.text('-' + invoiceData.discount.toLocaleString('vi-VN') + 'đ', 180, y);
          }

          y += 10;
          doc.setFont('helvetica', 'bold');
          doc.text('Tổng cộng:', 130, y);
          doc.text(invoiceData.total.toLocaleString('vi-VN') + 'đ', 180, y);

          // Chân trang
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(10);
          doc.text('Cảm ơn quý khách đã mua hàng tại Yumin Cosmetics!', 105, 280, { align: 'center' });

          // Lưu file PDF
          doc.save(`invoice_${invoiceData.orderNumber}.pdf`);

          toast.success('Tải xuống hóa đơn thành công!');
        } catch (pdfError) {
          console.error('Lỗi khi tạo file PDF:', pdfError);
          toast.error('Không thể tạo file PDF. Vui lòng thử lại sau.');
        }
      } else {
        toast.error('Không thể tải hóa đơn');
      }
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

        // Sử dụng OrderContext để hủy đơn hàng
        const updatedOrder = await cancelOrder(orderId, reason);

        if (updatedOrder) {
          // Cập nhật danh sách đơn hàng
          setOrders(prevOrders => {
            if (!prevOrders || !Array.isArray(prevOrders)) {
              return [];
            }
            return prevOrders.map(order =>
              order._id === orderId ? {
                ...order,
                status: 'cancelled'
              } : order
            );
          });

          // Cập nhật đơn hàng đang xem nếu cần
          if (selectedOrder && selectedOrder._id === orderId) {
            setSelectedOrder({
              ...selectedOrder,
              status: 'cancelled'
            });
          }

          // Đóng modal chi tiết đơn hàng
          setShowOrderModal(false);
        } else {
          toast.error('Không thể hủy đơn hàng');
        }
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

      // Gọi API yêu cầu trả hàng (vẫn sử dụng UserApiService vì OrderContext chưa có hàm này)
      const updatedOrder = await UserApiService.requestReturnOrder(orderId, reason);

      // Cập nhật danh sách đơn hàng
      setOrders(prevOrders => {
        if (!prevOrders || !Array.isArray(prevOrders)) {
          return updatedOrder ? [updatedOrder] : [];
        }
        return prevOrders.map(order =>
          order._id === orderId ? updatedOrder : order
        );
      });

      // Cập nhật đơn hàng đang xem nếu cần
      if (selectedOrder && selectedOrder._id === orderId && updatedOrder) {
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

      // Sử dụng OrderContext để mua lại sản phẩm
      const success = await buyAgain(orderId);

      if (success) {
        // Đóng modal chi tiết đơn hàng
        setShowOrderModal(false);

        // Chuyển hướng đến trang giỏ hàng
        router.push('/cart');
      } else {
        throw new Error('Đã xảy ra lỗi khi thêm sản phẩm vào giỏ hàng');
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
      setNotifications(prevNotifications => {
        if (!prevNotifications || !Array.isArray(prevNotifications)) {
          return [];
        }
        return prevNotifications.map(notification =>
          notification._id === notificationId
            ? { ...notification, isRead: true }
            : notification
        );
      });
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
      setNotifications(prevNotifications => {
        if (!prevNotifications || !Array.isArray(prevNotifications)) {
          return [];
        }
        return prevNotifications.map(notification => ({ ...notification, isRead: true }));
      });

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
      setNotifications(prevNotifications => {
        if (!prevNotifications || !Array.isArray(prevNotifications)) {
          return [];
        }
        return prevNotifications.filter(notification => notification._id !== notificationId);
      });

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
      setReviews(prevReviews => {
        if (!prevReviews || !Array.isArray(prevReviews)) {
          return updatedReview ? [updatedReview] : [];
        }
        return prevReviews.map(review =>
          review._id === reviewId ? updatedReview : review
        );
      });

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
      setReviews(prevReviews => {
        if (!prevReviews || !Array.isArray(prevReviews)) {
          return [];
        }
        return prevReviews.filter(review => review._id !== reviewId);
      });

      toast.success('Xóa đánh giá thành công!');
    } catch (err) {
      console.error('Lỗi khi xóa đánh giá:', err);
      toast.error(err instanceof Error ? err.message : 'Đã xảy ra lỗi khi xóa đánh giá');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOrderStatusFilterChange = (status: OrderStatusType) => {
    // Cập nhật state trong ProfileContext
    setOrderStatusFilter(status);

    // Cập nhật state trong OrderContext
    setOrderContextFilter(status);

    // OrderContext sẽ tự động fetch dữ liệu khi orderStatusFilter thay đổi
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
