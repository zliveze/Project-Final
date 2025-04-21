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
  userId: string;
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

        return response.data;
      } catch (apiError: any) {
        // Nếu API không tồn tại (404), sử dụng dữ liệu mẫu
        if (apiError.response && apiError.response.status === 404) {
          console.warn('API /admin/orders không tồn tại, sử dụng dữ liệu mẫu');

          // Dữ liệu mẫu cho đơn hàng
          const mockOrders: Order[] = [
            {
              _id: 'ORD-001',
              orderNumber: 'ORD-001',
              userId: 'user123',
              userName: 'Nguyễn Văn A',
              userEmail: 'nguyenvana@example.com',
              items: [],
              subtotal: 1200000,
              tax: 50000,
              shippingFee: 30000,
              totalPrice: 1280000,
              finalPrice: 1250000,
              status: 'completed',
              shippingAddress: {
                fullName: 'Nguyễn Văn A',
                phone: '0987654321',
                addressLine1: '123 Đường ABC',
                ward: 'Phường XYZ',
                district: 'Quận 1',
                province: 'TP. Hồ Chí Minh',
              },
              paymentMethod: 'cod',
              paymentStatus: 'paid',
              createdAt: '2023-06-15T08:30:00.000Z',
              updatedAt: '2023-06-15T10:30:00.000Z'
            },
            {
              _id: 'ORD-002',
              orderNumber: 'ORD-002',
              userId: 'user456',
              userName: 'Trần Thị B',
              userEmail: 'tranthib@example.com',
              items: [],
              subtotal: 850000,
              tax: 0,
              shippingFee: 30000,
              totalPrice: 880000,
              finalPrice: 850000,
              status: 'shipping',
              shippingAddress: {
                fullName: 'Trần Thị B',
                phone: '0987123456',
                addressLine1: '456 Đường DEF',
                ward: 'Phường UVW',
                district: 'Quận 2',
                province: 'TP. Hồ Chí Minh',
              },
              paymentMethod: 'bank_transfer',
              paymentStatus: 'paid',
              createdAt: '2023-06-14T09:15:00.000Z',
              updatedAt: '2023-06-14T11:20:00.000Z'
            },
            {
              _id: 'ORD-003',
              orderNumber: 'ORD-003',
              userId: 'user789',
              userName: 'Lê Văn C',
              userEmail: 'levanc@example.com',
              items: [],
              subtotal: 2100000,
              tax: 0,
              shippingFee: 0,
              totalPrice: 2100000,
              finalPrice: 2100000,
              status: 'pending',
              shippingAddress: {
                fullName: 'Lê Văn C',
                phone: '0912345678',
                addressLine1: '789 Đường GHI',
                ward: 'Phường RST',
                district: 'Quận 3',
                province: 'TP. Hồ Chí Minh',
              },
              paymentMethod: 'stripe',
              paymentStatus: 'pending',
              createdAt: '2023-06-14T14:45:00.000Z',
              updatedAt: '2023-06-14T14:45:00.000Z'
            }
          ];

          setOrders(mockOrders);
          setTotalItems(3);
          setCurrentPage(1);
          setTotalPages(1);

          return {
            data: mockOrders,
            total: 3,
            page: 1,
            limit: 10,
            totalPages: 1
          };
        } else {
          // Nếu lỗi khác, tiếp tục xử lý lỗi
          throw apiError;
        }
      }
    } catch (error) {
      handleError(error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [api, filters]);

  // Lấy chi tiết đơn hàng
  const fetchOrderDetail = useCallback(async (id: string): Promise<Order | null> => {
    try {
      setLoading(true);
      setError(null);

      try {
        const response = await api().get(`/admin/orders/${id}`);
        setOrderDetail(response.data);
        return response.data;
      } catch (apiError: any) {
        // Nếu API không tồn tại (404), sử dụng dữ liệu mẫu
        if (apiError.response && apiError.response.status === 404) {
          console.warn(`API /admin/orders/${id} không tồn tại hoặc đơn hàng không tồn tại, sử dụng dữ liệu mẫu`);

          // Tìm đơn hàng trong danh sách hiện tại
          const existingOrder = orders.find(order => order._id === id);

          if (existingOrder) {
            setOrderDetail(existingOrder);
            return existingOrder;
          }

          // Nếu không tìm thấy, tạo dữ liệu mẫu
          const mockOrder: Order = {
            _id: id,
            orderNumber: id,
            userId: 'user123',
            userName: 'Nguyễn Văn A',
            userEmail: 'nguyenvana@example.com',
            items: [
              {
                productId: 'prod123',
                variantId: 'var456',
                name: 'Sản phẩm mẫu',
                image: 'https://example.com/image.jpg',
                quantity: 2,
                price: 500000
              }
            ],
            subtotal: 1000000,
            tax: 50000,
            shippingFee: 30000,
            totalPrice: 1080000,
            finalPrice: 1050000,
            status: 'completed',
            shippingAddress: {
              fullName: 'Nguyễn Văn A',
              phone: '0987654321',
              addressLine1: '123 Đường ABC',
              ward: 'Phường XYZ',
              district: 'Quận 1',
              province: 'TP. Hồ Chí Minh',
            },
            paymentMethod: 'cod',
            paymentStatus: 'paid',
            createdAt: '2023-06-15T08:30:00.000Z',
            updatedAt: '2023-06-15T10:30:00.000Z'
          };

          setOrderDetail(mockOrder);
          return mockOrder;
        } else {
          // Nếu lỗi khác, tiếp tục xử lý lỗi
          throw apiError;
        }
      }
    } catch (error) {
      handleError(error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [api, orders]);

  // Lấy thông tin theo dõi đơn hàng
  const fetchOrderTracking = useCallback(async (id: string): Promise<OrderTracking | null> => {
    try {
      setLoading(true);
      setError(null);

      try {
        const response = await api().get(`/admin/orders/${id}/tracking`);
        setOrderTracking(response.data);
        return response.data;
      } catch (apiError: any) {
        // Nếu API không tồn tại (404), sử dụng dữ liệu mẫu
        if (apiError.response && apiError.response.status === 404) {
          console.warn(`API /admin/orders/${id}/tracking không tồn tại, sử dụng dữ liệu mẫu`);

          // Dữ liệu mẫu cho thông tin theo dõi đơn hàng
          const mockTracking: OrderTracking = {
            orderId: id,
            status: 'in_transit',
            trackingCode: 'VTP123456789',
            carrier: {
              name: 'Viettel Post',
              trackingNumber: 'VTP123456789',
              trackingUrl: 'https://viettelpost.com.vn/tracking?code=VTP123456789'
            },
            history: [
              {
                status: 'created',
                description: 'Đơn hàng đã được tạo',
                timestamp: '2023-06-15T08:30:00.000Z',
                updatedBy: 'system'
              },
              {
                status: 'processing',
                description: 'Đơn hàng đang được xử lý',
                timestamp: '2023-06-15T09:15:00.000Z',
                updatedBy: 'admin'
              },
              {
                status: 'in_transit',
                description: 'Đơn hàng đang được vận chuyển',
                timestamp: '2023-06-15T10:30:00.000Z',
                location: 'Trung tâm phân phối TP. HCM',
                updatedBy: 'carrier'
              }
            ],
            estimatedDelivery: '2023-06-17T17:00:00.000Z'
          };

          setOrderTracking(mockTracking);
          return mockTracking;
        } else {
          // Nếu lỗi khác, tiếp tục xử lý lỗi
          throw apiError;
        }
      }
    } catch (error) {
      handleError(error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [api]);

  // Lấy thống kê đơn hàng
  const fetchOrderStats = useCallback(async (period: string = 'month'): Promise<OrderStats | null> => {
    try {
      setLoading(true);
      setError(null);

      // Lấy tất cả đơn hàng để tính toán thống kê
      const queryParams = new URLSearchParams();
      queryParams.append('limit', '1000'); // Lấy nhiều đơn hàng để tính toán chính xác hơn

      const response = await api().get(`/admin/orders?${queryParams.toString()}`);
      const allOrders = response.data.data || [];

      // Tính toán thống kê từ dữ liệu đơn hàng
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      // Lọc đơn hàng theo trạng thái
      const pendingOrders = allOrders.filter(order => order.status === 'pending').length;
      const processingOrders = allOrders.filter(order =>
        ['confirmed', 'processing', 'shipping'].includes(order.status)
      ).length;
      const completedOrders = allOrders.filter(order => order.status === 'completed').length;
      const cancelledOrders = allOrders.filter(order => order.status === 'cancelled').length;

      // Tính tổng doanh thu
      const totalRevenue = allOrders.reduce((sum, order) =>
        order.status !== 'cancelled' ? sum + order.finalPrice : sum, 0
      );

      // Đơn hàng hôm nay
      const todayOrders = allOrders.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= today;
      });

      const todayRevenue = todayOrders.reduce((sum, order) =>
        order.status !== 'cancelled' ? sum + order.finalPrice : sum, 0
      );

      // Thống kê theo tháng
      const monthlyStats = [];
      const monthNames = [
        'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
        'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
      ];

      // Tính toán thống kê theo tháng
      const monthlyData = {};

      allOrders.forEach(order => {
        const orderDate = new Date(order.createdAt);
        const monthYear = `${orderDate.getMonth()}-${orderDate.getFullYear()}`;

        if (!monthlyData[monthYear]) {
          monthlyData[monthYear] = {
            month: monthNames[orderDate.getMonth()],
            year: orderDate.getFullYear(),
            orders: 0,
            revenue: 0
          };
        }

        monthlyData[monthYear].orders += 1;
        if (order.status !== 'cancelled') {
          monthlyData[monthYear].revenue += order.finalPrice;
        }
      });

      // Chuyển đổi thành mảng và sắp xếp theo thời gian
      Object.values(monthlyData).forEach((data: any) => {
        monthlyStats.push({
          month: `${data.month} ${data.year}`,
          orders: data.orders,
          revenue: data.revenue
        });
      });

      // Sắp xếp theo thời gian
      monthlyStats.sort((a: any, b: any) => {
        const monthA = monthNames.indexOf(a.month.split(' ')[0]);
        const yearA = parseInt(a.month.split(' ')[1]);
        const monthB = monthNames.indexOf(b.month.split(' ')[0]);
        const yearB = parseInt(b.month.split(' ')[1]);

        if (yearA !== yearB) return yearA - yearB;
        return monthA - monthB;
      });

      // Lấy 6 tháng gần nhất
      const recentMonths = monthlyStats.slice(-6);

      const stats: OrderStats = {
        totalOrders: allOrders.length,
        totalRevenue,
        pendingOrders,
        processingOrders,
        completedOrders,
        cancelledOrders,
        todayOrders: todayOrders.length,
        todayRevenue,
        monthlyStats: recentMonths
      };

      setOrderStats(stats);
      return stats;
    } catch (error) {
      handleError(error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [api]);

  // Cập nhật trạng thái đơn hàng
  const updateOrderStatus = useCallback(async (
    id: string,
    status: string,
    reason?: string
  ): Promise<Order | null> => {
    try {
      setLoading(true);
      setError(null);

      const payload = { status };
      if (reason) {
        payload['reason'] = reason;
      }

      try {
        const response = await api().patch(`/admin/orders/${id}/status`, payload);

        // Cập nhật lại danh sách đơn hàng
        setOrders(prevOrders =>
          prevOrders.map(order =>
            order._id === id ? { ...order, status } : order
          )
        );

        // Cập nhật chi tiết đơn hàng nếu đang xem
        if (orderDetail && orderDetail._id === id) {
          setOrderDetail({ ...orderDetail, status });
        }

        toast.success('Cập nhật trạng thái đơn hàng thành công');

        return response.data;
      } catch (apiError: any) {
        // Nếu API không tồn tại (404), vẫn cập nhật UI
        if (apiError.response && apiError.response.status === 404) {
          console.warn(`API /admin/orders/${id}/status không tồn tại, chỉ cập nhật UI`);

          // Cập nhật lại danh sách đơn hàng
          setOrders(prevOrders =>
            prevOrders.map(order =>
              order._id === id ? { ...order, status } : order
            )
          );

          // Cập nhật chi tiết đơn hàng nếu đang xem
          if (orderDetail && orderDetail._id === id) {
            setOrderDetail({ ...orderDetail, status });
          }

          toast.success('Cập nhật trạng thái đơn hàng thành công (chế độ demo)');

          // Trả về đơn hàng đã cập nhật
          const updatedOrder = orders.find(order => order._id === id);
          if (updatedOrder) {
            return { ...updatedOrder, status };
          }

          return null;
        } else {
          // Nếu lỗi khác, tiếp tục xử lý lỗi
          throw apiError;
        }
      }
    } catch (error) {
      handleError(error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [api, orderDetail, orders]);

  // Hủy đơn hàng
  const cancelOrder = useCallback(async (
    id: string,
    reason: string
  ): Promise<Order | null> => {
    try {
      setLoading(true);
      setError(null);

      try {
        const response = await api().patch(`/admin/orders/${id}/status`, {
          status: 'cancelled',
          reason
        });

        // Cập nhật lại danh sách đơn hàng
        setOrders(prevOrders =>
          prevOrders.map(order =>
            order._id === id ? { ...order, status: 'cancelled' } : order
          )
        );

        // Cập nhật chi tiết đơn hàng nếu đang xem
        if (orderDetail && orderDetail._id === id) {
          setOrderDetail({ ...orderDetail, status: 'cancelled' });
        }

        toast.success('Hủy đơn hàng thành công');

        return response.data;
      } catch (apiError: any) {
        // Nếu API không tồn tại (404), vẫn cập nhật UI
        if (apiError.response && apiError.response.status === 404) {
          console.warn(`API /admin/orders/${id}/status không tồn tại, chỉ cập nhật UI`);

          // Cập nhật lại danh sách đơn hàng
          setOrders(prevOrders =>
            prevOrders.map(order =>
              order._id === id ? { ...order, status: 'cancelled' } : order
            )
          );

          // Cập nhật chi tiết đơn hàng nếu đang xem
          if (orderDetail && orderDetail._id === id) {
            setOrderDetail({ ...orderDetail, status: 'cancelled' });
          }

          toast.success('Hủy đơn hàng thành công (chế độ demo)');

          // Trả về đơn hàng đã cập nhật
          const updatedOrder = orders.find(order => order._id === id);
          if (updatedOrder) {
            return { ...updatedOrder, status: 'cancelled' };
          }

          return null;
        } else {
          // Nếu lỗi khác, tiếp tục xử lý lỗi
          throw apiError;
        }
      }
    } catch (error) {
      handleError(error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [api, orderDetail, orders]);

  // Tạo vận đơn
  const createShipment = useCallback(async (id: string): Promise<any> => {
    try {
      setLoading(true);
      setError(null);

      try {
        const response = await api().post(`/admin/orders/${id}/shipment`);

        toast.success('Tạo vận đơn thành công');

        return response.data;
      } catch (apiError: any) {
        // Nếu API không tồn tại (404), sử dụng dữ liệu mẫu
        if (apiError.response && apiError.response.status === 404) {
          console.warn(`API /admin/orders/${id}/shipment không tồn tại, sử dụng dữ liệu mẫu`);

          // Cập nhật trạng thái đơn hàng thành 'shipping'
          setOrders(prevOrders =>
            prevOrders.map(order =>
              order._id === id ? { ...order, status: 'shipping', trackingCode: 'VTP123456789' } : order
            )
          );

          // Cập nhật chi tiết đơn hàng nếu đang xem
          if (orderDetail && orderDetail._id === id) {
            setOrderDetail({ ...orderDetail, status: 'shipping', trackingCode: 'VTP123456789' });
          }

          toast.success('Tạo vận đơn thành công (chế độ demo)');

          return {
            success: true,
            trackingCode: 'VTP123456789',
            carrier: 'Viettel Post',
            estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
          };
        } else {
          // Nếu lỗi khác, tiếp tục xử lý lỗi
          throw apiError;
        }
      }
    } catch (error) {
      handleError(error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [api, orderDetail, orders]);

  // Lấy thông tin vận đơn
  const getShipmentInfo = useCallback(async (id: string): Promise<any> => {
    try {
      setLoading(true);
      setError(null);

      try {
        const response = await api().get(`/admin/orders/${id}/tracking-info`);
        return response.data;
      } catch (apiError: any) {
        // Nếu API không tồn tại (404), sử dụng dữ liệu mẫu
        if (apiError.response && apiError.response.status === 404) {
          console.warn(`API /admin/orders/${id}/tracking-info không tồn tại, sử dụng dữ liệu mẫu`);

          // Dữ liệu mẫu cho thông tin vận đơn
          return {
            success: true,
            data: {
              trackingCode: 'VTP123456789',
              carrier: 'Viettel Post',
              status: 'in_transit',
              estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
              history: [
                {
                  status: 'created',
                  description: 'Đơn hàng đã được tạo',
                  timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
                  location: 'Hệ thống'
                },
                {
                  status: 'processing',
                  description: 'Đơn hàng đang được xử lý',
                  timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
                  location: 'Kho hàng'
                },
                {
                  status: 'in_transit',
                  description: 'Đơn hàng đang được vận chuyển',
                  timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
                  location: 'Trung tâm phân phối'
                }
              ]
            }
          };
        } else {
          // Nếu lỗi khác, tiếp tục xử lý lỗi
          throw apiError;
        }
      }
    } catch (error) {
      handleError(error);
      return null;
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
    // Chỉ tải dữ liệu khi đang ở trang admin/orders
    if (typeof window !== 'undefined' && window.location.pathname.includes('/admin/orders')) {
      fetchOrders();
      fetchOrderStats();
    }
  }, [fetchOrders, fetchOrderStats]);

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
      }}
    >
      {children}
    </AdminOrderContext.Provider>
  );
};

// Hook để sử dụng context
export const useAdminOrder = (): AdminOrderContextType => {
  const context = useContext(AdminOrderContext);
  if (context === undefined) {
    throw new Error('useAdminOrder must be used within an AdminOrderProvider');
  }
  return context;
};
