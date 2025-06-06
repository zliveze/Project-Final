import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-toastify';

// Define error type to replace 'any'
interface ApiError {
  message?: string;
  [key: string]: unknown;
}

// Định nghĩa kiểu dữ liệu cho Voucher
export interface Voucher {
  _id: string;
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  maxDiscountAmount?: number; // Thêm thuộc tính này
  minimumOrderValue: number;
  startDate: Date;
  endDate: Date;
  usageLimit: number;
  usedCount: number;
  usedByUsers?: string[]; // Thêm mảng chứa ID của người dùng đã sử dụng voucher
  applicableUserGroups?: {
    all: boolean;
    new: boolean;
    specific: string[];
    levels?: string[];
  };
}

// Định nghĩa kiểu dữ liệu cho kết quả áp dụng voucher
export interface VoucherApplyResult {
  voucherId: string;
  discountAmount: number;
  finalAmount: number;
  message: string;
}

// Định nghĩa kiểu dữ liệu trả về của hook
export interface UseUserVoucherResult {
  isLoading: boolean;
  error: string | null;
  availableVouchers: Voucher[];
  unavailableVouchers: Voucher[];
  appliedVoucher: VoucherApplyResult | null;
  fetchAvailableVouchers: () => Promise<Voucher[]>;
  fetchApplicableVouchers: (orderValue: number, productIds?: string[]) => Promise<Voucher[]>;
  fetchUnavailableVouchers: (orderValue: number, productIds?: string[]) => Promise<Voucher[]>;
  applyVoucher: (code: string, orderValue: number, productIds?: string[]) => Promise<VoucherApplyResult | null>;
  findVoucherByCode: (code: string) => Promise<Voucher | null>;
  clearAppliedVoucher: () => void;
}

export const useUserVoucher = (): UseUserVoucherResult => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [availableVouchers, setAvailableVouchers] = useState<Voucher[]>([]);
  const [unavailableVouchers, setUnavailableVouchers] = useState<Voucher[]>([]);
  const [appliedVoucher, setAppliedVoucher] = useState<VoucherApplyResult | null>(null);
  const { isAuthenticated, user } = useAuth();

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backendyumin.vercel.app/api';

  // Hàm lấy token từ localStorage
  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('accessToken'); // Sửa từ 'token' thành 'accessToken'
    return {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    };
  }, []);

  // Hàm xử lý và phân loại voucher
  const processVouchers = useCallback((allVouchers: Voucher[], orderValue: number) => {
    // Phân loại voucher thành khả dụng và không khả dụng
    const now = new Date();
    const available: Voucher[] = [];
    const unavailable: Voucher[] = [];

    allVouchers.forEach((voucher: Voucher) => {
      // Kiểm tra xem người dùng hiện tại đã sử dụng voucher này chưa
      const isUsedByCurrentUser = () => {
        if (!user?._id || !voucher.usedByUsers || voucher.usedByUsers.length === 0) return false;
        
        // Kiểm tra cả trường hợp ID thông thường và ID dạng MongoDB ObjectId
        return voucher.usedByUsers.some(userId => {
          // Trường hợp ID là chuỗi đơn giản
          if (typeof userId === 'string') {
            return userId === user._id;
          }
          
          // Trường hợp ID là object từ MongoDB với $oid
          // @ts-expect-error MongoDB ObjectId có thể có cấu trúc {$oid: string} mà TypeScript không nhận diện được
          if (userId && userId.$oid) {
            // @ts-expect-error Truy cập thuộc tính $oid của MongoDB ObjectId structure
            return userId.$oid === user._id;
          }
          
          return false;
        });
      };

      // Kiểm tra các điều kiện cơ bản
      const startDate = new Date(voucher.startDate);
      const endDate = new Date(voucher.endDate);
      const isActive = startDate <= now && endDate >= now && voucher.usedCount < voucher.usageLimit;
      const meetsMinimumOrder = orderValue >= voucher.minimumOrderValue;

      // Kiểm tra cấp độ khách hàng
      const isApplicableToUserLevel = () => {
        if (!voucher.applicableUserGroups) return true;
        if (voucher.applicableUserGroups.all) return true;
        if (!user?.customerLevel) return false;
        return voucher.applicableUserGroups.levels?.includes(user.customerLevel);
      };

      // Kiểm tra nếu người dùng đã sử dụng voucher này rồi thì cho vào danh sách không khả dụng
      if (isUsedByCurrentUser()) {
        unavailable.push(voucher);
        return; // Thoát sớm nếu người dùng đã sử dụng
      }

      // Nếu đáp ứng tất cả các điều kiện, thêm vào danh sách khả dụng
      if (isActive && meetsMinimumOrder && isApplicableToUserLevel()) {
        available.push(voucher);
      } else {
        unavailable.push(voucher);
      }
    });

    // Cập nhật state
    setAvailableVouchers(available);
    setUnavailableVouchers(unavailable);

    return { available, unavailable };
  }, [user?._id, user?.customerLevel]);

  // Lấy tất cả voucher và phân loại
  const fetchAllVouchers = useCallback(async (
    orderValue: number = 0,
    // productIds không được sử dụng trực tiếp trong hàm này nhưng cần giữ để tương thích với các hàm gọi
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _productIds: string[] = []
  ): Promise<{available: Voucher[], unavailable: Voucher[]}> => {
    if (!isAuthenticated) {
      return {available: [], unavailable: []};
    }

    setIsLoading(true);
    setError(null);

    try {
      // Gọi API lấy tất cả voucher
      const response = await fetch(`${API_URL}/vouchers`, getAuthHeaders());

      if (!response.ok) {
        setIsLoading(false);
        return {available: [], unavailable: []};
      }

      const allVouchers = await response.json();
      const result = processVouchers(allVouchers, orderValue);
      setIsLoading(false);
      return result;
    } catch (err: unknown) {
      setIsLoading(false);
      const errorMsg = (err as ApiError)?.message || 'Đã xảy ra lỗi khi tải voucher';
      setError(errorMsg);
      return {available: [], unavailable: []};
    }
  }, [API_URL, getAuthHeaders, isAuthenticated, processVouchers]);

  // Lấy danh sách voucher có sẵn (wrapper cho fetchAllVouchers)
  const fetchAvailableVouchers = useCallback(async (): Promise<Voucher[]> => {
    const {available} = await fetchAllVouchers();
    return available;
  }, [fetchAllVouchers]);

  // Lấy danh sách voucher có thể áp dụng cho đơn hàng hiện tại
  const fetchApplicableVouchers = useCallback(async (
    orderValue: number,
    productIds: string[] = []
  ): Promise<Voucher[]> => {
    const {available} = await fetchAllVouchers(orderValue, productIds);
    return available;
  }, [fetchAllVouchers]);

  // Lấy danh sách voucher không khả dụng cho đơn hàng hiện tại
  const fetchUnavailableVouchers = useCallback(async (
    orderValue: number,
    productIds: string[] = []
  ): Promise<Voucher[]> => {
    const {unavailable} = await fetchAllVouchers(orderValue, productIds);
    return unavailable;
  }, [fetchAllVouchers]);

  // Áp dụng voucher vào đơn hàng
  const applyVoucher = useCallback(async (
    code: string,
    orderValue: number,
    productIds: string[] = []
  ): Promise<VoucherApplyResult | null> => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để sử dụng mã giảm giá');
      return null;
    }

    if (!code.trim()) {
      toast.error('Vui lòng nhập mã giảm giá');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Payload to send
      const payload = {
        code: code.trim(),
        orderValue,
        productIds,
        userId: user?._id,
        // Luôn gửi customerLevel, nếu không có thì gửi null
        customerLevel: user?.customerLevel || null
      };

      const response = await fetch(`${API_URL}/vouchers/apply`, {
        method: 'POST',
        ...getAuthHeaders(),
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Không thể áp dụng mã giảm giá');
      }

      setAppliedVoucher(data);
      setIsLoading(false);
      toast.success(data.message || 'Đã áp dụng mã giảm giá thành công', {
        position: "bottom-right",
        autoClose: 3000,
        theme: "light",
        style: { backgroundColor: '#fdf2f8', color: '#db2777', borderLeft: '4px solid #db2777' }
      });
      return data;
    } catch (err: unknown) {
      setIsLoading(false);
      const errorMsg = (err as ApiError)?.message || 'Đã xảy ra lỗi khi áp dụng mã giảm giá';
      setError(errorMsg);
      toast.error(errorMsg, {
        position: "bottom-right",
        autoClose: 3000,
        theme: "light",
        style: { backgroundColor: '#f8d7da', color: '#721c24', borderLeft: '4px solid #721c24' }
      });
      return null;
    }
  }, [API_URL, getAuthHeaders, isAuthenticated, user?._id, user?.customerLevel]);

  // Tìm voucher theo mã code
  const findVoucherByCode = useCallback(async (code: string): Promise<Voucher | null> => {
    if (!isAuthenticated || !code.trim()) {
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_URL}/vouchers/code/${encodeURIComponent(code.trim())}`,
        getAuthHeaders()
      );

      if (!response.ok) {
        throw new Error('Không tìm thấy mã giảm giá hoặc mã không hợp lệ');
      }

      const data = await response.json();
      setIsLoading(false);
      return data;
    } catch (err: unknown) {
      setIsLoading(false);
      const errorMsg = (err as ApiError)?.message || 'Đã xảy ra lỗi khi tìm kiếm mã giảm giá';
      setError(errorMsg);
      return null;
    }
  }, [API_URL, getAuthHeaders, isAuthenticated]);

  // Xóa voucher đã áp dụng
  const clearAppliedVoucher = useCallback(() => {
    setAppliedVoucher(null);
  }, []);

  return {
    isLoading,
    error,
    availableVouchers,
    unavailableVouchers,
    appliedVoucher,
    fetchAvailableVouchers,
    fetchApplicableVouchers,
    fetchUnavailableVouchers,
    applyVoucher,
    findVoucherByCode,
    clearAppliedVoucher
  };
};
