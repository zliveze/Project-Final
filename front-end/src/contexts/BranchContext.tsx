import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/router';
import { useAdminAuth } from './AdminAuthContext';
import toast from 'react-hot-toast';

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
  getProductsCount: (id: string) => Promise<{branchId: string; productsCount: number; branchName: string} | null>;
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

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';
  const API_ENDPOINTS = {
    BRANCHES: `${API_BASE_URL}/admin/branches`,
    BRANCH_DETAIL: (id: string) => `${API_BASE_URL}/admin/branches/${id}`,
    BRANCH_STATISTICS: `${API_BASE_URL}/admin/branches/statistics`
  };

  const transformBranch = (branchData: any): Branch => {
    // Xử lý dữ liệu từ MongoDB
    let id = branchData._id;
    if (typeof branchData._id === 'object' && branchData._id.$oid) {
      id = branchData._id.$oid;
    }

    let createdAt = branchData.createdAt || '';
    let updatedAt = branchData.updatedAt || '';

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
      if (!isAuthenticated || !accessToken) {
        setLoading(false);
        return;
      }

      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value as string);
        }
      });

      const paramsString = params.toString();
      const url = `${API_ENDPOINTS.BRANCHES}${paramsString ? `?${paramsString}` : ''}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (response.status === 401) {
        setLoading(false);
        setBranches([]);
        await logout();
        router.push('/admin/auth/login');
        return;
      }

      const responseText = await response.text();
      let data;

      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        throw new Error('Lỗi khi phân tích dữ liệu từ server');
      }

      if (!response.ok) {
        throw new Error(data.message || 'Lỗi khi lấy danh sách chi nhánh');
      }

      if (!data.data || !Array.isArray(data.data)) {
        setBranches([]);
        setPagination({
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 1
        });
        return data;
      }

      setBranches(data.data.map(transformBranch));
      setPagination({
        page: data.pagination.page,
        limit: data.pagination.limit,
        total: data.pagination.total,
        totalPages: data.pagination.totalPages
      });

      fetchStatistics();
      return data;
    } catch (err: any) {
      if (err.response?.status === 401 ||
          typeof err.message === 'string' && (
            err.message.includes('xác thực') ||
            err.message.includes('Unauthorized') ||
            err.message.toLowerCase().includes('token')
          )
      ) {
        toast.error('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại');
        setBranches([]);

        try {
          await logout();
          router.push('/admin/auth/login');
        } catch (logoutError) {
          console.error('Lỗi khi đăng xuất:', logoutError);
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
        return null;
      }

      const data = await response.json();
      setStatistics(data);
      return data;
    } catch (err: any) {
      return null;
    }
  };

  const fetchBranch = async (id: string): Promise<Branch | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(API_ENDPOINTS.BRANCH_DETAIL(id), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      });

      const responseText = await response.text();
      let data;

      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        throw new Error('Lỗi khi phân tích dữ liệu từ server');
      }

      if (!response.ok) {
        const errorMessage = data.message || 'Lỗi khi lấy thông tin chi nhánh';
        throw new Error(errorMessage);
      }

      return transformBranch(data);
    } catch (err: any) {
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
      const newBranch = transformBranch(data);

      setBranches(prevBranches => [...prevBranches, newBranch]);
      fetchStatistics();

      toast.success('Thêm chi nhánh thành công!');
      return newBranch;
    } catch (err: any) {
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
      const response = await fetch(API_ENDPOINTS.BRANCH_DETAIL(id), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(branchData)
      });

      const responseText = await response.text();
      let data;

      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        throw new Error('Lỗi khi phân tích dữ liệu từ server');
      }

      if (!response.ok) {
        const errorMessage = data.message || 'Lỗi khi cập nhật chi nhánh';
        throw new Error(errorMessage);
      }

      await fetchBranches(pagination.page, pagination.limit);
      toast.success('Cập nhật chi nhánh thành công!');

      return transformBranch(data);
    } catch (err: any) {
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

      setBranches(prevBranches => prevBranches.filter(branch => branch.id !== id));
      fetchStatistics();

      toast.success('Xóa chi nhánh thành công!');
      return true;
    } catch (err: any) {
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

  const getProductsCount = async (id: string): Promise<{branchId: string; productsCount: number; branchName: string} | null> => {
    try {
      setError(null);

      const response = await fetch(`${API_BASE_URL}/admin/branches/${id}/products-count`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Có lỗi xảy ra khi kiểm tra số sản phẩm');
        return null;
      }

      return data;
    } catch (error: any) {
      const errorMessage = error.message || 'Có lỗi xảy ra khi kiểm tra số sản phẩm';
      setError(errorMessage);
      return null;
    }
  };

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

      setBranches(branches.filter(branch => branch.id !== id));
      fetchStatistics();

      toast.success(data.message || 'Xóa chi nhánh thành công!');
      return data;
    } catch (error: any) {
      const errorMessage = error.message || 'Có lỗi xảy ra khi xóa chi nhánh';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Removed auto-loading useEffect - BranchList will handle loading

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
    getProductsCount,
    forceDeleteBranch
  };

  return (
    <BranchContext.Provider value={value}>
      {children}
    </BranchContext.Provider>
  );
};