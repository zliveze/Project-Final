import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useAdminAuth } from './AdminAuthContext';

// Định nghĩa kiểu dữ liệu cho Voucher
export interface Voucher {
  _id: string;
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minimumOrderValue: number;
  startDate: Date;
  endDate: Date;
  usageLimit: number;
  usedCount: number;
  usedByUsers: string[];
  applicableProducts: string[];
  applicableCategories: string[];
  applicableBrands: string[];
  applicableEvents: string[];
  applicableCampaigns: string[];
  applicableUserGroups: {
    all: boolean;
    new: boolean;
    specific: string[];
    levels?: string[];
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  // UI state flag - not stored in database
  showSpecificProducts?: boolean;
}

// Định nghĩa kiểu dữ liệu cho thống kê voucher
export interface VoucherStatistics {
  totalVouchers: number;
  activeVouchers: number;
  expiredVouchers: number;
  unusedVouchers: number;
  topUsedVouchers: Array<Partial<Voucher>>;
  usageStatistics: {
    totalUsed: number;
    totalLimit: number;
    usageRate: number;
  };
}

// Định nghĩa kiểu dữ liệu cho kết quả phân trang
interface PaginatedVouchers {
  data: Voucher[];
  total: number;
  page: number;
  limit: number;
}

// Các tham số query cho việc lọc và phân trang
interface VoucherQueryParams {
  page?: number;
  limit?: number;
  code?: string;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  startDateFrom?: string;
  startDateTo?: string;
  endDateFrom?: string;
  endDateTo?: string;
}

// Định nghĩa kiểu dữ liệu context
interface VoucherContextType {
  vouchers: Voucher[];
  paginatedVouchers: PaginatedVouchers;
  statistics: VoucherStatistics | null;
  isLoading: boolean;
  error: string | null;

  // Hàm quản lý voucher
  getVouchers: (queryParams?: VoucherQueryParams) => Promise<void>;
  getVoucherById: (id: string) => Promise<Voucher | null>;
  getVoucherByCode: (code: string) => Promise<Voucher | null>;
  createVoucher: (voucherData: Partial<Voucher>) => Promise<Voucher | null>;
  updateVoucher: (id: string, voucherData: Partial<Voucher>) => Promise<Voucher | null>;
  deleteVoucher: (id: string) => Promise<boolean>;

  // Hàm lấy thống kê
  getVoucherStatistics: () => Promise<void>;
}

// Tạo context
const VoucherContext = createContext<VoucherContextType | undefined>(undefined);

// Provider component
export const VoucherProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { accessToken, isAuthenticated } = useAdminAuth();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [paginatedVouchers, setPaginatedVouchers] = useState<PaginatedVouchers>({
    data: [],
    total: 0,
    page: 1,
    limit: 10
  });
  const [statistics, setStatistics] = useState<VoucherStatistics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // API base URL
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  // Cấu hình Axios với token xác thực
  const getAuthHeaders = () => {
    return {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    };
  };

  // Hàm chuyển đổi dữ liệu ngày từ chuỗi sang Date
  const formatVoucherDates = (voucher: any): Voucher => {
    return {
      ...voucher,
      startDate: new Date(voucher.startDate),
      endDate: new Date(voucher.endDate),
      createdAt: voucher.createdAt ? new Date(voucher.createdAt) : new Date(),
      updatedAt: voucher.updatedAt ? new Date(voucher.updatedAt) : new Date()
    };
  };

  // Lấy danh sách voucher (có phân trang)
  const getVouchers = async (queryParams?: VoucherQueryParams): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      // Xây dựng query string từ các tham số
      const params = new URLSearchParams();
      if (queryParams) {
        Object.entries(queryParams).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, String(value));
          }
        });
      }

      const response = await axios.get(
        `${API_URL}/admin/vouchers/paginated?${params.toString()}`,
        getAuthHeaders()
      );

      // Format lại các trường ngày
      const formattedData = {
        ...response.data,
        data: response.data.data.map(formatVoucherDates)
      };

      setPaginatedVouchers(formattedData);
      setVouchers(formattedData.data);
      setIsLoading(false);
    } catch (err: any) {
      setIsLoading(false);
      const errorMsg = err.response?.data?.message || 'Không thể tải danh sách voucher';
      setError(errorMsg);
      toast.error(errorMsg);
      console.error('Lỗi khi tải danh sách voucher:', err);
    }
  };

  // Lấy thông tin voucher bằng ID
  const getVoucherById = async (id: string): Promise<Voucher | null> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await axios.get(
        `${API_URL}/admin/vouchers/${id}`,
        getAuthHeaders()
      );

      const voucher = formatVoucherDates(response.data);
      setIsLoading(false);
      return voucher;
    } catch (err: any) {
      setIsLoading(false);
      const errorMsg = err.response?.data?.message || `Không thể tìm thấy voucher với ID ${id}`;
      setError(errorMsg);
      toast.error(errorMsg);
      console.error('Lỗi khi tải thông tin voucher:', err);
      return null;
    }
  };

  // Lấy thông tin voucher bằng mã code
  const getVoucherByCode = async (code: string): Promise<Voucher | null> => {
    try {
      setIsLoading(true);
      setError(null);

      // Sử dụng query để tìm voucher theo code
      const response = await axios.get(
        `${API_URL}/admin/vouchers?code=${code}`,
        getAuthHeaders()
      );

      // Nếu có kết quả thì lấy voucher đầu tiên
      if (response.data && response.data.length > 0) {
        const voucher = formatVoucherDates(response.data[0]);
        setIsLoading(false);
        return voucher;
      } else {
        setIsLoading(false);
        return null;
      }
    } catch (err: any) {
      setIsLoading(false);
      const errorMsg = err.response?.data?.message || `Không thể tìm thấy voucher với mã ${code}`;
      setError(errorMsg);
      toast.error(errorMsg);
      console.error('Lỗi khi tải thông tin voucher:', err);
      return null;
    }
  };

  // Tạo voucher mới
  const createVoucher = async (voucherData: Partial<Voucher>): Promise<Voucher | null> => {
    try {
      setIsLoading(true);
      setError(null);

      // Chuẩn bị dữ liệu voucher
      const preparedData = {
        ...voucherData,
        // Chuyển Date thành string ISO để gửi lên server
        startDate: voucherData.startDate instanceof Date ? voucherData.startDate.toISOString() : voucherData.startDate,
        endDate: voucherData.endDate instanceof Date ? voucherData.endDate.toISOString() : voucherData.endDate,
      };

      const response = await axios.post(
        `${API_URL}/admin/vouchers`,
        preparedData,
        getAuthHeaders()
      );

      const newVoucher = formatVoucherDates(response.data);

      // Cập nhật danh sách voucher
      setVouchers(prev => [newVoucher, ...prev]);
      setIsLoading(false);
      toast.success('Tạo voucher mới thành công!');
      return newVoucher;
    } catch (err: any) {
      setIsLoading(false);
      const errorMsg = err.response?.data?.message || 'Không thể tạo voucher mới';
      setError(errorMsg);
      toast.error(errorMsg);
      console.error('Lỗi khi tạo voucher:', err);
      return null;
    }
  };

  // Cập nhật voucher
  const updateVoucher = async (id: string, voucherData: Partial<Voucher>): Promise<Voucher | null> => {
    try {
      setIsLoading(true);
      setError(null);

      // Chuẩn bị dữ liệu voucher
      const preparedData = {
        ...voucherData,
        // Chuyển Date thành string ISO để gửi lên server
        startDate: voucherData.startDate instanceof Date ? voucherData.startDate.toISOString() : voucherData.startDate,
        endDate: voucherData.endDate instanceof Date ? voucherData.endDate.toISOString() : voucherData.endDate,
      };

      const response = await axios.patch(
        `${API_URL}/admin/vouchers/${id}`,
        preparedData,
        getAuthHeaders()
      );

      const updatedVoucher = formatVoucherDates(response.data);

      // Cập nhật danh sách voucher
      setVouchers(prev => prev.map(v => (v._id === id ? updatedVoucher : v)));
      setIsLoading(false);
      toast.success('Cập nhật voucher thành công!');
      return updatedVoucher;
    } catch (err: any) {
      setIsLoading(false);
      const errorMsg = err.response?.data?.message || 'Không thể cập nhật voucher';
      setError(errorMsg);
      toast.error(errorMsg);
      console.error('Lỗi khi cập nhật voucher:', err);
      return null;
    }
  };

  // Xóa voucher
  const deleteVoucher = async (id: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      await axios.delete(
        `${API_URL}/admin/vouchers/${id}`,
        getAuthHeaders()
      );

      // Cập nhật danh sách voucher
      setVouchers(prev => prev.filter(v => v._id !== id));
      setIsLoading(false);
      toast.success('Xóa voucher thành công!');
      return true;
    } catch (err: any) {
      setIsLoading(false);
      const errorMsg = err.response?.data?.message || 'Không thể xóa voucher';
      setError(errorMsg);
      toast.error(errorMsg);
      console.error('Lỗi khi xóa voucher:', err);
      return false;
    }
  };

  // Lấy thống kê voucher
  const getVoucherStatistics = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await axios.get(
        `${API_URL}/admin/vouchers/statistics`,
        getAuthHeaders()
      );

      setStatistics(response.data);
      setIsLoading(false);
    } catch (err: any) {
      setIsLoading(false);
      const errorMsg = err.response?.data?.message || 'Không thể tải thống kê voucher';
      setError(errorMsg);
      toast.error(errorMsg);
      console.error('Lỗi khi tải thống kê voucher:', err);
    }
  };

  useEffect(() => {
    // Chỉ tải dữ liệu khi đã đăng nhập
    if (isAuthenticated && accessToken) {
      getVouchers();
      getVoucherStatistics();
    }
  }, [isAuthenticated, accessToken]);

  const contextValue: VoucherContextType = {
    vouchers,
    paginatedVouchers,
    statistics,
    isLoading,
    error,
    getVouchers,
    getVoucherById,
    getVoucherByCode,
    createVoucher,
    updateVoucher,
    deleteVoucher,
    getVoucherStatistics
  };

  return (
    <VoucherContext.Provider value={contextValue}>
      {children}
    </VoucherContext.Provider>
  );
};

// Custom hook để sử dụng context
export const useVoucher = (): VoucherContextType => {
  const context = useContext(VoucherContext);
  if (!context) {
    throw new Error('useVoucher must be used within a VoucherProvider');
  }
  return context;
};