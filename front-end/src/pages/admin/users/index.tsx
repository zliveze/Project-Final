import { useState, useEffect, useCallback, useMemo, Suspense, lazy } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import AdminLayout from '@/components/admin/AdminLayout';
import { UserNotifications } from '@/components/admin/users';
import { Toaster, toast } from 'react-hot-toast';
import { useAdminUser } from '@/contexts/AdminUserContext';
import { FiUserPlus, FiUsers, FiRefreshCw, FiChevronDown } from 'react-icons/fi';

// Lazy load các component không cần thiết ngay lập tức
const UserTable = dynamic(() => import('@/components/admin/users/UserTable'));
const AdvancedSearch = dynamic(() => import('@/components/admin/AdvancedSearch'));
const UserCreateModal = lazy(() => import('@/components/admin/users/UserCreateModal'));
const UserEditModal = lazy(() => import('@/components/admin/users/UserEditModal'));
const UserDetailModal = lazy(() => import('@/components/admin/users/UserDetailModal'));
const UserDeleteModal = lazy(() => import('@/components/admin/users/UserDeleteModal'));
const UserResetPasswordModal = lazy(() => import('@/components/admin/users/UserResetPasswordModal'));

// Tách UserGrowthChart ra để lazy load sau khi trang đã tải xong
const UserStats = lazy(() => import('@/components/admin/UserStats'));

// Component loading
const LoadingFallback = () => (
  <div className="w-full h-24 flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
);

export default function AdminUsers() {
  const router = useRouter();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedDetailUser, setSelectedDetailUser] = useState<any>(null);
  const [shouldShowStats, setShouldShowStats] = useState(false);

  // Sử dụng context để tương tác với API thay vì mock data
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
    resetPassword,
    updateUserStatus,
    updateUserRole,
    createUser
  } = useAdminUser();

  // State cho tìm kiếm và lọc (bao gồm cả ngày)
  const [searchValues, setSearchValues] = useState({
    searchTerm: '',
    filters: {
      status: 'all',
      role: 'all'
    },
    dateFrom: '', // Thêm dateFrom
    dateTo: ''    // Thêm dateTo
  });

  // Tải dữ liệu người dùng khi component được tải lần đầu
  useEffect(() => {
    // Tải dữ liệu ban đầu với các giá trị mặc định khi component mount
    // eslint-disable-next-line react-hooks/exhaustive-deps - Chỉ chạy khi component được tải lần đầu
    fetchUsers(1, itemsPerPage, searchValues.searchTerm, searchValues.filters.status, searchValues.filters.role, searchValues.dateFrom, searchValues.dateTo);
  }, []);

  // Lazy load UserStats sau khi trang đã tải
  useEffect(() => {
    const timer = setTimeout(() => {
      setShouldShowStats(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Xử lý tìm kiếm
  // Xử lý tìm kiếm (đã cập nhật để truyền tham số ngày)
  const handleSearch = useCallback((values: any) => {
    setSearchValues(values); // values đã chứa dateFrom, dateTo từ AdvancedSearch
    // Reset về trang đầu tiên khi thay đổi tìm kiếm, truyền cả tham số ngày
    fetchUsers(1, itemsPerPage, values.searchTerm, values.filters.status, values.filters.role, values.dateFrom, values.dateTo);
  }, [fetchUsers, itemsPerPage]);

  // Xử lý phân trang (đã cập nhật để truyền tham số ngày)
  const handlePageChange = useCallback((page: number) => {
    // Không cần tạo cacheKey ở đây nữa

    // Luôn hiển thị loading và để fetchUsers tự quản lý cache
    // Truyền cả tham số ngày từ state searchValues
    fetchUsers(page, itemsPerPage, searchValues.searchTerm, searchValues.filters.status, searchValues.filters.role, searchValues.dateFrom, searchValues.dateTo);

    // Cuộn lên đầu bảng khi chuyển trang với hiệu ứng mượt mà
    const tableSection = document.getElementById('user-table-section');
    if (tableSection) {
      window.scrollTo({
        top: tableSection.offsetTop - 100,
        behavior: 'smooth'
      });
    }
  }, [fetchUsers, itemsPerPage, searchValues]);

  // Làm mới dữ liệu (đã cập nhật để truyền tham số ngày)
  const handleRefresh = useCallback(() => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    const refreshToast = toast.loading('Đang tải lại dữ liệu người dùng...', { id: 'refresh-data' });

    // Truyền cả tham số ngày từ state searchValues
    fetchUsers(currentPage, itemsPerPage, searchValues.searchTerm, searchValues.filters.status, searchValues.filters.role, searchValues.dateFrom, searchValues.dateTo)
      .then(() => {
        toast.success('Đã tải lại dữ liệu thành công', { id: refreshToast });
      })
      .catch((error) => {
        console.error('Error refreshing user data:', error);
        toast.error('Không thể tải lại dữ liệu', { id: refreshToast });
      })
      .finally(() => {
        setIsRefreshing(false);
      });
  }, [currentPage, fetchUsers, isRefreshing, itemsPerPage, searchValues]);

  // Thay đổi số lượng items trên một trang (đã cập nhật để truyền tham số ngày)
  const handleItemsPerPageChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = parseInt(e.target.value, 10);
    setItemsPerPage(value);

    const loadingToast = toast.loading(`Đang thay đổi hiển thị ${value} dòng...`, { id: 'items-per-page-change' });

    // Luôn quay về trang 1 khi thay đổi số lượng hiển thị trên mỗi trang
    // Truyền cả tham số ngày từ state searchValues
    fetchUsers(1, value, searchValues.searchTerm, searchValues.filters.status, searchValues.filters.role, searchValues.dateFrom, searchValues.dateTo)
      .then(() => {
        toast.success(`Đã thay đổi hiển thị ${value} dòng trên mỗi trang`, { id: loadingToast });
      })
      .catch((error) => {
        console.error('Error changing items per page:', error);
        toast.error('Không thể thay đổi số lượng hiển thị', { id: loadingToast });
      });
  }, [fetchUsers, searchValues]);

  // Các hàm xử lý cho user detail, edit, delete và reset password
  // Lưu ý: Sử dụng toast ID để tránh toast trùng lặp
  const handleView = useCallback(async (id: string) => {
    const loadingToast = toast.loading('Đang tải thông tin chi tiết...', { id: `view-${id}` });

    try {
      const userDetail = await getUserDetail(id);
      if (userDetail) {
        setSelectedDetailUser(userDetail);
        setShowDetailModal(true);
        toast.success('Đã tải thông tin chi tiết', { id: loadingToast });
      } else {
        toast.error('Không tìm thấy thông tin người dùng', { id: loadingToast });
      }
    } catch (error) {
      console.error('Error fetching user detail:', error);
      toast.error('Không thể tải thông tin chi tiết người dùng', { id: loadingToast });
    }
  }, [getUserDetail]);

  const handleEdit = useCallback(async (id: string) => {
    const loadingToast = toast.loading('Đang tải thông tin người dùng...', { id: `edit-${id}` });

    try {
      const userDetail = await getUserDetail(id);
      if (userDetail) {
        setSelectedUser(userDetail);
        setShowEditModal(true);
        toast.success('Đã tải thông tin người dùng', { id: loadingToast });
      } else {
        toast.error('Không tìm thấy thông tin người dùng', { id: loadingToast });
      }
    } catch (error) {
      console.error('Error fetching user detail for edit:', error);
      toast.error('Không thể tải thông tin người dùng để chỉnh sửa', { id: loadingToast });
    }
  }, [getUserDetail]);

  const handleDelete = useCallback((id: string) => {
    // Hiển thị modal xác nhận xóa
    setSelectedUserId(id);
    setShowDeleteModal(true);
    // Hiển thị cảnh báo
    UserNotifications.warning.confirmDelete();
  }, []);

  const handleResetPassword = useCallback((id: string) => {
    // Hiển thị modal xác nhận đặt lại mật khẩu
    setSelectedUserId(id);
    setShowResetPasswordModal(true);
    // Hiển thị thông tin
    UserNotifications.info.resetPasswordInfo();
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!selectedUserId) return;

    const loadingToast = toast.loading('Đang xóa người dùng...', { id: `delete-${selectedUserId}` });

    try {
      const success = await deleteUser(selectedUserId);
      if (success) {
        toast.success('Xóa người dùng thành công', { id: loadingToast });
      } else {
        toast.error('Không thể xóa người dùng', { id: loadingToast });
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Không thể xóa người dùng', { id: loadingToast });
    } finally {
      setShowDeleteModal(false);
    }
  }, [deleteUser, selectedUserId]);

  const confirmResetPassword = useCallback(async (password: string) => {
    if (!selectedUserId) return;

    const loadingToast = toast.loading('Đang đặt lại mật khẩu...', { id: `reset-${selectedUserId}` });

    try {
      const success = await resetPassword(selectedUserId, password);
      if (success) {
        toast.success('Đặt lại mật khẩu thành công', { id: loadingToast });
      } else {
        toast.error('Không thể đặt lại mật khẩu', { id: loadingToast });
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error('Không thể đặt lại mật khẩu', { id: loadingToast });
    } finally {
      setShowResetPasswordModal(false);
    }
  }, [resetPassword, selectedUserId]);

  // Hiển thị giao diện chính với lazy loading cho các phần không quan trọng
  return (
    <AdminLayout title="Quản lý người dùng">
      <Toaster position="top-right" />
      <div className="space-y-6">
        {/* Phần header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-xl font-bold text-gray-800">Quản lý người dùng</h1>
              <p className="mt-1 text-gray-500 text-sm">Quản lý tất cả tài khoản người dùng trong hệ thống</p>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={handleRefresh}
                className={`inline-flex items-center px-3 py-2 border border-gray-200 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${isRefreshing ? 'opacity-75 cursor-not-allowed' : ''}`}
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
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FiUserPlus className="mr-2" />
                Thêm người dùng
              </button>
            </div>
          </div>

          {/* Hiển thị thông số người dùng */}
          {shouldShowStats && (
            <Suspense fallback={<LoadingFallback />}>
              <UserStats stats={stats} />
            </Suspense>
          )}
        </div>

        {/* Bộ lọc và tìm kiếm */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
          <AdvancedSearch
            placeholder="Tìm kiếm theo tên, email, số điện thoại..."
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
                  { id: 'admin', label: 'Quản trị viên', value: 'admin' },
                  { id: 'superadmin', label: 'Super Admin', value: 'superadmin' }
                ]
              }
            ]}
            dateRange={true}
            onSearch={handleSearch}
            initialValues={searchValues}
          />

          <div className="flex justify-end mt-4">
            <div className="flex items-center space-x-2 min-w-[130px]">
              <label htmlFor="itemsPerPage" className="text-sm text-gray-500 whitespace-nowrap mr-2">Hiển thị:</label>
              <div className="relative flex items-center w-full">
                <select
                  id="itemsPerPage"
                  value={itemsPerPage}
                  onChange={handleItemsPerPageChange}
                  className="appearance-none bg-white border border-gray-200 rounded-md py-1.5 pl-3 pr-8 text-sm text-gray-700 leading-tight focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer w-full"
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
        </div>

        {/* Bảng dữ liệu người dùng */}
        <div id="user-table-section" className="bg-white rounded-lg shadow-sm border border-gray-100">
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
      </div>

      {/* Modals - chỉ render khi cần thiết */}
      {showCreateModal && (
        <Suspense fallback={<LoadingFallback />}>
          <UserCreateModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onSubmit={(userData: any) => {
              createUser(userData).then(() => {
                setShowCreateModal(false);
                handleRefresh();
              });
            }}
          />
        </Suspense>
      )}

      {showEditModal && selectedUser && (
        <Suspense fallback={<LoadingFallback />}>
          <UserEditModal
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            user={selectedUser}
            onSubmit={async (userData: any) => {
              try {
                await updateUser(userData._id, userData);
                // Tải lại dữ liệu sau khi cập nhật thành công
                handleRefresh();
                return true; // Báo cho component con biết đã xử lý thành công
              } catch (error) {
                console.error('Lỗi khi cập nhật người dùng:', error);
                throw error; // Ném lỗi để component con xử lý
              }
            }}
          />
        </Suspense>
      )}

      {showDetailModal && selectedDetailUser && (
        <Suspense fallback={<LoadingFallback />}>
          <UserDetailModal
            isOpen={showDetailModal}
            onClose={() => setShowDetailModal(false)}
            user={selectedDetailUser}
            onEdit={handleEdit}
          />
        </Suspense>
      )}

      {showDeleteModal && selectedUserId && (
        <Suspense fallback={<LoadingFallback />}>
          <UserDeleteModal
            isOpen={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            onDelete={() => confirmDelete()}
            _id={selectedUserId}
          />
        </Suspense>
      )}

      {showResetPasswordModal && selectedUserId && (
        <Suspense fallback={<LoadingFallback />}>
          <UserResetPasswordModal
            isOpen={showResetPasswordModal}
            onClose={() => setShowResetPasswordModal(false)}
            onResetPassword={(password: string) => confirmResetPassword(password)}
            _id={selectedUserId}
          />
        </Suspense>
      )}
    </AdminLayout>
  );
}
