import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import Cookies from 'js-cookie';
import { useAuth } from '../AuthContext';

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
  paymentMethod: 'cod' | 'bank_transfer' | 'credit_card' | 'stripe';
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
  const { user, isAuthenticated, accessToken } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [orderTracking, setOrderTracking] = useState<OrderTracking | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);

  // Cấu hình Axios với Auth token
  const api = useCallback(() => {
    const token = localStorage.getItem('accessToken') || Cookies.get('accessToken');

    return axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      }
    });
  }, []);

  // Xử lý lỗi
  const handleError = (error: any) => {
    console.error('API Error:', error);
    const errorMessage = error.response?.data?.message || error.message || 'Đã xảy ra lỗi';
    setError(errorMessage);
    toast.error(errorMessage);
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

      const response = await api().get(`/orders?${queryParams.toString()}`);

      setOrders(response.data.data);
      setTotalItems(response.data.total);
      setCurrentPage(response.data.page);
      setTotalPages(response.data.totalPages);

      return response.data;
    } catch (error) {
      handleError(error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [api, user, isAuthenticated]);

  // Lấy chi tiết đơn hàng
  const fetchOrderDetail = useCallback(async (id: string): Promise<Order | null> => {
    if (!user || !isAuthenticated) return null;

    try {
      setLoading(true);
      setError(null);

      const response = await api().get(`/orders/${id}`);
      setCurrentOrder(response.data);

      return response.data;
    } catch (error) {
      handleError(error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [api, user, isAuthenticated]);

  // Lấy thông tin theo dõi đơn hàng
  const fetchOrderTracking = useCallback(async (id: string): Promise<OrderTracking | null> => {
    if (!user || !isAuthenticated) return null;

    try {
      setLoading(true);
      setError(null);

      const response = await api().get(`/orders/${id}/tracking`);
      setOrderTracking(response.data);

      return response.data;
    } catch (error) {
      handleError(error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [api, user, isAuthenticated]);

  // Tạo đơn hàng mới
  const createOrder = useCallback(async (orderData: CreateOrderDto): Promise<Order | null> => {
    if (!user || !isAuthenticated) return null;

    try {
      setLoading(true);
      setError(null);

      const response = await api().post('/orders', orderData);

      // Cập nhật lại danh sách đơn hàng
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
  }, [api, user, isAuthenticated]);

  // Hủy đơn hàng
  const cancelOrder = useCallback(async (
    id: string,
    reason: string
  ): Promise<Order | null> => {
    if (!user || !isAuthenticated) return null;

    try {
      setLoading(true);
      setError(null);

      const response = await api().patch(`/orders/${id}/cancel`, { reason });

      // Cập nhật lại danh sách đơn hàng
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
  }, [api, currentOrder, user, isAuthenticated]);

  // Tính phí vận chuyển (API getPrice)
  const calculateShippingFee = useCallback(async (data: ShippingFeeRequest): Promise<ShippingFeeResponse> => {
    try {
      setLoading(true);
      setError(null);

      const response = await api().post('/orders/calculate-shipping', data);

      return response.data;
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
  }, [api]);

  // Tính phí vận chuyển cho tất cả dịch vụ (API getPriceAll)
  const calculateShippingFeeAll = useCallback(async (data: ShippingFeeRequest): Promise<ShippingFeeResponse> => {
    try {
      setLoading(true);
      setError(null);

      const response = await api().post('/orders/calculate-shipping-all', data);

      return response.data;
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
  }, [api]);

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
