import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/router';
import { useAdminAuth } from './AdminAuthContext';
import toast from 'react-hot-toast';

// Cờ điều khiển việc hiển thị debug logs
const DEBUG_MODE = true;

// Hàm debug có điều kiện
const debugLog = (message: string, data?: any) => {
  if (DEBUG_MODE) {
    console.log(`[BranchContext] ${message}`, data || '');
  }
};

export interface Branch {
  id: string;
  name: string;
  address: string;
  contact: string;
  provinceCode: string;
  districtCode: string;
  wardCode: string;
  createdAt: string;
  updatedAt: string;
}

export interface BranchStatistics {
  totalBranches: number;
}

export interface BranchContextType {
  branches: Branch[];
  loading: boolean;
  error: string | null;
  statistics: BranchStatistics;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  fetchBranches: (page: number, limit: number) => Promise<void>;
  fetchBranch: (id: string) => Promise<Branch | null>;
  createBranch: (branchData: Partial<Branch>) => Promise<Branch | null>;
  updateBranch: (id: string, branchData: Partial<Branch>) => Promise<Branch | null>;
  deleteBranch: (id: string) => Promise<boolean>;
  forceDeleteBranch: (id: string) => Promise<{success: boolean; message: string; productsUpdated: number} | null>;
}

const BranchContext = createContext<BranchContextType | undefined>(undefined);

export const useBranches = () => {
  const context = useContext(BranchContext);
  if (context === undefined) {
    throw new Error('useBranches must be used within a BranchProvider');
  }
  return context;
};

interface BranchProviderProps {
  children: ReactNode;
}

export const BranchProvider: React.FC<BranchProviderProps> = ({ children }) => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [statistics, setStatistics] = useState<BranchStatistics>({
    totalBranches: 0
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  });

  const { accessToken, isAuthenticated, logout } = useAdminAuth();
  const router = useRouter();

  // Tách endpoint sang biến riêng để dễ quản lý - gọi trực tiếp đến backend API
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';
  const API_ENDPOINTS = {
    BRANCHES: `${API_BASE_URL}/admin/branches`,
    BRANCH_DETAIL: (id: string) => `${API_BASE_URL}/admin/branches/${id}`,
    BRANCH_STATISTICS: `${API_BASE_URL}/admin/branches/statistics`
  };

  // Chuyển đổi dữ liệu từ API sang định dạng frontend
  const transformBranch = (branchData: any): Branch => {
    // Log dữ liệu để debug
    debugLog('Transforming branch data:', branchData);
    
    // Xử lý dữ liệu từ MongoDB có thể trả về dạng $oid hoặc $date
    let id = branchData._id;
    if (typeof branchData._id === 'object' && branchData._id.$oid) {
      id = branchData._id.$oid;
    }
    
    let createdAt = branchData.createdAt || '';
    let updatedAt = branchData.updatedAt || '';
    
    // Xử lý định dạng ngày từ MongoDB
    if (typeof branchData.createdAt === 'object' && branchData.createdAt.$date) {
      createdAt = new Date(branchData.createdAt.$date).toISOString();
    }
    
    if (typeof branchData.updatedAt === 'object' && branchData.updatedAt.$date) {
      updatedAt = new Date(branchData.updatedAt.$date).toISOString();
    }
    
    return {
      id: id || branchData.id,
      name: branchData.name || '',
      address: branchData.address || '',
      contact: branchData.contact || '',
      provinceCode: branchData.provinceCode || '',
      districtCode: branchData.districtCode || '',
      wardCode: branchData.wardCode || '',
      createdAt: createdAt,
      updatedAt: updatedAt
    };
  };

  const fetchBranches = async (page = 1, limit = 10, filters = {}) => {
    setLoading(true);
    setError(null);

    try {
      // Kiểm tra xác thực trước khi gọi API
      if (!isAuthenticated || !accessToken) {
        debugLog('Không có token hoặc chưa xác thực, bỏ qua việc tải dữ liệu chi nhánh');
        setLoading(false);
        return;
      }

      // Chuẩn bị params
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());

      // Thêm các bộ lọc
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value as string);
        }
      });

      debugLog(`Đang gọi API lấy danh sách chi nhánh...`);

      const paramsString = params.toString();
      const url = `${API_ENDPOINTS.BRANCHES}${paramsString ? `?${paramsString}` : ''}`;

      // Gọi API lấy danh sách chi nhánh
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      });

      // Xử lý ngay trường hợp lỗi xác thực 401
      if (response.status === 401) {
        debugLog('Token hết hạn hoặc không hợp lệ, chuyển hướng đến trang đăng nhập');
        setLoading(false);
        // Không throw error ở đây để tránh lỗi unhandled
        setBranches([]);
        await logout();
        router.push('/admin/auth/login');
        return;
      }

      // Đọc response dưới dạng text trước để xử lý lỗi JSON
      const responseText = await response.text();
      let data;

      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        console.error('Lỗi khi phân tích JSON từ phản hồi API:', parseError);
        debugLog('Phản hồi thô từ server:', responseText.substring(0, 200));
        throw new Error('Lỗi khi phân tích dữ liệu từ server');
      }

      if (!response.ok) {
        debugLog(`Lỗi khi lấy danh sách chi nhánh, status: ${response.status}`, data);
        throw new Error(data.message || 'Lỗi khi lấy danh sách chi nhánh');
      }

      if (!data.data || !Array.isArray(data.data)) {
        debugLog('Server trả về dữ liệu không hợp lệ (không có mảng data):', data);
        setBranches([]);
        setPagination({
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 1
        });
        return data;
      }

      // Cập nhật danh sách chi nhánh và thông tin phân trang
      setBranches(data.data.map(transformBranch));
      setPagination({
        page: data.pagination.page,
        limit: data.pagination.limit,
        total: data.pagination.total,
        totalPages: data.pagination.totalPages
      });

      // Gọi API lấy thống kê
      fetchStatistics();

      return data;
    } catch (err: any) {
      debugLog('Error fetching branches:', err);

      // Xử lý lỗi
      if (err.response?.status === 401 ||
          typeof err.message === 'string' && (
            err.message.includes('xác thực') ||
            err.message.includes('Unauthorized') ||
            err.message.toLowerCase().includes('token')
          )
      ) {
        debugLog('Phiên đăng nhập hết hạn, đăng xuất và chuyển hướng');
        toast.error('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại');
        setBranches([]);

        try {
          await logout();
          router.push('/admin/auth/login');
        } catch (logoutError) {
          debugLog('Lỗi khi đăng xuất:', logoutError);
        }
      } else {
        setError(err.message || 'Có lỗi xảy ra khi lấy danh sách chi nhánh');
        toast.error(err.message || 'Có lỗi xảy ra khi lấy danh sách chi nhánh');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.BRANCH_STATISTICS, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        debugLog('Error fetching branch statistics:', response.statusText);
        return null;
      }

      const data = await response.json();
      setStatistics(data);
      return data;
    } catch (err: any) {
      debugLog('Error fetching branch statistics:', err);
      return null;
    }
  };

  const fetchBranch = async (id: string): Promise<Branch | null> => {
    setLoading(true);
    setError(null);

    debugLog(`Fetching branch details for ID: ${id}`);
    
    try {
      const response = await fetch(API_ENDPOINTS.BRANCH_DETAIL(id), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      });

      // Log response status để debug
      debugLog(`Branch API response status: ${response.status}`);

      // Đọc response dưới dạng text trước để xử lý lỗi JSON
      const responseText = await response.text();
      
      // Thử log text response để debug
      debugLog(`Branch API response text: ${responseText.substring(0, 200)}...`);
      
      let data;
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        debugLog('Error parsing JSON response:', parseError);
        throw new Error('Lỗi khi phân tích dữ liệu từ server');
      }

      if (!response.ok) {
        const errorMessage = data.message || 'Lỗi khi lấy thông tin chi nhánh';
        debugLog('Error in API response:', errorMessage);
        throw new Error(errorMessage);
      }

      debugLog('Successfully fetched branch data', data);
      return transformBranch(data);
    } catch (err: any) {
      debugLog('Error fetching branch details:', err);

      if (err.response?.status === 401 || (typeof err.message === 'string' && err.message.includes('xác thực'))) {
        toast.error('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại');
        await logout();
        router.push('/admin/auth/login');
      } else {
        setError(err.message || 'Có lỗi xảy ra khi lấy thông tin chi nhánh');
        toast.error(err.message || 'Có lỗi xảy ra khi lấy thông tin chi nhánh');
      }

      return null;
    } finally {
      setLoading(false);
    }
  };

  const createBranch = async (branchData: Partial<Branch>): Promise<Branch | null> => {
    setLoading(true);
    setError(null);

    try {
      // Chuẩn bị dữ liệu để gửi đến API
      const apiData = {
        name: branchData.name,
        address: branchData.address,
        contact: branchData.contact,
        provinceCode: branchData.provinceCode,
        districtCode: branchData.districtCode,
        wardCode: branchData.wardCode
      };

      const response = await fetch(API_ENDPOINTS.BRANCHES, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(apiData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Lỗi khi thêm chi nhánh');
      }

      const data = await response.json();

      // Chuyển đổi dữ liệu từ API sang định dạng phù hợp
      const newBranch = transformBranch(data);

      // Thêm chi nhánh mới vào state
      setBranches(prevBranches => [...prevBranches, newBranch]);

      // Cập nhật thống kê
      fetchStatistics();

      toast.success('Thêm chi nhánh thành công!');
      return newBranch;
    } catch (err: any) {
      debugLog('Error creating branch:', err);

      if (err.response?.status === 401 || err.message.includes('xác thực')) {
        toast.error('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại');
        await logout();
        router.push('/admin/auth/login');
      } else {
        setError(err.message || 'Có lỗi xảy ra khi thêm chi nhánh');
        toast.error(err.message || 'Có lỗi xảy ra khi thêm chi nhánh');
      }

      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateBranch = async (id: string, branchData: Partial<Branch>): Promise<Branch | null> => {
    try {
      debugLog(`Updating branch with ID: ${id}`, branchData);
      
      const response = await fetch(API_ENDPOINTS.BRANCH_DETAIL(id), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(branchData)
      });

      // Đọc response dưới dạng text trước để xử lý lỗi JSON
      const responseText = await response.text();
      
      debugLog(`Branch update API response text: ${responseText.substring(0, 200)}...`);
      
      let data;
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        debugLog('Error parsing JSON response:', parseError);
        throw new Error('Lỗi khi phân tích dữ liệu từ server');
      }

      if (!response.ok) {
        const errorMessage = data.message || 'Lỗi khi cập nhật chi nhánh';
        debugLog('Error in API response:', errorMessage);
        throw new Error(errorMessage);
      }

      debugLog('Branch updated successfully:', data);

      // Sau khi cập nhật thành công, cập nhật lại danh sách chi nhánh
      await fetchBranches(pagination.page, pagination.limit);
      
      // Trả về đối tượng chi nhánh đã cập nhật
      return transformBranch(data);
    } catch (err: any) {
      debugLog('Error updating branch:', err);

      if (err.response?.status === 401 || (typeof err.message === 'string' && err.message.includes('xác thực'))) {
        toast.error('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại');
        await logout();
        router.push('/admin/auth/login');
      } else {
        setError(err.message || 'Có lỗi xảy ra khi cập nhật chi nhánh');
        toast.error(err.message || 'Có lỗi xảy ra khi cập nhật chi nhánh');
      }

      return null;
    }
  };

  const deleteBranch = async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      // Kiểm tra ID chi nhánh trước khi gửi yêu cầu
      if (!id || typeof id !== 'string' || id.trim() === '') {
        setError('ID chi nhánh không hợp lệ');
        toast.error('ID chi nhánh không hợp lệ');
        return false;
      }

      const response = await fetch(API_ENDPOINTS.BRANCH_DETAIL(id), {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.message || 'Lỗi khi xóa chi nhánh';
        setError(errorMessage);
        toast.error(errorMessage);
        return false;
      }

      // Cập nhật danh sách chi nhánh
      setBranches(prevBranches => prevBranches.filter(branch => branch.id !== id));

      // Cập nhật thống kê
      fetchStatistics();

      toast.success('Xóa chi nhánh thành công!');
      return true;
    } catch (err: any) {
      debugLog('Error deleting branch:', err);

      if (err.response?.status === 401 || err.message?.includes('xác thực')) {
        toast.error('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại');
        await logout();
        router.push('/admin/auth/login');
      } else {
        const errorMessage = err.message || 'Có lỗi xảy ra khi xóa chi nhánh';
        setError(errorMessage);
        toast.error(errorMessage);
      }

      return false;
    } finally {
      setLoading(false);
    }
  };

  // Xóa chi nhánh và cập nhật tất cả sản phẩm tham chiếu
  const forceDeleteBranch = async (id: string): Promise<{success: boolean; message: string; productsUpdated: number} | null> => {
    try {
      setError(null);
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/admin/branches/${id}/force`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Có lỗi xảy ra khi xóa chi nhánh');
        toast.error(data.message || 'Có lỗi xảy ra khi xóa chi nhánh');
        return null;
      }

      // Cập nhật state sau khi xóa
      setBranches(branches.filter(branch => branch.id !== id));

      // Cập nhật thống kê
      fetchStatistics();

      toast.success(data.message || 'Xóa chi nhánh thành công!');
      return data;
    } catch (error: any) {
      debugLog('Error force deleting branch:', error);
      const errorMessage = error.message || 'Có lỗi xảy ra khi xóa chi nhánh';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Tải chi nhánh khi component được mount và khi accessToken thay đổi
  useEffect(() => {
    const loadBranches = async () => {
      try {
        // Chỉ gọi API khi người dùng đã xác thực và có accessToken
        if (isAuthenticated && accessToken) {
          // Kiểm tra đường dẫn hiện tại, chỉ gọi API nếu người dùng đang ở trang branches
          const isAdminBranchesPage = router.pathname.includes('/admin/branches');

          if (isAdminBranchesPage) {
            debugLog('Đang ở trang chi nhánh, tải dữ liệu chi nhánh...');
            // Thêm timeout nhỏ để đảm bảo accessToken đã được cập nhật đầy đủ
            setTimeout(() => {
              fetchBranches().catch(err => {
                debugLog('Không thể tải dữ liệu chi nhánh:', err);
                // Error đã được xử lý trong fetchBranches, không cần throw
              });
            }, 300);
          } else {
            debugLog('Không ở trang chi nhánh, bỏ qua việc tải dữ liệu chi nhánh');
          }
        } else {
          debugLog('Chưa đăng nhập hoặc không có token, bỏ qua việc tải dữ liệu chi nhánh');
        }
      } catch (error) {
        debugLog('Lỗi trong useEffect của BranchContext:', error);
      }
    };

    loadBranches();
  }, [isAuthenticated, accessToken, router.pathname]);

  const value: BranchContextType = {
    branches,
    loading,
    error,
    statistics,
    pagination,
    fetchBranches,
    fetchBranch,
    createBranch,
    updateBranch,
    deleteBranch,
    forceDeleteBranch
  };

  return (
    <BranchContext.Provider value={value}>
      {children}
    </BranchContext.Provider>
  );
};