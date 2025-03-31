import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FiUserPlus, FiRefreshCw, FiChevronDown } from 'react-icons/fi';
import { toast, Toaster } from 'react-hot-toast';
import UserTable, { User } from './users/UserTable';
import { useAdminUser } from '@/contexts/AdminUserContext';
import AdvancedSearch, { SearchValues } from './AdvancedSearch';
import Pagination from '@/components/admin/common/Pagination';

export const UserManagement: React.FC = () => {
  const [searchValues, setSearchValues] = useState<SearchValues>({
    searchTerm: '',
    filters: {
      status: 'all',
      role: 'all'
    },
    dateFrom: '',
    dateTo: ''
  });
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  
  // Sử dụng useRef để theo dõi active requests
  const activeRequest = useRef<boolean>(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const {
    users,
    stats,
    loading,
    currentPage,
    totalPages,
    fetchUsers,
    getUserDetail,
    updateUser,
    deleteUser,
    resetPassword
  } = useAdminUser();

  // Xử lý tải dữ liệu người dùng với debounce để tránh gọi API quá nhiều
  const loadUsers = useCallback(async () => {
    // Nếu đang có request đang chạy, hủy nó
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Nếu có active request đang chạy, đợi 100ms trước khi tiếp tục
    if (activeRequest.current) {
      debounceTimer.current = setTimeout(loadUsers, 100);
      return;
    }

    try {
      activeRequest.current = true;
      setIsRefreshing(true);
      await fetchUsers(
        currentPage,
        itemsPerPage,
        searchValues.searchTerm,
        searchValues.filters.status,
        searchValues.filters.role,
        searchValues.dateFrom,
        searchValues.dateTo
      );
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu người dùng:', error);
      toast.error('Không thể tải dữ liệu người dùng');
    } finally {
      setIsRefreshing(false);
      activeRequest.current = false;
    }
  }, [fetchUsers, currentPage, itemsPerPage, searchValues]);

  // Tải dữ liệu khi component mount và khi các dependency thay đổi
  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Xử lý tìm kiếm với debounce để tránh gọi API quá nhiều khi người dùng nhập liệu
  const handleSearch = (values: SearchValues) => {
    console.log('Received search values:', values);
    
    // Đảm bảo từ khóa tìm kiếm đã được chuẩn hóa
    const normalizedValues = {
      ...values,
      searchTerm: values.searchTerm.trim()
    };
    
    // In thông tin tìm kiếm chi tiết
    console.log('Search details:', {
      term: normalizedValues.searchTerm,
      termLength: normalizedValues.searchTerm.length,
      status: normalizedValues.filters.status,
      role: normalizedValues.filters.role,
      dateFrom: normalizedValues.dateFrom,
      dateTo: normalizedValues.dateTo
    });
    
    setSearchValues(normalizedValues);
    
    // Chỉ gọi API sau khi người dùng dừng nhập liệu một khoảng thời gian
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    // Gọi API ngay lập tức nếu là clearing search hoặc thay đổi bộ lọc
    const isClearing = normalizedValues.searchTerm === '' && searchValues.searchTerm !== '';
    const isFilterChange = JSON.stringify(normalizedValues.filters) !== JSON.stringify(searchValues.filters);
    const isDateChange = normalizedValues.dateFrom !== searchValues.dateFrom || normalizedValues.dateTo !== searchValues.dateTo;
    
    const hasSearchTerm = normalizedValues.searchTerm.length > 0;
    
    if (isClearing || isFilterChange || isDateChange) {
      console.log('Immediate search due to clearing/filter change');
      
      // Quay về trang đầu tiên khi tìm kiếm
      fetchUsers(
        1, 
        itemsPerPage, 
        normalizedValues.searchTerm, 
        normalizedValues.filters.status, 
        normalizedValues.filters.role,
        normalizedValues.dateFrom,
        normalizedValues.dateTo
      );
      
      // Nếu đang tìm kiếm bằng từ khóa, hiển thị thông báo sau 1 giây
      if (hasSearchTerm) {
        setTimeout(() => {
          // Kiểm tra nếu không có kết quả
          if (stats?.totalUsers === 0) {
            toast.custom(
              <div className="bg-blue-50 text-blue-700 px-4 py-3 rounded-md border border-blue-200 shadow-sm">
                Không tìm thấy người dùng phù hợp với từ khóa "{normalizedValues.searchTerm}"
              </div>
            );
          }
        }, 1000);
      }
    } else {
      debounceTimer.current = setTimeout(() => {
        console.log('Debounced search with term:', normalizedValues.searchTerm);
        // Quay về trang đầu tiên khi tìm kiếm
        fetchUsers(
          1, 
          itemsPerPage, 
          normalizedValues.searchTerm, 
          normalizedValues.filters.status, 
          normalizedValues.filters.role,
          normalizedValues.dateFrom,
          normalizedValues.dateTo
        );
        
        // Nếu đang tìm kiếm bằng từ khóa, hiển thị thông báo sau 1 giây
        if (hasSearchTerm) {
          setTimeout(() => {
            // Kiểm tra nếu không có kết quả
            if (stats?.totalUsers === 0) {
              toast.custom(
                <div className="bg-blue-50 text-blue-700 px-4 py-3 rounded-md border border-blue-200 shadow-sm">
                  Không tìm thấy người dùng phù hợp với từ khóa "{normalizedValues.searchTerm}"
                </div>
              );
            }
          }, 1000);
        }
      }, 300);
    }
  };

  // Làm mới dữ liệu với thông báo tiến trình
  const handleRefresh = () => {
    if (isRefreshing) return;
    
    const refreshToast = toast.loading('Đang tải lại dữ liệu...');
    setIsRefreshing(true);
    
    // Làm mới dữ liệu
    fetchUsers(
      currentPage,
      itemsPerPage,
      searchValues.searchTerm,
      searchValues.filters.status,
      searchValues.filters.role,
      searchValues.dateFrom,
      searchValues.dateTo
    )
      .then(() => {
        toast.success('Đã tải lại dữ liệu thành công', { id: refreshToast });
      })
      .catch((error) => {
        console.error('Lỗi khi làm mới dữ liệu:', error);
        toast.error('Không thể tải lại dữ liệu', { id: refreshToast });
      })
      .finally(() => {
        setIsRefreshing(false);
      });
  };

  // Xử lý phân trang với tối ưu hóa scroll và preload
  const handlePageChange = (page: number) => {
    // Ngăn chặn việc chuyển trang nếu đang tải dữ liệu
    if (activeRequest.current) return;
    
    // Luôn hiển thị trạng thái loading khi chuyển trang
    // Không cần kiểm tra cache vì fetchUsers sẽ tự động tắt loading nếu có cache
    activeRequest.current = true;
    
    // Gọi fetchUsers sẽ tự động hiển thị loading nếu cần thiết và tắt loading khi xong
    fetchUsers(
      page, 
      itemsPerPage, 
      searchValues.searchTerm, 
      searchValues.filters.status, 
      searchValues.filters.role, 
      searchValues.dateFrom, 
      searchValues.dateTo
    )
      .finally(() => {
        activeRequest.current = false;
      });
    
    // Cuộn lên đầu bảng với scroll behavior smooth
    const tableSection = document.getElementById('user-table-section');
    if (tableSection) {
      // Sử dụng requestAnimationFrame để đảm bảo scroll diễn ra sau khi DOM đã cập nhật
      requestAnimationFrame(() => {
        window.scrollTo({
          top: tableSection.offsetTop - 100, // -100 để có khoảng trống ở trên
          behavior: 'smooth'
        });
      });
    }
  };

  // Thay đổi số lượng item trên một trang với việc reset về trang 1
  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = parseInt(e.target.value, 10);
    setItemsPerPage(value);
    
    // Hiển thị loading toast
    const loadingToast = toast.loading(`Đang thay đổi hiển thị ${value} dòng trên mỗi trang...`);
    
    // Quay về trang 1 khi thay đổi số lượng hiển thị
    fetchUsers(
      1, 
      value, 
      searchValues.searchTerm, 
      searchValues.filters.status, 
      searchValues.filters.role, 
      searchValues.dateFrom, 
      searchValues.dateTo
    )
      .then(() => {
        toast.success(`Đã thay đổi hiển thị ${value} dòng trên mỗi trang`, { id: loadingToast });
      })
      .catch((error) => {
        console.error('Lỗi khi thay đổi số lượng hiển thị:', error);
        toast.error('Không thể thay đổi số lượng hiển thị', { id: loadingToast });
      });
  };
  
  // Xử lý xem chi tiết người dùng với tối ưu hóa cache
  const handleView = async (id: string) => {
    const loadingToast = toast.loading('Đang tải thông tin chi tiết...');
    try {
      const userDetail = await getUserDetail(id);
      toast.success('Đã tải thông tin chi tiết', { id: loadingToast });
      
      if (userDetail) {
        // Hiển thị modal và xử lý dữ liệu
      }
    } catch (error) {
      console.error('Lỗi khi lấy thông tin chi tiết người dùng:', error);
      toast.error('Không thể lấy thông tin chi tiết người dùng', { id: loadingToast });
    }
  };

  // Xử lý chỉnh sửa người dùng
  const handleEdit = async (id: string) => {
    const loadingToast = toast.loading('Đang tải thông tin người dùng...');
    try {
      const userDetail = await getUserDetail(id);
      toast.success('Đã tải thông tin người dùng', { id: loadingToast });
      
      if (userDetail) {
        // Hiển thị modal chỉnh sửa với dữ liệu người dùng
      }
    } catch (error) {
      console.error('Lỗi khi lấy thông tin người dùng để chỉnh sửa:', error);
      toast.error('Không thể lấy thông tin người dùng để chỉnh sửa', { id: loadingToast });
    }
  };

  // Xử lý xóa người dùng
  const handleDelete = (id: string) => {
    // Sử dụng confirm built-in thay vì modal để đơn giản hóa
    if (window.confirm('Bạn có chắc chắn muốn xóa người dùng này không?')) {
      const loadingToast = toast.loading('Đang xóa người dùng...');
      
      deleteUser(id)
        .then((success) => {
          if (success) {
            toast.success('Đã xóa người dùng thành công', { id: loadingToast });
          } else {
            toast.error('Không thể xóa người dùng', { id: loadingToast });
          }
        })
        .catch((error) => {
          console.error('Lỗi khi xóa người dùng:', error);
          toast.error('Không thể xóa người dùng', { id: loadingToast });
        });
    }
  };

  // Xử lý đặt lại mật khẩu
  const handleResetPassword = (id: string) => {
    // Sử dụng confirm built-in thay vì modal để đơn giản hóa
    if (window.confirm('Bạn có chắc chắn muốn đặt lại mật khẩu cho người dùng này?')) {
      const loadingToast = toast.loading('Đang đặt lại mật khẩu...');
      
      // Có thể tạo mật khẩu ngẫu nhiên hoặc dùng mật khẩu mặc định
      const newPassword = 'Password123!'; // Mật khẩu mặc định 
      
      resetPassword(id, newPassword)
        .then((success) => {
          if (success) {
            toast.success('Đã đặt lại mật khẩu thành công', { id: loadingToast });
          } else {
            toast.error('Không thể đặt lại mật khẩu', { id: loadingToast });
          }
        })
        .catch((error) => {
          console.error('Lỗi khi đặt lại mật khẩu:', error);
          toast.error('Không thể đặt lại mật khẩu', { id: loadingToast });
        });
    }
  };

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />
      
      <div className="bg-white shadow-md rounded-lg p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Quản lý người dùng</h2>
            <p className="mt-1 text-sm text-gray-500">
              Danh sách các tài khoản người dùng trong hệ thống
            </p>
          </div>
          
          <div className="flex space-x-3">
            <button 
              onClick={handleRefresh}
              className={`inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 ${isRefreshing ? 'opacity-75 cursor-not-allowed' : ''}`}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <>
                  <FiRefreshCw className="animate-spin mr-2" />
                  Đang tải...
                </>
              ) : (
                <>
                  <FiRefreshCw className="mr-2" />
                  Làm mới
                </>
              )}
            </button>
            
            <button
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
            >
              <FiUserPlus className="mr-2" />
              Thêm người dùng
            </button>
          </div>
        </div>
        
        <div className="mb-5">
          <AdvancedSearch 
            placeholder="Tìm theo tên, email, số điện thoại..." 
            filterGroups={[
              {
                id: 'status',
                label: 'Trạng thái',
                options: [
                  { id: 'all', label: 'Tất cả trạng thái', value: 'all' },
                  { id: 'active', label: 'Hoạt động', value: 'active' },
                  { id: 'inactive', label: 'Không hoạt động', value: 'inactive' },
                  { id: 'blocked', label: 'Đã khóa', value: 'blocked' }
                ]
              },
              {
                id: 'role',
                label: 'Vai trò',
                options: [
                  { id: 'all', label: 'Tất cả vai trò', value: 'all' },
                  { id: 'user', label: 'Người dùng', value: 'user' },
                  { id: 'admin', label: 'Quản trị viên', value: 'admin' }
                ]
              }
            ]}
            dateRange={true}
            onSearch={handleSearch}
            initialValues={searchValues}
          />
        </div>
        
        <div className="flex justify-end mb-4">
          <div className="flex items-center space-x-2 min-w-[130px]">
            <label htmlFor="itemsPerPage" className="text-sm text-gray-500 whitespace-nowrap mr-2">Hiển thị:</label>
            <div className="relative flex items-center w-full">
              <select
                id="itemsPerPage"
                value={itemsPerPage}
                onChange={handleItemsPerPageChange}
                className="appearance-none bg-white border border-gray-300 rounded-md py-1.5 pl-3 pr-8 text-sm text-gray-700 leading-tight focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 cursor-pointer w-full"
              >
                <option value={10}>10 dòng</option>
                <option value={30}>30 dòng</option>
                <option value={50}>50 dòng</option>
                <option value={100}>100 dòng</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <FiChevronDown size={14} />
              </div>
            </div>
          </div>
        </div>
        
        <div id="user-table-section">
          <UserTable 
            users={users}
            loading={loading}
            currentPage={currentPage}
            totalItems={stats?.totalUsers || 0}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onResetPassword={handleResetPassword}
          />
        </div>

        {/* Pagination component */}
        {totalPages > 1 && (
          <div className="mt-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              totalItems={stats?.totalUsers || 0}
              itemsPerPage={itemsPerPage}
              showItemsInfo={true}
              maxVisiblePages={5}
            />
          </div>
        )}
      </div>
    </div>
  );
}; 