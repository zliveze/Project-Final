import React, { createContext, useState, useContext, useCallback, ReactNode, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useAdminAuth } from './AdminAuthContext';

// Biến môi trường kiểm soát logging (cho phép sử dụng biến môi trường từ .env hoặc mặc định là 'false' trong production)
const enableDetailedLogs = process.env.NEXT_PUBLIC_ENABLE_DETAILED_LOGS === 'true' || false;

/**
 * Hàm logging an toàn - chỉ hiển thị trong môi trường development hoặc khi được cấu hình
 * @param message Thông điệp cần log
 * @param data Dữ liệu kèm theo (sẽ được lọc thông tin nhạy cảm)
 * @param level Mức độ log ('info', 'warn', 'error')
 */
const safeLog = (message: string, data?: unknown, level: 'info' | 'warn' | 'error' = 'info') => {
  // Chỉ log khi được bật trong môi trường development hoặc cấu hình rõ ràng
  if (!enableDetailedLogs) return;

  // Lọc bỏ một số message không cần thiết
  if (message.includes('Calling API URL') ||
      message.includes('API Response status') ||
      message.includes('Processed user data')) {
    return;
  }

  const prefix = '[AdminUserContext]';

  if (data) {
    // Loại bỏ thông tin nhạy cảm khi log
    const sanitizedData = typeof data === 'object' ? sanitizeData(data) : data;

    switch (level) {
      case 'warn':
        console.warn(`${prefix} ${message}`, sanitizedData);
        break;
      case 'error':
        console.error(`${prefix} ${message}`, sanitizedData);
        break;
      default:
        console.log(`${prefix} ${message}`, sanitizedData);
    }
  } else {
    switch (level) {
      case 'warn':
        console.warn(`${prefix} ${message}`);
        break;
      case 'error':
        console.error(`${prefix} ${message}`);
        break;
      default:
        console.log(`${prefix} ${message}`);
    }
  }
};

/**
 * Hàm xử lý dữ liệu để loại bỏ thông tin nhạy cảm
 * @param data Dữ liệu cần được lọc
 * @returns Dữ liệu đã được lọc thông tin nhạy cảm
 */
const sanitizeData = (data: unknown): unknown => {
  if (!data) return data;

  // Clone để không làm thay đổi dữ liệu gốc
  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item));
  }

  if (typeof data === 'object') {
    const sanitized = { ...data } as Record<string, unknown>;

    // Loại bỏ token và thông tin nhạy cảm
    const sensitiveFields = ['token', 'accessToken', 'refreshToken', 'password', 'Authorization', 'jwt'];

    sensitiveFields.forEach(field => {
      if (field.toLowerCase() in sanitized) sanitized[field.toLowerCase()] = '[REDACTED]';
      if (field in sanitized) sanitized[field] = '[REDACTED]';
    });

    // Xử lý đệ quy các đối tượng con
    Object.keys(sanitized).forEach(key => {
      if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = sanitizeData(sanitized[key]);
      }
    });

    return sanitized;
  }

  return data;
};

// Định nghĩa kiểu dữ liệu
export interface User {
  _id: string; // Changed from id to _id to match UserTable
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  createdAt: string;
  customerLevel?: string;
  monthlyOrders?: number;
  totalOrders?: number;
  lastOrderDate?: string;
  pendingReviews?: number; // Số lượng đánh giá đang chờ duyệt
}

export interface OrderSummary {
  _id: string;
  date: string;
  status: string;
  totalAmount: number;
}

export interface WishlistItem {
  productId: {
    _id: string;
    name: string;
    images: string[];
    price: number;
    status: string;
    variants?: Record<string, unknown>[];
  };
  variantId?: string;
}

// Import Address interface from UserDetailModal
interface Address {
  addressId: string;
  addressLine: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  isDefault: boolean;
}

export interface DetailedUser {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  addresses: Address[];
  wishlist: WishlistItem[];
  avatar?: string;
  orders?: OrderSummary[];
  customerLevel?: string;
  monthlyOrders?: number;
  totalOrders?: number;
  lastOrderDate?: string;
}

// Định nghĩa kiểu dữ liệu cho cache trang
interface PageCache {
  [key: string]: {
    users: User[];
    timestamp: number;
    totalItems: number;
    currentPage: number;
  }
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  blockedUsers: number;
  monthlyCounts: { month: string; count: number; growthRate?: number }[];
  totalGrowth?: number;
  activeGrowth?: number;
  inactiveGrowth?: number;
  blockedGrowth?: number;
}

export interface AdminUserContextType {
  users: User[];
  userDetail: DetailedUser | null;
  stats: UserStats;
  loading: boolean;
  error: string | null;
  totalPages: number;
  currentPage: number;

  fetchUsers: (page?: number, limit?: number, search?: string, status?: string, role?: string, startDate?: string, endDate?: string, forceReload?: boolean) => Promise<void>;
  fetchUserStats: () => Promise<UserStats | null>;
  getUserDetail: (id: string) => Promise<DetailedUser | null>;
  getUserOrders: (userId: string) => Promise<OrderSummary[]>;
  updateUser: (id: string, userData: Record<string, unknown>) => Promise<User | null>;
  deleteUser: (id: string) => Promise<boolean>;
  resetPassword: (id: string, newPassword: string) => Promise<boolean>;
  updateUserStatus: (id: string, status: string) => Promise<User | null>;
  updateUserRole: (id: string, role: string) => Promise<User | null>;
  updateUserCustomerLevel: (id: string, customerLevel: string) => Promise<User | null>;
  createUser: (userData: Record<string, unknown>) => Promise<User | null>;
}

const AdminUserContext = createContext<AdminUserContextType | undefined>(undefined);

export const AdminUserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { accessToken } = useAdminAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [userDetail, setUserDetail] = useState<DetailedUser | null>(null);
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    blockedUsers: 0,
    monthlyCounts: [],
    totalGrowth: 0,
    activeGrowth: 0,
    inactiveGrowth: 0,
    blockedGrowth: 0
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  // Thêm state cho cache trang để lưu trữ dữ liệu đã tải
  const [pageCache, setPageCache] = useState<PageCache>({});
  // Đặt thời gian sống cho cache (20 phút thay vì 5 phút)
  const CACHE_TTL = 20 * 60 * 1000;
  // Đặt số trang cần được tải trước (preload) - tăng từ 2 lên 3
  const PRELOAD_PAGES = 3;
  // Thêm biến để kiểm soát số lần retry khi gặp lỗi tải trước
  const MAX_PRELOAD_RETRIES = 2;
  // Thêm biến để kiểm soát việc có đang preload hay không
  const [isPreloading, setIsPreloading] = useState<{[key: string]: boolean}>({});

  // Cấu hình Axios với Auth token
  const api = useCallback(() => {
    const token = localStorage.getItem('adminToken');
    const isLoginPage = typeof window !== 'undefined' && window.location.pathname.includes('/admin/auth/login');

    return axios.create({
      baseURL: '', // Đã có URL đầy đủ trong mỗi hàm
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token && !isLoginPage ? `Bearer ${token}` : ''
      }
    });
  }, []);

  // Xử lý lỗi chung
  const handleError = (error: unknown) => {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    safeLog('API Error', { message: err.message || 'Unknown error' }, 'error');
    const errorMessage = err.response?.data?.message || 'Đã xảy ra lỗi khi thực hiện yêu cầu';
    setError(errorMessage);
    toast.error(errorMessage);
    return errorMessage;
  };

  // Thêm function mới để chỉ lấy thống kê user mà không lấy danh sách đầy đủ
  const fetchUserStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      safeLog('Calling stats API');

      if (!localStorage.getItem('adminToken')) {
        safeLog('Token không tồn tại trong localStorage', null, 'error');
        toast.error('Không tìm thấy token xác thực, vui lòng đăng nhập lại');
        return null;
      }

      // Thay đổi URL từ '/api/admin/users/stats' thành URL trực tiếp đến backend
      const response = await api().get(`${process.env.NEXT_PUBLIC_API_URL || 'https://backendyumin.vercel.app'}/admin/users/stats`);
      safeLog('Stats API Response status', response.status);

      const { data } = response;

      // Xử lý dữ liệu thống kê
      if (data) {
        safeLog('User stats data received', data);

        // Cập nhật tất cả các trường thống kê
        setStats({
          totalUsers: data.totalUsers || 0,
          activeUsers: data.activeUsers || 0,
          inactiveUsers: data.inactiveUsers || 0,
          blockedUsers: data.blockedUsers || 0,
          monthlyCounts: data.monthlyCounts || [],
          totalGrowth: data.totalGrowth || 0,
          activeGrowth: data.activeGrowth || 0,
          inactiveGrowth: data.inactiveGrowth || 0,
          blockedGrowth: data.blockedGrowth || 0
        });
      }

      setLoading(false);
      return data;
    } catch (error) {
      handleError(error);
      setLoading(false);
      return null;
    }
  }, [api]);

  // Log khởi tạo và cấu hình
  useEffect(() => {
    safeLog('AdminUserContext initialized');
    safeLog('API URL', process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000');
  }, [accessToken]);



  // Hàm kiểm tra cache trang có hợp lệ không
  const isPageCacheValid = useCallback((cacheKey: string) => {
    if (!pageCache[cacheKey]) return false;

    const now = Date.now();
    const cacheTimestamp = pageCache[cacheKey].timestamp;

    // Cache hợp lệ nếu chưa hết hạn
    return (now - cacheTimestamp) < CACHE_TTL;
  }, [pageCache, CACHE_TTL]);

  // Tạo cache key dựa vào tham số trang
  const createCacheKey = useCallback((
    page: number,
    limit: number,
    search?: string,
    status: string = 'all',
    role: string = 'all',
    startDate?: string,
    endDate?: string
  ) => {
    return `${page}_${limit}_${search || ''}_${status}_${role}_${startDate || ''}_${endDate || ''}`;
  }, []);

  // Lấy danh sách đơn hàng của người dùng
  const getUserOrders = useCallback(async (userId: string): Promise<OrderSummary[]> => {
    try {
      setLoading(true);
      setError(null);

      // Gọi API để lấy danh sách đơn hàng của user
      const response = await api().get(`/api/admin/orders?userId=${userId}&limit=100`);

      // Chuyển đổi dữ liệu từ API thành định dạng OrderSummary
      const orders: OrderSummary[] = response.data.data.map((order: Record<string, unknown>) => ({
        _id: order._id as string,
        date: new Date(order.createdAt as string).toLocaleDateString('vi-VN'),
        status: order.status as string,
        totalAmount: (order.finalPrice as number) || (order.totalPrice as number)
      }));

      return orders;
    } catch (error) {
      handleError(error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [api]);

  // Lấy chi tiết người dùng
  const getUserDetail = useCallback(async (id: string): Promise<DetailedUser | null> => {
    // Thêm kiểm tra chặt chẽ hơn: Bỏ qua nếu id không phải là ObjectId hợp lệ hoặc là 'stats'
    // (Mongoose ObjectId thường là 24 ký tự hex)
    const objectIdPattern = /^[0-9a-fA-F]{24}$/;
    if (id === 'stats' || !objectIdPattern.test(id)) {
      safeLog(`Bỏ qua gọi API getUserDetail với id không hợp lệ: ${id}`, null, 'warn');
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      // Lấy thông tin chi tiết người dùng
      const response = await api().get(`/api/admin/users/${id}`);

      const userData = response.data;

      try {
        // Lấy danh sách đơn hàng của người dùng
        const orders = await getUserOrders(id);

        // Tính toán thông tin bổ sung về đơn hàng
        const totalOrders = orders.length;
        const lastOrderDate = orders.length > 0 ?
          orders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date :
          undefined;

        // Tính số đơn hàng trong tháng hiện tại
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();
        const monthlyOrders = orders.filter(order => {
          const orderDate = new Date(order.date);
          return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
        }).length;

        // Cập nhật userData với thông tin đơn hàng
        userData.orders = orders;
        userData.totalOrders = totalOrders;
        userData.lastOrderDate = lastOrderDate;
        userData.monthlyOrders = monthlyOrders;
      } catch (orderError) {
        console.error('Lỗi khi lấy đơn hàng của người dùng:', orderError);
        // Vẫn tiếp tục với thông tin người dùng, không có đơn hàng
        userData.orders = [];
      }

      setUserDetail(userData);
      return userData;
    } catch (err) {
      handleError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [api, getUserOrders]);

  // Cập nhật thông tin người dùng
  const updateUser = useCallback(async (id: string, userData: Record<string, unknown>): Promise<User | null> => {
    try {
      setLoading(true);
      setError(null);

      console.log('Đang gửi request cập nhật user:', {
        id,
        userData
      });

      const response = await api().patch(`/api/admin/users/${id}`, userData);

      console.log('Phản hồi từ server:', response.data);

      if (!response.data) {
        throw new Error('Không nhận được dữ liệu từ server');
      }

      // Cập nhật state users nếu người dùng đã được chỉnh sửa trong danh sách
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user._id === id
            ? {
                ...user,
                name: response.data.name,
                email: response.data.email,
                phone: response.data.phone,
                role: response.data.role,
                status: response.data.status
              }
            : user
        )
      );

      // Cập nhật cache
      setPageCache(prevCache => {
        const newCache = { ...prevCache };

        // Duyệt qua tất cả các trang trong cache
        Object.keys(newCache).forEach(cacheKey => {
          const pageData = newCache[cacheKey];
          // Cập nhật user trong cache
          const updatedUsers = pageData.users.map(user =>
            user._id === id
              ? {
                  ...user,
                  name: response.data.name,
                  email: response.data.email,
                  phone: response.data.phone,
                  role: response.data.role,
                  status: response.data.status
                }
              : user
          );
          // Cập nhật cache
          newCache[cacheKey] = {
            ...pageData,
            users: updatedUsers
          };
        });

        return newCache;
      });

      toast.success('Cập nhật thông tin người dùng thành công!');
      return response.data;
    } catch (err) {
      console.error('Lỗi khi cập nhật user:', err);
      handleError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [api]);

  // Xóa người dùng - cần cập nhật cả cache
  const deleteUser = useCallback(async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      await api().delete(`/api/admin/users/${id}`);

      // Cập nhật state users để loại bỏ người dùng đã xóa
      setUsers(prevUsers => prevUsers.filter(user => user._id !== id));

      // Cập nhật stats
      setStats(prevStats => ({
        ...prevStats,
        totalUsers: prevStats.totalUsers - 1
      }));

      // Cập nhật cache để loại bỏ người dùng đã xóa khỏi tất cả các trang đã cache
      setPageCache(prevCache => {
        const newCache = { ...prevCache };

        // Duyệt qua tất cả các trang trong cache
        Object.keys(newCache).forEach(cacheKey => {
          const pageData = newCache[cacheKey];
          // Lọc bỏ user đã xóa
          const filteredUsers = pageData.users.filter(user => user._id !== id);
          // Cập nhật cache
          newCache[cacheKey] = {
            ...pageData,
            users: filteredUsers,
            totalItems: pageData.totalItems - 1
          };
        });

        return newCache;
      });

      toast.success('Xóa người dùng thành công!');
      return true;
    } catch (err) {
      handleError(err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [api]);

  // Đặt lại mật khẩu người dùng
  const resetPassword = useCallback(async (id: string, newPassword: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      await api().post(`/api/admin/users/reset-password/${id}`, { newPassword });

      toast.success('Đặt lại mật khẩu thành công!');
      return true;
    } catch (err) {
      handleError(err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [api]);

  // Cập nhật trạng thái người dùng - cần cập nhật cả cache
  const updateUserStatus = useCallback(async (id: string, status: string): Promise<User | null> => {
    try {
      setLoading(true);
      setError(null);

      const response = await api().patch(`/api/admin/users/status/${id}`, { status });

      // Cập nhật state users
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user._id === id
            ? { ...user, status: response.data.status }
            : user
        )
      );

      // Cập nhật cache
      setPageCache(prevCache => {
        const newCache = { ...prevCache };

        // Duyệt qua tất cả các trang trong cache
        Object.keys(newCache).forEach(cacheKey => {
          const pageData = newCache[cacheKey];
          // Cập nhật trạng thái user trong cache
          const updatedUsers = pageData.users.map(user =>
            user._id === id
              ? { ...user, status: response.data.status }
              : user
          );
          // Cập nhật cache
          newCache[cacheKey] = {
            ...pageData,
            users: updatedUsers
          };
        });

        return newCache;
      });

      toast.success('Cập nhật trạng thái người dùng thành công!');
      return response.data;
    } catch (err) {
      handleError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [api]);

  // Cập nhật vai trò người dùng - cần cập nhật cả cache
  const updateUserRole = useCallback(async (id: string, role: string): Promise<User | null> => {
    try {
      setLoading(true);
      setError(null);

      const response = await api().patch(`/api/admin/users/role/${id}`, { role });

      // Cập nhật state users
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user._id === id
            ? { ...user, role: response.data.role }
            : user
        )
      );

      // Cập nhật cache
      setPageCache(prevCache => {
        const newCache = { ...prevCache };

        // Duyệt qua tất cả các trang trong cache
        Object.keys(newCache).forEach(cacheKey => {
          const pageData = newCache[cacheKey];
          // Cập nhật vai trò user trong cache
          const updatedUsers = pageData.users.map(user =>
            user._id === id
              ? { ...user, role: response.data.role }
              : user
          );
          // Cập nhật cache
          newCache[cacheKey] = {
            ...pageData,
            users: updatedUsers
          };
        });

        return newCache;
      });

      toast.success('Cập nhật vai trò người dùng thành công!');
      return response.data;
    } catch (err) {
      handleError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [api]);

  // Cập nhật cấp độ khách hàng
  const updateUserCustomerLevel = useCallback(async (id: string, customerLevel: string): Promise<User | null> => {
    try {
      setLoading(true);
      setError(null);

      const response = await api().patch(`/api/admin/users/customer-level/${id}`, { customerLevel });

      // Cập nhật state users
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user._id === id
            ? { ...user, customerLevel: response.data.customerLevel }
            : user
        )
      );

      // Cập nhật cache
      setPageCache(prevCache => {
        const newCache = { ...prevCache };

        // Duyệt qua tất cả các trang trong cache
        Object.keys(newCache).forEach(cacheKey => {
          const pageData = newCache[cacheKey];
          // Cập nhật cấp độ khách hàng trong cache
          const updatedUsers = pageData.users.map(user =>
            user._id === id
              ? { ...user, customerLevel: response.data.customerLevel }
              : user
          );
          // Cập nhật cache
          newCache[cacheKey] = {
            ...pageData,
            users: updatedUsers
          };
        });

        return newCache;
      });

      toast.success('Cập nhật cấp độ khách hàng thành công!');
      return response.data;
    } catch (err) {
      handleError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [api]);

  // Hàm tải trước các trang kế tiếp và các trang trước đó để cải thiện UX
  const preloadAdjacentPages = useCallback(async (
    currentPage: number,
    limit: number,
    search?: string,
    status: string = 'all',
    role: string = 'all',
    startDate?: string,
    endDate?: string
  ) => {
    // Xử lý search term giống như trong fetchUsers
    const cleanedSearch = search ? search.trim() : '';

    // Danh sách các trang cần tải
    const pagesToPreload = [];

    // Tải các trang kế tiếp
    for (let i = 1; i <= PRELOAD_PAGES; i++) {
      const nextPage = currentPage + i;
      if (nextPage <= totalPages) {
        pagesToPreload.push(nextPage);
      }
    }

    // Tải các trang trước đó (với độ ưu tiên thấp hơn)
    for (let i = 1; i <= PRELOAD_PAGES/2; i++) {
      const prevPage = currentPage - i;
      if (prevPage > 0) {
        pagesToPreload.push(prevPage);
      }
    }

    // Đảm bảo rằng mỗi trang preload không gây ảnh hưởng đến UI state
    // Sử dụng một hàm riêng để tải dữ liệu mà không cập nhật UI state
    const preloadPage = async (page: number, retryCount = 0, searchTerm: string = '') => {
      // Tạo key cho cache sử dụng cleanedSearch
      const pageKey = createCacheKey(page, limit, searchTerm, status, role, startDate, endDate);

      // Bỏ qua nếu trang đã được cache hoặc đang được preload
      if (isPageCacheValid(pageKey) || isPreloading[pageKey]) {
        return;
      }

      // Đánh dấu trang này đang được preload
      setIsPreloading((prev) => ({
        ...prev,
        [pageKey]: true
      }));

      try {
        safeLog(`Preloading page ${page} with URL: /api/admin/users?page=${page}&limit=${limit}${searchTerm ? `&search=${searchTerm}` : ''}${status !== 'all' ? `&status=${status}` : ''}${role !== 'all' ? `&role=${role}` : ''}${startDate ? `&startDate=${startDate}` : ''}${endDate ? `&endDate=${endDate}` : ''}`);

        // Gọi API để tải trang, nhưng không cập nhật UI
        const queryParams = new URLSearchParams();
        queryParams.append('page', page.toString());
        queryParams.append('limit', limit.toString());

        if (searchTerm) queryParams.append('search', searchTerm);
        if (status !== 'all') queryParams.append('status', status);
        if (role !== 'all') queryParams.append('role', role);

        if (startDate) queryParams.append('startDate', startDate);
        if (endDate) queryParams.append('endDate', endDate);

        const url = `/api/admin/users?${queryParams.toString()}`;

        // Gọi API nhưng không hiển thị loading hoặc thông báo lỗi
        safeLog(`Preloading page ${page} with URL: ${url}`);

        const response = await api().get(url);
        const { data } = response;

        // Cache kết quả nếu thành công
        if (data?.users) {
          setPageCache(prevCache => ({
            ...prevCache,
            [pageKey]: {
              users: data.users || [],
              timestamp: Date.now(),
              totalItems: data.totalUsers || 0,
              currentPage: data.currentPage || 1
            }
          }));

          safeLog(`Successfully preloaded page ${page} with ${data.users.length} users`);
        }
      } catch (error) {
        // Thử lại nếu chưa đạt số lần thử tối đa
        safeLog(`Failed to preload page ${page}, retryCount: ${retryCount}`, error, 'warn');

        if (retryCount < MAX_PRELOAD_RETRIES) {
          // Chờ 1 giây trước khi thử lại (truyền lại searchTerm)
          setTimeout(() => {
            preloadPage(page, retryCount + 1, searchTerm);
          }, 1000);
        }
      } finally {
        // Đánh dấu đã hoàn thành preload
        setIsPreloading(prev => {
          const updated = {...prev};
          delete updated[pageKey];
          return updated;
        });
      }
    };

    // Thực thi preload mỗi trang theo thứ tự để tránh quá tải
    for (const page of pagesToPreload) {
      setTimeout(() => {
        // Gọi preloadPage với cleanedSearch thay vì search
        preloadPage(page, 0, cleanedSearch);
      }, 300 * pagesToPreload.indexOf(page)); // Phân tán các request để tránh gây tải lên server
    }
  }, [api, createCacheKey, isPageCacheValid, totalPages, isPreloading, MAX_PRELOAD_RETRIES]);

  // Tạo người dùng mới
  const createUser = useCallback(async (userData: Record<string, unknown>): Promise<User | null> => {
    try {
      setLoading(true);
      setError(null);

      const response = await api().post(`/api/admin/users/create`, userData);

      // Thêm người dùng mới vào state
      setUsers(prevUsers => [...prevUsers, {
        _id: response.data._id,
        name: response.data.name,
        email: response.data.email,
        phone: response.data.phone || '',
        role: response.data.role,
        status: response.data.status,
        createdAt: response.data.createdAt,
      }]);

      // Cập nhật thống kê
      setStats(prevStats => ({
        ...prevStats,
        totalUsers: prevStats.totalUsers + 1,
        activeUsers: response.data.status === 'active' ? prevStats.activeUsers + 1 : prevStats.activeUsers,
      }));

      // Làm mới cache (xóa cache để buộc load lại dữ liệu)
      setPageCache({});

      toast.success('Tạo người dùng mới thành công!');
      return response.data;
    } catch (err) {
      handleError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [api]);

  // Lấy danh sách người dùng với bộ lọc và phân trang
  const fetchUsers = useCallback(async (
    page: number = 1,
    limit: number = 10,
    search?: string,
    status: string = 'all',
    role: string = 'all',
    startDate?: string,
    endDate?: string,
    forceReload: boolean = false // Thêm tham số để bỏ qua cache
  ) => {
    try {
      // Kiểm tra nếu đang ở trang login hoặc dashboard thì không cần gọi API đầy đủ
      const isLoginPage = typeof window !== 'undefined' && window.location.pathname.includes('/admin/auth/login');
      const isDashboard = typeof window !== 'undefined' && window.location.pathname === '/admin/dashboard';

      if (isLoginPage) {
        safeLog('Đang ở trang login, bỏ qua gọi API fetchUsers');
        return null;
      }

      if (isDashboard) {
        safeLog('Đang ở trang dashboard, chỉ gọi API fetchUserStats thay vì fetchUsers đầy đủ');
        return fetchUserStats();
      }

      // Xử lý search term trước khi tạo cache key
      const cleanedSearch = search ? search.trim() : '';

      // Tạo key cho cache dựa vào tham số
      const cacheKey = createCacheKey(page, limit, cleanedSearch, status, role, startDate, endDate);
      safeLog(`Kiểm tra cache cho key: ${cacheKey}`);

      // Đặt loading = true
      setLoading(true);
      setError(null);

      // Kiểm tra cache và sử dụng nếu hợp lệ VÀ không yêu cầu forceReload
      if (!forceReload && isPageCacheValid(cacheKey)) {
        safeLog(`Đã tìm thấy dữ liệu hợp lệ trong cache cho trang ${page}`);
        const cachedData = pageCache[cacheKey];

        // Đảm bảo đặt loading = false ngay lập tức khi sử dụng cache
        setLoading(false);

        // Thêm debug log để theo dõi quá trình sử dụng cache
        safeLog(`Sử dụng cache cho trang ${page}, dữ liệu có ${cachedData.users.length} người dùng`,
          { usersCount: cachedData.users.length, timestamp: new Date() });

        // Cập nhật states với dữ liệu từ cache
        setUsers(cachedData.users);
        setCurrentPage(cachedData.currentPage);
        setTotalPages(cachedData.totalItems ? Math.ceil(cachedData.totalItems / limit) : totalPages);

        safeLog(`Đã cập nhật UI từ cache cho trang ${page} với ${cachedData.users.length} users`);

        // Sau khi lấy từ cache, tiến hành tải trước các trang kế tiếp
        // Tách preload thành setTimeout để không chặn main thread
        setTimeout(() => {
          if (!Object.values(isPreloading).some(Boolean)) {
            // Chỉ preload khi không có preload nào đang chạy
            preloadAdjacentPages(page, limit, cleanedSearch, status, role, startDate, endDate);
          }
        }, 0);

        return {
          users: cachedData.users,
          totalItems: cachedData.totalItems,
          currentPage: cachedData.currentPage,
          totalPages: cachedData.totalItems ? Math.ceil(cachedData.totalItems / limit) : totalPages
        };
      }

      // Nếu không có trong cache hoặc forceReload=true, tiến hành gọi API
      safeLog(`${forceReload ? 'Force reload được yêu cầu' : 'Không tìm thấy cache hợp lệ'} cho trang ${page}, đang gọi API...`);

      // Xây dựng query params để gọi API
      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('limit', limit.toString());

      if (cleanedSearch) {
        // Không cần mã hóa ở đây, vì URLSearchParams sẽ tự động mã hóa
        queryParams.append('search', cleanedSearch);
        safeLog(`Tìm kiếm với từ khóa: "${cleanedSearch}"`);
      }

      if (status !== 'all') queryParams.append('status', status);
      if (role !== 'all') queryParams.append('role', role);

      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);

      const url = `/api/admin/users?${queryParams.toString()}`;
      safeLog('Calling API URL', url);

      if (!localStorage.getItem('adminToken')) {
        safeLog('Token không tồn tại trong localStorage', null, 'error');
        toast.error('Không tìm thấy token xác thực, vui lòng đăng nhập lại');
        setLoading(false);
        return null;
      }

      const response = await api().get(url);
      safeLog('API Response status', response.status);

      const { data } = response;

      // Xử lý dữ liệu phản hồi
      if (data) {
        safeLog('Processed user data', { totalItems: data.totalUsers, currentPage: data.currentPage, totalPages: data.totalPages });

        // Cập nhật cache với dữ liệu mới
        setPageCache(prevCache => ({
          ...prevCache,
          [cacheKey]: {
            users: data.users || [],
            timestamp: Date.now(),
            totalItems: data.totalUsers || 0,
            currentPage: data.currentPage || 1
          }
        }));

        setUsers(data.users || []);
        setStats({
          totalUsers: data.totalUsers || 0,
          activeUsers: data.activeUsers || 0,
          inactiveUsers: data.inactiveUsers || 0,
          blockedUsers: data.blockedUsers || 0,
          monthlyCounts: data.monthlyCounts || [],
          totalGrowth: data.totalGrowth || 0,
          activeGrowth: data.activeGrowth || 0,
          inactiveGrowth: data.inactiveGrowth || 0,
          blockedGrowth: data.blockedGrowth || 0
        });
        setTotalPages(data.totalPages || 1);
        setCurrentPage(data.currentPage || 1);

        // Cuối cùng mới đặt loading = false để không flickering
        setLoading(false);

        // Tiến hành tải trước các trang kế tiếp và trước đó
        // Trước khi gọi preload, kiểm tra xem có đang preload hay không
        if (!Object.values(isPreloading).some(Boolean)) {
          // Chỉ preload khi không có preload nào đang chạy
          preloadAdjacentPages(page, limit, cleanedSearch, status, role, startDate, endDate);
        }
      }

      return data;
    } catch (error) {
      handleError(error);
      setLoading(false);
      return null;
    }
  }, [api, createCacheKey, fetchUserStats, isPageCacheValid, pageCache, totalPages, isPreloading, preloadAdjacentPages]);

  // Tự động fetch users khi accessToken thay đổi
  useEffect(() => {
    const isLoginPage = typeof window !== 'undefined' && window.location.pathname.includes('/admin/auth/login');
    const isDashboard = typeof window !== 'undefined' && window.location.pathname === '/admin/dashboard';

    if (accessToken && !isLoginPage) {
      safeLog('Access token changed, checking if API call is needed');

      // Nếu đang ở trang dashboard, chỉ lấy thống kê mà không lấy danh sách người dùng đầy đủ
      if (isDashboard) {
        // Gọi API thống kê riêng thay vì lấy toàn bộ danh sách user
        fetchUserStats();
      } else {
        // Chỉ fetch users ở các trang khác
        fetchUsers(1, 10);
      }
    }
  }, [accessToken, fetchUserStats, fetchUsers]);

  return (
    <AdminUserContext.Provider
      value={{
        users,
        userDetail,
        stats,
        loading,
        error,
        totalPages,
        currentPage,
        fetchUsers,
        fetchUserStats,
        getUserDetail,
        getUserOrders,
        updateUser,
        deleteUser,
        resetPassword,
        updateUserStatus,
        updateUserRole,
        updateUserCustomerLevel,
        createUser,
      }}
    >
      {children}
    </AdminUserContext.Provider>
  );
};

export const useAdminUser = (): AdminUserContextType => {
  const context = useContext(AdminUserContext);
  if (context === undefined) {
    throw new Error('useAdminUser must be used within an AdminUserProvider');
  }
  return context;
};
