import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/router';
import { useAdminAuth } from './AdminAuthContext';
import toast from 'react-hot-toast';

export interface Branch {
  id: string;
  name: string;
  address: string;
  contact: string;
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
    return {
      id: branchData._id,
      name: branchData.name,
      address: branchData.address,
      contact: branchData.contact || '',
      createdAt: branchData.createdAt,
      updatedAt: branchData.updatedAt
    };
  };

  const fetchBranches = async (page = 1, limit = 10, filters = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      // Kiểm tra xác thực trước khi gọi API
      if (!isAuthenticated || !accessToken) {
        console.log('Không có token hoặc chưa xác thực, bỏ qua việc tải dữ liệu chi nhánh');
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
      
      console.log(`Đang gọi API lấy danh sách chi nhánh...`);
      
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
        console.error('Token hết hạn hoặc không hợp lệ, chuyển hướng đến trang đăng nhập');
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
        console.error('Phản hồi thô từ server:', responseText.substring(0, 200));
        throw new Error('Lỗi khi phân tích dữ liệu từ server');
      }
      
      if (!response.ok) {
        console.error(`Lỗi khi lấy danh sách chi nhánh, status: ${response.status}`, data);
        throw new Error(data.message || 'Lỗi khi lấy danh sách chi nhánh');
      }
      
      if (!data.data || !Array.isArray(data.data)) {
        console.warn('Server trả về dữ liệu không hợp lệ (không có mảng data):', data);
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
      console.error('Error fetching branches:', err);
      
      // Xử lý lỗi
      if (err.response?.status === 401 || 
          typeof err.message === 'string' && (
            err.message.includes('xác thực') || 
            err.message.includes('Unauthorized') || 
            err.message.toLowerCase().includes('token')
          )
      ) {
        console.log('Phiên đăng nhập hết hạn, đăng xuất và chuyển hướng');
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
        console.error('Error fetching branch statistics:', response.statusText);
        return null;
      }
      
      const data = await response.json();
      setStatistics(data);
      return data;
    } catch (err: any) {
      console.error('Error fetching branch statistics:', err);
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
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Lỗi khi lấy thông tin chi nhánh');
      }
      
      const data = await response.json();
      return transformBranch(data);
    } catch (err: any) {
      console.error('Error fetching branch details:', err);
      
      if (err.response?.status === 401 || err.message.includes('xác thực')) {
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
        contact: branchData.contact
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
      console.error('Error creating branch:', err);
      
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
    setLoading(true);
    setError(null);
    
    try {
      // Chuẩn bị dữ liệu để gửi đến API
      const apiData = {
        name: branchData.name,
        address: branchData.address,
        contact: branchData.contact
      };
      
      // Kiểm tra ID chi nhánh trước khi gửi yêu cầu
      if (!id || typeof id !== 'string' || id.trim() === '') {
        throw new Error('ID chi nhánh không hợp lệ');
      }
      
      console.log(`Đang gửi yêu cầu cập nhật cho branch ID: ${id}`, apiData);
      
      const response = await fetch(API_ENDPOINTS.BRANCH_DETAIL(id), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(apiData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Lỗi khi cập nhật chi nhánh');
      }
      
      const data = await response.json();
      
      // Cập nhật danh sách chi nhánh
      const updatedBranch = transformBranch(data);
      setBranches(prevBranches => 
        prevBranches.map(branch => 
          branch.id === id ? updatedBranch : branch
        )
      );
      
      toast.success('Cập nhật chi nhánh thành công!');
      return updatedBranch;
    } catch (err: any) {
      console.error('Error updating branch:', err);
      
      if (err.response?.status === 401 || err.message.includes('xác thực')) {
        toast.error('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại');
        await logout();
        router.push('/admin/auth/login');
      } else {
        setError(err.message || 'Có lỗi xảy ra khi cập nhật chi nhánh');
        toast.error(err.message || 'Có lỗi xảy ra khi cập nhật chi nhánh');
      }
      
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteBranch = async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      // Kiểm tra ID chi nhánh trước khi gửi yêu cầu
      if (!id || typeof id !== 'string' || id.trim() === '') {
        throw new Error('ID chi nhánh không hợp lệ');
      }

      const response = await fetch(API_ENDPOINTS.BRANCH_DETAIL(id), {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Lỗi khi xóa chi nhánh');
      }
      
      // Cập nhật danh sách chi nhánh
      setBranches(prevBranches => prevBranches.filter(branch => branch.id !== id));
      
      // Cập nhật thống kê
      fetchStatistics();
      
      toast.success('Xóa chi nhánh thành công!');
      return true;
    } catch (err: any) {
      console.error('Error deleting branch:', err);
      
      if (err.response?.status === 401 || err.message.includes('xác thực')) {
        toast.error('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại');
        await logout();
        router.push('/admin/auth/login');
      } else {
        setError(err.message || 'Có lỗi xảy ra khi xóa chi nhánh');
        toast.error(err.message || 'Có lỗi xảy ra khi xóa chi nhánh');
      }
      
      return false;
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
            console.log('Đang ở trang chi nhánh, tải dữ liệu chi nhánh...');
            // Thêm timeout nhỏ để đảm bảo accessToken đã được cập nhật đầy đủ
            setTimeout(() => {
              fetchBranches().catch(err => {
                console.error('Không thể tải dữ liệu chi nhánh:', err);
                // Error đã được xử lý trong fetchBranches, không cần throw
              });
            }, 300);
          } else {
            console.log('Không ở trang chi nhánh, bỏ qua việc tải dữ liệu chi nhánh');
          }
        } else {
          console.log('Chưa đăng nhập hoặc không có token, bỏ qua việc tải dữ liệu chi nhánh');
        }
      } catch (error) {
        console.error('Lỗi trong useEffect của BranchContext:', error);
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
    deleteBranch
  };

  return (
    <BranchContext.Provider value={value}>
      {children}
    </BranchContext.Provider>
  );
}; 