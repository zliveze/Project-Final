import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../AuthContext';
import axiosInstance from '../../lib/axiosInstance';

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
  wardCode: string;
  district: string;
  districtCode: string;
  province: string;
  provinceCode: string;
  postalCode?: string;
  country?: string;
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

export interface OrderContextType {
  orders: Order[];
  currentOrder: Order | null;
  orderTracking: OrderTracking | null;
  loading: boolean;
  error: string | null;
  totalPages: number;
  currentPage: number;
  totalItems: number;
  orderStatusFilter: OrderStatusType; // Changed to OrderStatusType
  searchOrderQuery: string;
  fetchOrders: (page?: number, limit?: number, status?: OrderStatusType) => Promise<void>; // Changed to OrderStatusType
  fetchOrderDetail: (id: string) => Promise<Order | null>;
  fetchOrderTracking: (id: string) => Promise<OrderTracking | null>;
  cancelOrder: (id: string, reason: string) => Promise<Order | null>;
  downloadInvoice: (id: string) => Promise<unknown>;
  buyAgain: (id: string) => Promise<boolean>;
  setOrderStatusFilter: (status: OrderStatusType) => void; // Changed to OrderStatusType
  setSearchOrderQuery: (query: string) => void;
  searchOrders: () => Promise<void>;
  refreshData: () => Promise<void>;
}

import { OrderStatusType } from '../../components/profile/types'; // Import OrderStatusType

// Tạo context
const OrderContext = createContext<OrderContextType | undefined>(undefined);

// Provider component
export const OrderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [orderTracking, setOrderTracking] = useState<OrderTracking | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [orderStatusFilter, setOrderStatusFilter] = useState<OrderStatusType>('all'); // Changed to OrderStatusType
  const [searchOrderQuery, setSearchOrderQuery] = useState<string>('');

  // Xử lý lỗi
  const handleError = (error: unknown) => {
    console.error('API Error in OrderContext:', error);
    const errorObj = error as { response?: { data?: { message?: string } }; message?: string };
    const errorMessage = errorObj.response?.data?.message || errorObj.message || 'Đã xảy ra lỗi';
    setError(errorMessage);

    // Chỉ hiển thị toast nếu lỗi không phải là lỗi 401 đã được interceptor xử lý
    if (errorMessage !== 'Phiên đăng nhập đã hết hạn.') {
      toast.error(errorMessage);
    }
  };

  // Lấy danh sách đơn hàng
  const fetchOrders = useCallback(async (
    page: number = 1,
    limit: number = 10,
    status: OrderStatusType = orderStatusFilter // Changed to OrderStatusType
  ) => {
    if (!user || !isAuthenticated) return;

    try {
      setLoading(true);
      setError(null);

      // Xây dựng query params
      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('limit', limit.toString());

      if (status && status !== 'all') {
        queryParams.append('status', status);
      }

      // Sử dụng axiosInstance
      const response = await axiosInstance.get(`/orders?${queryParams.toString()}`);

      // Kiểm tra cấu trúc response
      if (response.data && Array.isArray(response.data.data)) {
        setOrders(response.data.data);
        setTotalItems(response.data.total || 0);
        setCurrentPage(response.data.page || 1);
        setTotalPages(response.data.totalPages || 1);
      } else {
        console.warn('Unexpected API response structure for orders:', response.data);
        setOrders([]);
        setTotalItems(0);
        setCurrentPage(1);
        setTotalPages(1);
      }
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  }, [user, isAuthenticated, orderStatusFilter]);

  // Tìm kiếm đơn hàng
  const searchOrders = useCallback(async () => {
    if (!user || !isAuthenticated) return;

    try {
      setLoading(true);
      setError(null);

      // Xây dựng query params
      const queryParams = new URLSearchParams();
      queryParams.append('page', '1');
      queryParams.append('limit', '10');

      if (orderStatusFilter && orderStatusFilter !== 'all') {
        queryParams.append('status', orderStatusFilter);
      }

      if (searchOrderQuery) {
        queryParams.append('search', searchOrderQuery);
      }

      // Sử dụng axiosInstance
      const response = await axiosInstance.get(`/orders?${queryParams.toString()}`);

      // Kiểm tra cấu trúc response
      if (response.data && Array.isArray(response.data.data)) {
        setOrders(response.data.data);
        setTotalItems(response.data.total || 0);
        setCurrentPage(response.data.page || 1);
        setTotalPages(response.data.totalPages || 1);
      } else {
        console.warn('Unexpected API response structure for orders:', response.data);
        setOrders([]);
        setTotalItems(0);
        setCurrentPage(1);
        setTotalPages(1);
      }
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  }, [user, isAuthenticated, orderStatusFilter, searchOrderQuery]);

  // Lấy chi tiết đơn hàng
  const fetchOrderDetail = useCallback(async (id: string): Promise<Order | null> => {
    if (!user || !isAuthenticated) return null;

    try {
      setLoading(true);
      setError(null);

      // Sử dụng axiosInstance
      const response = await axiosInstance.get(`/orders/${id}`);
      setCurrentOrder(response.data);

      return response.data;
    } catch (error) {
      handleError(error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, isAuthenticated]);

  // Lấy thông tin theo dõi đơn hàng
  const fetchOrderTracking = useCallback(async (id: string): Promise<OrderTracking | null> => {
    if (!user || !isAuthenticated) return null;

    try {
      setLoading(true);
      setError(null);

      // Sử dụng axiosInstance
      const response = await axiosInstance.get(`/orders/${id}/tracking`);
      setOrderTracking(response.data);

      return response.data;
    } catch (error) {
      handleError(error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, isAuthenticated]);

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
  }, [currentOrder, user, isAuthenticated]);

  // Tải hóa đơn
  const downloadInvoice = useCallback(async (id: string): Promise<unknown> => {
    if (!user || !isAuthenticated) return null;

    try {
      setLoading(true);
      setError(null);

      // Kiểm tra ID đơn hàng
      if (!id || id === 'user' || id === 'undefined') {
        console.error('Invalid order ID:', id);
        throw new Error('ID đơn hàng không hợp lệ');
      }

      console.log('Downloading invoice for order ID:', id);

      // Sử dụng axiosInstance với responseType json
      const response = await axiosInstance.get(`/orders/${id}/invoice`);

      return response.data;
    } catch (error) {
      handleError(error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, isAuthenticated]);

  // Mua lại
  const buyAgain = useCallback(async (id: string): Promise<boolean> => {
    if (!user || !isAuthenticated) return false;

    try {
      setLoading(true);
      setError(null);

      // Sử dụng axiosInstance
      const response = await axiosInstance.post(`/orders/${id}/buy-again`);

      if (response.data && response.data.success) {
        toast.success('Đã thêm sản phẩm vào giỏ hàng');
        return true;
      } else {
        throw new Error(response.data?.message || 'Không thể thêm sản phẩm vào giỏ hàng');
      }
    } catch (error) {
      handleError(error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, isAuthenticated]);

  // Refresh dữ liệu
  const refreshData = useCallback(async () => {
    await fetchOrders(currentPage, 10, orderStatusFilter);
  }, [fetchOrders, currentPage, orderStatusFilter]);

  // Khởi tạo dữ liệu
  useEffect(() => {
    if (user && isAuthenticated) {
      fetchOrders();
    }
  }, [fetchOrders, user, isAuthenticated]);

  // Cập nhật khi thay đổi bộ lọc
  useEffect(() => {
    if (user && isAuthenticated) {
      fetchOrders(1, 10, orderStatusFilter);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderStatusFilter, user, isAuthenticated]); // Removed fetchOrders from deps as it's stable

  return (
    <OrderContext.Provider
      value={{
        orders,
        currentOrder,
        orderTracking,
        loading,
        error,
        totalPages,
        currentPage,
        totalItems,
        orderStatusFilter,
        searchOrderQuery,
        fetchOrders,
        fetchOrderDetail,
        fetchOrderTracking,
        cancelOrder,
        downloadInvoice,
        buyAgain,
        setOrderStatusFilter,
        setSearchOrderQuery,
        searchOrders,
        refreshData,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

// Hook để sử dụng context
export const useOrder = (): OrderContextType => {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
};
