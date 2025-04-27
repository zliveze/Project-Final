import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
// Bỏ import axios trực tiếp, Cookies vì đã xử lý trong axiosInstance
import { toast } from 'react-hot-toast';
import { useAuth } from '../AuthContext';
import axiosInstance from '../../lib/axiosInstance'; // Import instance dùng chung

// Định nghĩa các interface
export interface OrderItem {
  productId: string;
  variantId?: string;
  name: string;
  image?: string;
  options?: Record<string, string>;
  quantity: number;
  price: number;
}

export interface OrderVoucher {
  voucherId: string;
  code: string;
  discountAmount: number;
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  email?: string;
  addressLine1: string;
  addressLine2?: string;
  ward: string;
  wardCode: string; // Bắt buộc cho ViettelPost
  district: string;
  districtCode: string; // Bắt buộc cho ViettelPost
  province: string;
  provinceCode: string; // Bắt buộc cho ViettelPost
  postalCode?: string;
  country?: string;
}

export interface CreateOrderDto {
  items: OrderItem[];
  subtotal: number;
  tax?: number;
  shippingFee?: number;
  totalPrice: number;
  voucher?: OrderVoucher;
  finalPrice: number;
  shippingAddress: ShippingAddress;
  branchId?: string;
  paymentMethod: 'cod' | 'bank_transfer' | 'credit_card' | 'stripe' | 'momo';
  notes?: string;
  shippingServiceCode?: string; // Thêm mã dịch vụ vận chuyển đã chọn
}

export interface Order {
  _id: string;
  orderNumber: string;
  userId: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shippingFee: number;
  totalPrice: number;
  voucher?: OrderVoucher;
  finalPrice: number;
  status: string;
  shippingAddress: ShippingAddress;
  branchId?: string;
  paymentMethod: string;
  paymentStatus: string;
  trackingCode?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderTracking {
  orderId: string;
  status: string;
  trackingCode?: string;
  carrier?: {
    name: string;
    trackingNumber: string;
    trackingUrl?: string;
  };
  history: Array<{
    status: string;
    description?: string;
    timestamp: string;
    location?: string;
    updatedBy?: string;
  }>;
  estimatedDelivery?: string;
  actualDelivery?: string;
}

export interface ShippingFeeRequest {
  // Cấu trúc này phải khớp với API getPrice và getPriceAll của Viettel Post
  PRODUCT_WEIGHT: number;
  PRODUCT_PRICE: number;
  MONEY_COLLECTION: number | string;
  SENDER_PROVINCE: number | string;
  SENDER_DISTRICT: number | string;
  RECEIVER_PROVINCE: number | string;
  RECEIVER_DISTRICT: number | string;
  PRODUCT_TYPE: string;
  // Các trường tùy chọn
  ORDER_SERVICE_ADD?: string;
  ORDER_SERVICE?: string;
  NATIONAL_TYPE?: number;
  TYPE?: number;
  PRODUCT_LENGTH?: number;
  PRODUCT_WIDTH?: number;
  PRODUCT_HEIGHT?: number;
}

export interface ShippingService {
  serviceCode: string;
  serviceName: string;
  fee: number;
  estimatedDeliveryTime: string;
}

export interface ShippingFeeResponse {
  success: boolean;
  fee: number;
  estimatedDeliveryTime?: string;
  selectedServiceCode?: string; // Thêm mã dịch vụ đã chọn
  error?: string;
  availableServices?: ShippingService[];
}

export interface UserOrderContextType {
  orders: Order[];
  currentOrder: Order | null;
  orderTracking: OrderTracking | null;
  loading: boolean;
  error: string | null;
  totalPages: number;
  currentPage: number;
  totalItems: number;
  fetchOrders: (page?: number, limit?: number) => Promise<void>;
  fetchOrderDetail: (id: string) => Promise<Order | null>;
  fetchOrderTracking: (id: string) => Promise<OrderTracking | null>;
  createOrder: (orderData: CreateOrderDto) => Promise<Order | null>;
  cancelOrder: (id: string, reason: string) => Promise<Order | null>;
  calculateShippingFee: (data: ShippingFeeRequest) => Promise<ShippingFeeResponse>;
  calculateShippingFeeAll: (data: ShippingFeeRequest) => Promise<ShippingFeeResponse>;
  refreshData: () => Promise<void>;
}

// Tạo context
const UserOrderContext = createContext<UserOrderContextType | undefined>(undefined);

// Provider component
export const UserOrderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [orderTracking, setOrderTracking] = useState<OrderTracking | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);

  // Bỏ hook `api` vì đã dùng axiosInstance

  // Xử lý lỗi - Kiểm tra nếu lỗi là từ interceptor 401 thì không toast nữa
  const handleError = (error: any) => {
    console.error('API Error in UserOrderContext:', error);
    const errorMessage = error.response?.data?.message || error.message || 'Đã xảy ra lỗi';
    setError(errorMessage);
    // Chỉ hiển thị toast nếu lỗi không phải là lỗi 401 đã được interceptor xử lý
    if (errorMessage !== 'Phiên đăng nhập đã hết hạn.') {
      toast.error(errorMessage);
    }
  };

  // Lấy danh sách đơn hàng
  const fetchOrders = useCallback(async (
    page: number = 1,
    limit: number = 10
  ) => {
    if (!user || !isAuthenticated) return;

    try {
      setLoading(true);
      setError(null);

      // Xây dựng query params
      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('limit', limit.toString());

      // Sử dụng axiosInstance
      const response = await axiosInstance.get(`/orders?${queryParams.toString()}`);

      // API backend trả về { data: Order[], total: number, page: number, totalPages: number }
      // Cần kiểm tra cấu trúc response thực tế từ backend
      if (response.data && Array.isArray(response.data.data)) {
        setOrders(response.data.data);
        setTotalItems(response.data.total ?? 0);
        setCurrentPage(response.data.page ?? 1);
        setTotalPages(response.data.totalPages ?? 1);
      } else {
        // Xử lý trường hợp cấu trúc dữ liệu không mong đợi
        console.warn('Unexpected API response structure for orders:', response.data);
        setOrders([]);
        setTotalItems(0);
        setCurrentPage(1);
        setTotalPages(1);
      }

      // Trả về dữ liệu gốc để tương thích nếu cần
      return response.data;
    } catch (error) {
      handleError(error);
      // Trả về null hoặc cấu trúc lỗi phù hợp
      return { data: [], total: 0, page: 1, totalPages: 1 };
    } finally {
      setLoading(false);
    }
  }, [user, isAuthenticated]); // Bỏ api khỏi dependencies
  // Dòng lỗi đã bị xóa

  // Lấy chi tiết đơn hàng
  const fetchOrderDetail = useCallback(async (id: string): Promise<Order | null> => {
    if (!user || !isAuthenticated) return null;

    try {
      setLoading(true);
      setError(null);

      // Sử dụng axiosInstance
      const response = await axiosInstance.get(`/orders/${id}`);
      setCurrentOrder(response.data); // Giả sử backend trả về Order object trực tiếp

      return response.data;
    } catch (error) {
      handleError(error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, isAuthenticated]); // Bỏ api khỏi dependencies

  // Lấy thông tin theo dõi đơn hàng
  const fetchOrderTracking = useCallback(async (id: string): Promise<OrderTracking | null> => {
    if (!user || !isAuthenticated) return null;

    try {
      setLoading(true);
      setError(null);

      // Sử dụng axiosInstance
      const response = await axiosInstance.get(`/orders/${id}/tracking`);
      setOrderTracking(response.data); // Giả sử backend trả về OrderTracking object

      return response.data;
    } catch (error) {
      handleError(error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, isAuthenticated]); // Bỏ api khỏi dependencies

  // Tạo đơn hàng mới
  const createOrder = useCallback(async (orderData: CreateOrderDto): Promise<Order | null> => {
    if (!user || !isAuthenticated) return null;

    try {
      setLoading(true);
      setError(null);

      // Sử dụng axiosInstance
      const response = await axiosInstance.post('/orders', orderData);

      // Cập nhật lại danh sách đơn hàng (giả sử response.data là Order mới)
      setOrders(prevOrders => [response.data, ...prevOrders]);
      setCurrentOrder(response.data);

      toast.success('Đặt hàng thành công');

      return response.data;
    } catch (error) {
      handleError(error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, isAuthenticated]); // Bỏ api khỏi dependencies

  // Hủy đơn hàng
  const cancelOrder = useCallback(async (
    id: string,
    reason: string
  ): Promise<Order | null> => {
    if (!user || !isAuthenticated) return null;

    try {
      setLoading(true);
      setError(null);

      // Sử dụng axiosInstance
      const response = await axiosInstance.patch(`/orders/${id}/cancel`, { reason });

      // Cập nhật lại danh sách đơn hàng (giả sử response.data là Order đã cập nhật)
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order._id === id ? { ...order, status: 'cancelled' } : order
        )
      );

      // Cập nhật chi tiết đơn hàng nếu đang xem
      if (currentOrder && currentOrder._id === id) {
        setCurrentOrder({ ...currentOrder, status: 'cancelled' });
      }

      toast.success('Hủy đơn hàng thành công');

      return response.data;
    } catch (error) {
      handleError(error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentOrder, user, isAuthenticated]); // Bỏ api khỏi dependencies

  // Tính phí vận chuyển (API getPrice)
  const calculateShippingFee = useCallback(async (data: ShippingFeeRequest): Promise<ShippingFeeResponse> => {
    try {
      setLoading(true);
      setError(null);

      // Sử dụng axiosInstance
      const response = await axiosInstance.post('/orders/calculate-shipping', data);

      return response.data; // Giả sử backend trả về ShippingFeeResponse
    } catch (error) {
      handleError(error);
      return {
        success: false,
        fee: 0,
        error: 'Không thể tính phí vận chuyển'
      };
    } finally {
      setLoading(false);
    }
  }, []); // Bỏ api khỏi dependencies

  // Tính phí vận chuyển cho tất cả dịch vụ (API getPriceAll)
  const calculateShippingFeeAll = useCallback(async (data: ShippingFeeRequest): Promise<ShippingFeeResponse> => {
    try {
      setLoading(true);
      setError(null);

      // Sử dụng axiosInstance
      const response = await axiosInstance.post('/orders/calculate-shipping-all', data);

      return response.data; // Giả sử backend trả về ShippingFeeResponse
    } catch (error) {
      handleError(error);
      return {
        success: false,
        fee: 0,
        error: 'Không thể tính phí vận chuyển cho tất cả dịch vụ'
      };
    } finally {
      setLoading(false);
    }
  }, []); // Bỏ api khỏi dependencies

  // Refresh dữ liệu
  const refreshData = useCallback(async () => {
    await fetchOrders(currentPage);
  }, [fetchOrders, currentPage]);

  // Khởi tạo dữ liệu
  useEffect(() => {
    if (user && isAuthenticated) {
      fetchOrders();
    }
  }, [fetchOrders, user, isAuthenticated]);

  return (
    <UserOrderContext.Provider
      value={{
        orders,
        currentOrder,
        orderTracking,
        loading,
        error,
        totalPages,
        currentPage,
        totalItems,
        fetchOrders,
        fetchOrderDetail,
        fetchOrderTracking,
        createOrder,
        cancelOrder,
        calculateShippingFee,
        calculateShippingFeeAll,
        refreshData,
      }}
    >
      {children}
    </UserOrderContext.Provider>
  );
};

// Hook để sử dụng context
export const useUserOrder = (): UserOrderContextType => {
  const context = useContext(UserOrderContext);
  if (context === undefined) {
    throw new Error('useUserOrder must be used within a UserOrderProvider');
  }
  return context;
};
