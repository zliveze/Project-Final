import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { FiPlus, FiAlertCircle } from 'react-icons/fi';
import AdminLayout from '@/components/admin/AdminLayout';
import NotificationTable from '@/components/admin/notifications/NotificationTable';
import NotificationAddModal from '@/components/admin/notifications/NotificationAddModal';
import NotificationEditModal from '@/components/admin/notifications/NotificationEditModal';
import NotificationViewModal from '@/components/admin/notifications/NotificationViewModal';
import { useNotification } from '@/contexts/NotificationContext';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ConfirmModal from '@/components/common/ConfirmModal';

export default function AdminNotifications() {
  const router = useRouter();
  
  // Sử dụng NotificationContext
  const { 
    notifications, 
    stats, 
    paginatedData,
    isLoading, 
    error,
    selectedNotification,
    getNotifications,
    getStatistics,
    getNotificationById,
    createNotification,
    updateNotification,
    toggleNotificationStatus,
    deleteNotification
  } = useNotification();
  
  // State quản lý các modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Query params cho search và filter
  const [queryParams, setQueryParams] = useState({
    page: 1,
    limit: 10,
    search: '',
    type: '',
    isActive: undefined,
    sortBy: 'priority',
    sortOrder: 'asc' as 'asc' | 'desc'
  });

  // Fetch dữ liệu
  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      if (isMounted) {
        await getNotifications(queryParams);
        // Chỉ gọi getStatistics khi tải lần đầu hoặc khi thay đổi số lượng item hiển thị
        if (queryParams.page === 1) {
          await getStatistics();
        }
      }
    };
    
    fetchData();
    
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryParams.page, queryParams.limit]);

  // Xử lý thay đổi params
  const handleParamsChange = (newParams: Partial<typeof queryParams>) => {
    const updatedParams = { ...queryParams, ...newParams, page: 1 };
    setQueryParams(updatedParams); // Reset về trang 1 khi lọc
    // Không cần gọi getNotifications riêng ở đây vì useEffect sẽ bắt sự thay đổi của queryParams
  };

  // Xử lý xem chi tiết thông báo
  const handleViewNotification = async (id: string) => {
    await getNotificationById(id);
    setShowViewModal(true);
  };

  // Xử lý mở modal chỉnh sửa thông báo
  const handleOpenEditModal = (id: string) => {
    getNotificationById(id).then(() => {
      setShowEditModal(true);
      setShowViewModal(false);
    });
  };

  // Xử lý chỉnh sửa thông báo
  const handleEditNotification = async (data: any) => {
    if (!data._id) return;
    const success = await updateNotification(data._id, data);
    if (success) {
      setShowEditModal(false);
    }
  };

  // Xử lý thêm thông báo mới
  const handleAddNotification = async (data: any) => {
    const success = await createNotification(data);
    if (success) {
      setShowAddModal(false);
    }
  };

  // Xử lý mở modal xóa thông báo
  const handleOpenDeleteModal = (id: string) => {
    getNotificationById(id).then(() => {
      setShowDeleteModal(true);
      setShowViewModal(false);
    });
  };

  // Xác nhận xóa thông báo
  const confirmDeleteNotification = async () => {
    if (!selectedNotification?._id) return;
    
    const success = await deleteNotification(selectedNotification._id);
    if (success) {
      setShowDeleteModal(false);
    }
  };

  // Xử lý thay đổi trạng thái thông báo
  const handleToggleStatus = async (id: string) => {
    await toggleNotificationStatus(id);
  };

  // Render các thẻ thống kê
  const renderStats = () => {
    if (!stats) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mr-4">
                <span className="animate-pulse">...</span>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Đang tải...</p>
                <p className="text-2xl font-bold">-</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mr-4">
                <span className="animate-pulse">...</span>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Đang tải...</p>
                <p className="text-2xl font-bold">-</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mr-4">
                <span className="animate-pulse">...</span>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Đang tải...</p>
                <p className="text-2xl font-bold">-</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mr-4">
                <span className="animate-pulse">...</span>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Đang tải...</p>
                <p className="text-2xl font-bold">-</p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Tổng số thông báo</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Đang hiển thị</p>
              <p className="text-2xl font-bold">{stats.active}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Đã ẩn</p>
              <p className="text-2xl font-bold">{stats.inactive}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Sắp hết hạn</p>
              <p className="text-2xl font-bold">{stats.expiringSoon}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render phân trang
  const renderPagination = () => {
    if (!paginatedData) return null;
    
    const { page, totalPages, total, limit } = paginatedData;
    
    return (
      <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Hiển thị <span className="font-medium">{((page - 1) * limit) + 1}</span> đến <span className="font-medium">{Math.min(page * limit, total)}</span> trong số <span className="font-medium">{total}</span> thông báo
            </p>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button
                disabled={page <= 1}
                onClick={() => setQueryParams(prev => ({ ...prev, page: prev.page - 1 }))}
                className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                  page <= 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <span className="sr-only">Trang trước</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={i}
                    onClick={() => setQueryParams(prev => ({ ...prev, page: pageNum }))}
                    className={`relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium ${
                      page === pageNum ? 'bg-pink-50 text-pink-600 z-10' : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              {totalPages > 5 && (
                <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                  ...
                </span>
              )}
              
              {totalPages > 5 && (
                <button
                  onClick={() => setQueryParams(prev => ({ ...prev, page: totalPages }))}
                  className={`relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium ${
                    page === totalPages ? 'bg-pink-50 text-pink-600 z-10' : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {totalPages}
                </button>
              )}
              
              <button
                disabled={page >= totalPages}
                onClick={() => setQueryParams(prev => ({ ...prev, page: prev.page + 1 }))}
                className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                  page >= totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <span className="sr-only">Trang sau</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </nav>
          </div>
        </div>
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
        <div className="sm:flex sm:justify-between sm:items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quản lý thông báo</h1>
            <p className="mt-1 text-sm text-gray-500">
              Quản lý các thông báo hiển thị trên trang người dùng
            </p>
          </div>

          <div className="mt-4 sm:mt-0">
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
            >
              <FiPlus className="mr-2 -ml-1 h-5 w-5" aria-hidden="true" />
              Thêm thông báo mới
            </button>
          </div>
        </div>

        {/* Thống kê */}
        {renderStats()}

        {/* Hiển thị thông báo lỗi */}
        {error && (
          <div className="mb-4 bg-red-50 p-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <FiAlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Đã xảy ra lỗi</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bảng thông báo */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner />
          </div>
        ) : (
          <NotificationTable
            notifications={notifications}
            onView={handleViewNotification}
            onEdit={handleOpenEditModal}
            onDelete={handleOpenDeleteModal}
            onToggleStatus={handleToggleStatus}
          />
        )}

        {/* Phân trang */}
        {renderPagination()}

        {/* Modals */}
        {showAddModal && (
          <NotificationAddModal
            isOpen={showAddModal}
            onClose={() => setShowAddModal(false)}
            onSubmit={handleAddNotification}
          />
        )}

        {showEditModal && selectedNotification && (
          <NotificationEditModal
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            onSubmit={handleEditNotification}
            notification={selectedNotification}
          />
        )}

        {showViewModal && selectedNotification && (
          <NotificationViewModal
            isOpen={showViewModal}
            onClose={() => setShowViewModal(false)}
            notification={selectedNotification}
            onEdit={() => {
              setShowEditModal(true);
              setShowViewModal(false);
            }}
            onDelete={() => {
              setShowDeleteModal(true);
              setShowViewModal(false);
            }}
            onToggleStatus={() => toggleNotificationStatus(selectedNotification._id!)}
          />
        )}

        {/* Confirm Delete Modal */}
        {showDeleteModal && selectedNotification && (
          <ConfirmModal
            isOpen={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            onConfirm={confirmDeleteNotification}
            title="Xác nhận xóa thông báo"
            message={`Bạn có chắc chắn muốn xóa thông báo "${selectedNotification.content}"? Hành động này không thể hoàn tác.`}
            confirmText="Xóa thông báo"
            cancelText="Hủy"
            confirmButtonClass="bg-red-600 hover:bg-red-700"
          />
        )}
      </div>
    </AdminLayout>
  );
} 