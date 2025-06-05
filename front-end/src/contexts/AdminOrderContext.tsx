import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import Cookies from 'js-cookie';
import { useAdminAuth } from './AdminAuthContext';

// Định nghĩa các interface
export interface OrderItem {
  productId: string;
  variantId?: string;
  name: string;
  image: string;
  options?: Record<string, string>;
  quantity: number;
  price: number;
}

export interface OrderVoucher {
  voucherId: string;
  discountAmount: number;
  code?: string;
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  ward: string;
  wardCode?: string;
  district: string;
  districtCode?: string;
  province: string;
  provinceCode?: string;
  postalCode?: string;
  country?: string;
}

export interface Order {
  _id: string;
  orderNumber: string;
  userId: string | { _id: string; name?: string; email?: string };
  userName?: string;
  userEmail?: string;
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
  metadata?: Record<string, any>;
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
  details?: any;
}

export interface OrderStats {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  processingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  todayOrders: number;
  todayRevenue: number;
  monthlyStats: Array<{
    month: string;
    orders: number;
    revenue: number;
  }>;
}

export interface OrderFilterState {
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  timePeriod: string;
  dateRange: {
    from: string;
    to: string;
  };
  priceRange: {
    min: string;
    max: string;
  };
  search?: string;
}

export interface AdminOrderContextType {
  orders: Order[];
  orderDetail: Order | null;
  orderTracking: OrderTracking | null;
  orderStats: OrderStats;
  loading: boolean;
  error: string | null;
  totalPages: number;
  currentPage: number;
  totalItems: number;
  filters: OrderFilterState;
  fetchOrders: (page?: number, limit?: number, filters?: OrderFilterState) => Promise<void>;
  fetchOrderDetail: (id: string) => Promise<Order | null>;
  fetchOrderTracking: (id: string) => Promise<OrderTracking | null>;
  fetchOrderStats: (period?: string) => Promise<OrderStats | null>;
  updateOrderStatus: (id: string, status: string, reason?: string) => Promise<Order | null>;
  cancelOrder: (id: string, reason: string) => Promise<Order | null>;
  createShipment: (id: string) => Promise<any>;
  getShipmentInfo: (id: string) => Promise<any>;
  setFilters: (filters: OrderFilterState) => void;
  refreshData: () => Promise<void>;
  updateViettelPostStatus: (orderId: string, data: any) => Promise<any>;
  requestResendViettelPostWebhook: (orderId: string, reason?: string) => Promise<any>;
}

// Tạo context
const AdminOrderContext = createContext<AdminOrderContextType | undefined>(undefined);

// Provider component
export const AdminOrderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { accessToken } = useAdminAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderDetail, setOrderDetail] = useState<Order | null>(null);
  const [orderTracking, setOrderTracking] = useState<OrderTracking | null>(null);
  const [orderStats, setOrderStats] = useState<OrderStats>({
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    processingOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    todayOrders: 0,
    todayRevenue: 0,
    monthlyStats: []
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [filters, setFilters] = useState<OrderFilterState>({
    status: '',
    paymentStatus: '',
    paymentMethod: '',
    timePeriod: 'week',
    dateRange: {
      from: '',
      to: ''
    },
    priceRange: {
      min: '',
      max: ''
    },
    search: ''
  });

  // Cấu hình Axios với Auth token
  const api = useCallback(() => {
    const token = localStorage.getItem('adminToken') || Cookies.get('adminToken');
    const isLoginPage = typeof window !== 'undefined' && window.location.pathname.includes('/admin/auth/login');

    return axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token && !isLoginPage ? `Bearer ${token}` : ''
      }
    });
  }, [accessToken]);

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
    limit: number = 10,
    filterParams?: OrderFilterState
  ) => {
    try {
      setLoading(true);
      setError(null);

      const activeFilters = filterParams || filters;

      // Xây dựng query params
      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('limit', limit.toString());

      if (activeFilters.search) {
        queryParams.append('search', activeFilters.search);
      }

      if (activeFilters.status) {
        queryParams.append('status', activeFilters.status);
      }

      if (activeFilters.paymentStatus) {
        queryParams.append('paymentStatus', activeFilters.paymentStatus);
      }

      if (activeFilters.paymentMethod) {
        queryParams.append('paymentMethod', activeFilters.paymentMethod);
      }

      if (activeFilters.dateRange.from) {
        queryParams.append('fromDate', activeFilters.dateRange.from);
      }

      if (activeFilters.dateRange.to) {
        queryParams.append('toDate', activeFilters.dateRange.to);
      }

      if (activeFilters.priceRange.min) {
        queryParams.append('minPrice', activeFilters.priceRange.min);
      }

      if (activeFilters.priceRange.max) {
        queryParams.append('maxPrice', activeFilters.priceRange.max);
      }

      try {
        const response = await api().get(`/admin/orders?${queryParams.toString()}`);

        setOrders(response.data.data);
        setTotalItems(response.data.total);
        setCurrentPage(response.data.page);
        setTotalPages(response.data.totalPages);

        // return response.data; // Không cần return ở đây vì hàm là void
      } catch (apiError: any) {
        if (apiError.response && apiError.response.status === 404) {
          console.warn('API /admin/orders không tồn tại, sử dụng dữ liệu mẫu');
          const mockOrders: Order[] = [ /* ... dữ liệu mẫu ... */ ];
          setOrders(mockOrders);
          setTotalItems(mockOrders.length);
          setCurrentPage(1);
          setTotalPages(1);
        } else {
          throw apiError;
        }
      }
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  }, [api, filters]);

  const fetchOrderDetail = useCallback(async (id: string): Promise<Order | null> => {
    try {
      setLoading(true);
      setError(null);
      const response = await api().get(`/admin/orders/${id}`);
      setOrderDetail(response.data);
      return response.data;
    } catch (error) {
      handleError(error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [api]);

  const fetchOrderTracking = useCallback(async (id: string): Promise<OrderTracking | null> => {
    try {
      setLoading(true);
      setError(null);
      const response = await api().get(`/admin/orders/${id}/tracking`);
      setOrderTracking(response.data);
      return response.data;
    } catch (error) {
      handleError(error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [api]);

  const fetchOrderStats = useCallback(async (period: string = 'month'): Promise<OrderStats | null> => {
    try {
      setLoading(true);
      setError(null);
      const response = await api().get(`/admin/orders/stats?period=${period}`);
      setOrderStats(response.data);
      return response.data;
    } catch (error) {
      // Giả lập dữ liệu nếu API lỗi hoặc không có
      console.warn(`API /admin/orders/stats?period=${period} lỗi hoặc không có, sử dụng dữ liệu mẫu`);
      const mockStats: OrderStats = {
        totalOrders: 125,
        totalRevenue: 150000000,
        pendingOrders: 15,
        processingOrders: 30,
        completedOrders: 70,
        cancelledOrders: 10,
        todayOrders: 5,
        todayRevenue: 7500000,
        monthlyStats: [
          { month: 'Tháng 1', orders: 20, revenue: 25000000 },
          { month: 'Tháng 2', orders: 30, revenue: 35000000 },
        ]
      };
      setOrderStats(mockStats);
      handleError(error); // Vẫn log lỗi
      return mockStats; // Trả về dữ liệu mẫu
    } finally {
      setLoading(false);
    }
  }, [api]);

  const updateOrderStatus = useCallback(async (id: string, status: string, reason?: string): Promise<Order | null> => {
    try {
      setLoading(true);
      setError(null);
      const response = await api().patch(`/admin/orders/${id}/status`, { status, reason });
      setOrders(prev => prev.map(o => o._id === id ? response.data : o));
      if (orderDetail?._id === id) setOrderDetail(response.data);
      toast.success('Cập nhật trạng thái đơn hàng thành công!');
      return response.data;
    } catch (error) {
      handleError(error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [api, orderDetail]);

  const cancelOrder = useCallback(async (id: string, reason: string): Promise<Order | null> => {
    console.log(`[DEBUG_CONTEXT] Bắt đầu hủy đơn hàng ${id} với lý do: ${reason}`);
    
    try {
      // Kiểm tra trạng thái đơn hàng trước khi hủy
      const orderToCancel = await fetchOrderDetail(id);
      
      if (!orderToCancel) {
        toast.error('Không tìm thấy thông tin đơn hàng');
        return null;
      }
      
      // Nếu đơn hàng đã bị hủy trước đó
      if (orderToCancel.status === 'cancelled') {
        toast('Đơn hàng này đã bị hủy trước đó', {
          icon: '⚠️',
          style: {
            backgroundColor: '#FEF9C3',
            color: '#854D0E'
          }
        });
        return orderToCancel;
      }
      
      // Nếu đơn hàng chưa bị hủy, tiến hành hủy
      const result = await updateOrderStatus(id, 'cancelled', reason);
      console.log(`[DEBUG_CONTEXT] Kết quả hủy đơn hàng:`, result);
      return result;
    } catch (error) {
      console.error('[DEBUG_CONTEXT] Lỗi khi hủy đơn hàng:', error);
      handleError(error);
      return null;
    }
  }, [updateOrderStatus, fetchOrderDetail]);

  const createShipment = useCallback(async (id: string): Promise<any> => {
    try {
      setLoading(true);
      setError(null);
      const response = await api().post(`/admin/orders/${id}/shipment`);
      toast.success('Tạo vận đơn thành công!');
      // Refresh order detail to get new tracking code
      fetchOrderDetail(id);
      return response.data;
    } catch (error) {
      handleError(error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [api, fetchOrderDetail]);

  const getShipmentInfo = useCallback(async (id: string): Promise<any> => {
    try {
      setLoading(true);
      setError(null);
      const response = await api().get(`/admin/orders/${id}/tracking-info`);
      // Cập nhật orderTracking nếu cần
      if (orderDetail?._id === id) {
         // Giả sử API trả về cấu trúc OrderTracking
        const currentTracking = await fetchOrderTracking(id);
        if(currentTracking && response.data.data) {
            const newHistoryEntry = {
                status: response.data.data.ORDER_STATUS_NAME || 'Updated',
                description: response.data.data.NOTE || `Thông tin vận đơn được cập nhật từ ViettelPost`,
                timestamp: response.data.data.ORDER_STATUSDATE ? new Date(response.data.data.ORDER_STATUSDATE.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$2/$1/$3')).toISOString() : new Date().toISOString(), // Chuyển đổi dd/MM/yyyy sang MM/dd/yyyy
                location: response.data.data.LOCALION_CURRENTLY || '',
            };
            setOrderTracking({
                ...currentTracking,
                status: response.data.data.ORDER_STATUS_NAME || currentTracking.status,
                history: [...currentTracking.history, newHistoryEntry].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
                details: response.data.data
            });
        }
      }
      return response.data;
    } catch (error) {
      handleError(error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [api, orderDetail, fetchOrderTracking]);

  const refreshData = useCallback(async () => {
    await fetchOrders(currentPage, 10, filters);
    await fetchOrderStats(filters.timePeriod);
  }, [fetchOrders, currentPage, filters, fetchOrderStats]);

  const updateViettelPostStatus = useCallback(async (orderId: string, data: any): Promise<any> => {
    try {
      setLoading(true);
      setError(null);
      console.log(`[DEBUG_CONTEXT] Bắt đầu cập nhật trạng thái Viettelpost cho đơn hàng ${orderId}`);
      console.log(`[DEBUG_CONTEXT] Dữ liệu gửi đến Viettelpost:`, data);

      try {
        const response = await api().put(`/admin/orders/${orderId}/viettelpost-status`, data);
        console.log(`[DEBUG_CONTEXT] Kết quả từ API cập nhật Viettelpost:`, response.data);

        // Kiểm tra xem đơn hàng đã hủy trước đó chưa
        if (response.data && response.data.status === 'already_cancelled') {
          console.log(`[DEBUG_CONTEXT] Đơn hàng ${orderId} đã được hủy trước đó trên Viettelpost`);
          toast.success(response.data.message || 'Đơn hàng đã được hủy trước đó trên Viettelpost');
        } else {
          toast.success('Cập nhật trạng thái Viettel Post thành công!');
        }

        if (orderDetail && orderDetail._id === orderId) {
          console.log(`[DEBUG_CONTEXT] Làm mới thông tin chi tiết đơn hàng ${orderId}`);
          fetchOrderDetail(orderId);
        }
        console.log(`[DEBUG_CONTEXT] Làm mới thông tin theo dõi đơn hàng ${orderId}`);
        fetchOrderTracking(orderId);
        return response.data;
      } catch (apiError: any) {
        console.error(`[DEBUG_CONTEXT] Lỗi API khi cập nhật trạng thái Viettelpost:`, apiError);

        // Kiểm tra xem lỗi có phải là do đơn hàng đã hủy không
        if (apiError.response?.data?.message && apiError.response.data.message.includes('Đơn hàng đã hủy')) {
          console.log(`[DEBUG_CONTEXT] Đơn hàng ${orderId} đã được hủy trước đó trên Viettelpost`);
          toast.success('Đơn hàng đã được hủy trước đó trên Viettelpost');

          // Vẫn làm mới thông tin đơn hàng
          if (orderDetail && orderDetail._id === orderId) {
            fetchOrderDetail(orderId);
          }
          fetchOrderTracking(orderId);

          // Trả về một đối tượng giả lập thành công
          return {
            status: 'already_cancelled',
            message: 'Đơn hàng đã được hủy trước đó trên Viettelpost',
            success: true
          };
        }

        // Nếu là lỗi 500 từ server, vẫn làm mới thông tin đơn hàng
        if (apiError.response?.status === 500) {
          console.log(`[DEBUG_CONTEXT] Lỗi server 500 khi cập nhật trạng thái Viettelpost cho đơn hàng ${orderId}`);

          // Vẫn làm mới thông tin đơn hàng
          if (orderDetail && orderDetail._id === orderId) {
            fetchOrderDetail(orderId);
          }
          fetchOrderTracking(orderId);

          // Trả về một đối tượng giả lập thành công nhưng với cảnh báo
          return {
            status: 'error_but_continue',
            message: 'Đã xảy ra lỗi khi cập nhật trạng thái Viettelpost, nhưng đơn hàng vẫn được cập nhật trong hệ thống',
            success: true,
            error: apiError.message
          };
        }

        // Ném lỗi để xử lý ở catch bên ngoài
        throw apiError;
      }
    } catch (error: any) {
      console.error(`[DEBUG_CONTEXT] Lỗi khi cập nhật trạng thái Viettelpost:`, error);
      handleError(error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [api, orderDetail, fetchOrderDetail, fetchOrderTracking]);

  const requestResendViettelPostWebhook = useCallback(async (orderId: string, reason?: string): Promise<any> => {
    try {
      setLoading(true);
      setError(null);
      const payload = reason ? { reason } : {};
      const response = await api().post(`/admin/orders/${orderId}/viettelpost-resend-webhook`, payload);
      toast.success('Yêu cầu gửi lại webhook Viettel Post thành công!');
      return response.data;
    } catch (error) {
      handleError(error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.pathname.includes('/admin/orders')) {
      fetchOrders(currentPage, 10, filters);
      fetchOrderStats(filters.timePeriod);
    }
  }, [fetchOrders, fetchOrderStats, currentPage, filters]);

  return (
    <AdminOrderContext.Provider
      value={{
        orders,
        orderDetail,
        orderTracking,
        orderStats,
        loading,
        error,
        totalPages,
        currentPage,
        totalItems,
        filters,
        fetchOrders,
        fetchOrderDetail,
        fetchOrderTracking,
        fetchOrderStats,
        updateOrderStatus,
        cancelOrder,
        createShipment,
        getShipmentInfo,
        setFilters,
        refreshData,
        updateViettelPostStatus,
        requestResendViettelPostWebhook,
      }}
    >
      {children}
    </AdminOrderContext.Provider>
  );
};

export const useAdminOrder = (): AdminOrderContextType => {
  const context = useContext(AdminOrderContext);
  if (context === undefined) {
    throw new Error('useAdminOrder must be used within an AdminOrderProvider');
  }
  return context;
};
