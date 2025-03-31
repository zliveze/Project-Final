import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { FiPlus, FiAlertCircle } from 'react-icons/fi';
import AdminLayout from '@/components/admin/AdminLayout';
import NotificationTable from '@/components/admin/notifications/NotificationTable';
import NotificationAddModal from '@/components/admin/notifications/NotificationAddModal';
import NotificationEditModal from '@/components/admin/notifications/NotificationEditModal';
import NotificationViewModal from '@/components/admin/notifications/NotificationViewModal';
import { Notification } from '@/components/admin/notifications/NotificationForm';
import toast from 'react-hot-toast';

export default function AdminNotifications() {
  const router = useRouter();
  // State quản lý dữ liệu
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State quản lý thống kê
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    expiringSoon: 0
  });
  
  // State quản lý các modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  // Fetch dữ liệu
  useEffect(() => {
    fetchNotifications();
    fetchStats();
  }, []);

  // Hàm tải danh sách thông báo
  const fetchNotifications = async (filters = {}) => {
    try {
      setLoading(true);
      
      const queryParams = new URLSearchParams();
      // Thêm các tham số lọc nếu có
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value.toString());
      });
      
      const response = await fetch(`/api/admin/notifications?${queryParams}`);
      
      if (!response.ok) {
        throw new Error('Không thể tải dữ liệu thông báo');
      }
      
      const result = await response.json();
      
      // Chuyển đổi chuỗi ngày thành đối tượng Date
      const formattedNotifications = result.data.map((notification: any) => ({
        ...notification,
        startDate: new Date(notification.startDate),
        endDate: notification.endDate ? new Date(notification.endDate) : null,
        createdAt: notification.createdAt ? new Date(notification.createdAt) : null,
        updatedAt: notification.updatedAt ? new Date(notification.updatedAt) : null
      }));
      
      setNotifications(formattedNotifications);
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu:', error);
      toast.error('Có lỗi xảy ra khi tải dữ liệu. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  // Hàm tải thống kê
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/notifications/stats');
      
      if (!response.ok) {
        throw new Error('Không thể tải dữ liệu thống kê');
      }
      
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Lỗi khi tải thống kê:', error);
      toast.error('Có lỗi xảy ra khi tải thống kê. Vui lòng thử lại sau.');
    }
  };

  // Xử lý xem chi tiết thông báo
  const handleViewNotification = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/notifications/${id}`);
      
      if (!response.ok) {
        throw new Error('Không thể tải chi tiết thông báo');
      }
      
      const notification = await response.json();
      
      // Chuyển đổi chuỗi ngày thành đối tượng Date
      const formattedNotification = {
        ...notification,
        startDate: new Date(notification.startDate),
        endDate: notification.endDate ? new Date(notification.endDate) : null,
        createdAt: notification.createdAt ? new Date(notification.createdAt) : null,
        updatedAt: notification.updatedAt ? new Date(notification.updatedAt) : null
      };
      
      setSelectedNotification(formattedNotification);
      setShowViewModal(true);
    } catch (error) {
      console.error('Lỗi khi tải chi tiết thông báo:', error);
      toast.error('Có lỗi xảy ra khi tải chi tiết thông báo.');
    }
  };

  // Xử lý mở modal chỉnh sửa thông báo
  const handleOpenEditModal = (id?: string) => {
    if (id) {
      handleViewNotification(id).then(() => {
        setShowEditModal(true);
        setShowViewModal(false);
      });
    } else if (selectedNotification) {
      setShowEditModal(true);
      setShowViewModal(false);
    }
  };

  // Xử lý chỉnh sửa thông báo
  const handleEditNotification = async (data: Partial<Notification>) => {
    try {
      if (!data._id) return;
      
      const response = await fetch(`/api/admin/notifications/${data._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Không thể cập nhật thông báo');
      }
      
      // Cập nhật lại danh sách và thống kê
      fetchNotifications();
      fetchStats();
      
      setShowEditModal(false);
      toast.success('Cập nhật thông báo thành công!');
    } catch (error) {
      console.error('Lỗi khi cập nhật thông báo:', error);
      toast.error('Có lỗi xảy ra khi cập nhật thông báo.');
    }
  };

  // Xử lý thêm thông báo mới
  const handleAddNotification = async (data: Partial<Notification>) => {
    try {
      const response = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Không thể thêm thông báo mới');
      }
      
      // Cập nhật lại danh sách và thống kê
      fetchNotifications();
      fetchStats();
      
      setShowAddModal(false);
      toast.success('Thêm thông báo mới thành công!');
    } catch (error) {
      console.error('Lỗi khi thêm thông báo:', error);
      toast.error('Có lỗi xảy ra khi thêm thông báo mới.');
    }
  };

  // Xử lý mở modal xóa thông báo
  const handleOpenDeleteModal = (id?: string) => {
    if (id) {
      handleViewNotification(id).then(() => {
        setShowDeleteModal(true);
        setShowViewModal(false);
      });
    } else if (selectedNotification) {
      setShowDeleteModal(true);
      setShowViewModal(false);
    }
  };

  // Xác nhận xóa thông báo
  const confirmDeleteNotification = async () => {
    try {
      if (!selectedNotification?._id) return;
      
      const response = await fetch(`/api/admin/notifications/${selectedNotification._id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Không thể xóa thông báo');
      }
      
      // Cập nhật lại danh sách và thống kê
      fetchNotifications();
      fetchStats();
      
      setShowDeleteModal(false);
      setSelectedNotification(null);
      toast.success('Xóa thông báo thành công!');
    } catch (error) {
      console.error('Lỗi khi xóa thông báo:', error);
      toast.error('Có lỗi xảy ra khi xóa thông báo.');
    }
  };

  // Xử lý thay đổi trạng thái thông báo
  const handleToggleStatus = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/notifications/${id}`, {
        method: 'PATCH',
      });
      
      if (!response.ok) {
        throw new Error('Không thể thay đổi trạng thái thông báo');
      }
      
      // Cập nhật lại danh sách và thống kê
      fetchNotifications();
      fetchStats();
      
      toast.success('Thay đổi trạng thái thông báo thành công!');
      
      // Cập nhật selected notification nếu đang xem
      if (selectedNotification && selectedNotification._id === id) {
        const updatedNotification = await response.json();
        setSelectedNotification({
          ...updatedNotification,
          startDate: new Date(updatedNotification.startDate),
          endDate: updatedNotification.endDate ? new Date(updatedNotification.endDate) : null,
          createdAt: updatedNotification.createdAt ? new Date(updatedNotification.createdAt) : null,
          updatedAt: updatedNotification.updatedAt ? new Date(updatedNotification.updatedAt) : null
        });
      }
    } catch (error) {
      console.error('Lỗi khi thay đổi trạng thái:', error);
      toast.error('Có lỗi xảy ra khi thay đổi trạng thái thông báo.');
    }
  };

  return (
    <AdminLayout title="Quản lý thông báo">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div className="flex items-center">
          <h2 className="text-lg font-medium text-gray-900">Danh sách thông báo</h2>
          <span className="ml-2 px-2 py-1 text-xs font-medium rounded-full bg-pink-100 text-pink-800">
            {stats.total} thông báo
          </span>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="mt-4 md:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
        >
          <FiPlus className="mr-2 -ml-1 h-5 w-5" />
          Thêm thông báo mới
        </button>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Thống kê thông báo</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-blue-500 text-lg font-semibold">{stats.total}</div>
            <div className="text-gray-500 text-sm">Tổng số thông báo</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-green-500 text-lg font-semibold">{stats.active}</div>
            <div className="text-gray-500 text-sm">Đang hiển thị</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="text-red-500 text-lg font-semibold">{stats.inactive}</div>
            <div className="text-gray-500 text-sm">Đã ẩn</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="text-yellow-500 text-lg font-semibold">{stats.expiringSoon}</div>
            <div className="text-gray-500 text-sm">Sắp hết hạn</div>
          </div>
        </div>
      </div>

      <div className="mt-4">
        {loading ? (
          <div className="bg-white shadow-md rounded-lg p-8 text-center">
            <div className="flex justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-pink-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <p className="mt-2 text-gray-600">Đang tải dữ liệu...</p>
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
      </div>

      {/* Modal thêm thông báo */}
      <NotificationAddModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddNotification}
      />

      {/* Modal chỉnh sửa thông báo */}
      {selectedNotification && (
        <NotificationEditModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSubmit={handleEditNotification}
          notification={selectedNotification}
        />
      )}

      {/* Modal xem chi tiết thông báo */}
      {selectedNotification && (
        <NotificationViewModal
          isOpen={showViewModal}
          onClose={() => setShowViewModal(false)}
          notification={selectedNotification}
          onEdit={() => handleOpenEditModal()}
          onDelete={() => handleOpenDeleteModal()}
          onToggleStatus={() => handleToggleStatus(selectedNotification._id!)}
        />
      )}

      {/* Modal xác nhận xóa thông báo */}
      {showDeleteModal && selectedNotification && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <FiAlertCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Xóa thông báo
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Bạn có chắc chắn muốn xóa thông báo này? Hành động này không thể hoàn tác.
                      </p>
                      <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-200">
                        <p className="font-medium text-gray-800">{selectedNotification.content}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={confirmDeleteNotification}
                >
                  Xóa
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
} 