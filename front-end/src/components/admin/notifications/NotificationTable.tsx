import { useState } from 'react';
import { FiEdit2, FiTrash2, FiEye, FiToggleLeft, FiToggleRight } from 'react-icons/fi';
import { format } from 'date-fns';
import { Notification } from './NotificationForm';
import Pagination from '@/components/admin/common/Pagination';

// Định nghĩa kiểu dữ liệu cho props
interface NotificationTableProps {
  notifications: Notification[];
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
  currentPage?: number;
  totalPages?: number;
  totalItems?: number;
  itemsPerPage?: number;
  onPageChange?: (page: number) => void;
}

export default function NotificationTable({
  notifications,
  onView,
  onEdit,
  onDelete,
  onToggleStatus,
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange
}: NotificationTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Lọc thông báo theo từ khóa tìm kiếm, loại và trạng thái
  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || notification.type === typeFilter;
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && notification.isActive) ||
                         (statusFilter === 'inactive' && !notification.isActive);
    
    return matchesSearch && matchesType && matchesStatus;
  });

  // Hàm để hiển thị tên loại thông báo
  const getTypeText = (type: string) => {
    switch (type) {
      case 'voucher':
        return 'Mã giảm giá';
      case 'shipping':
        return 'Vận chuyển';
      case 'promotion':
        return 'Khuyến mãi';
      case 'system':
        return 'Hệ thống';
      default:
        return type;
    }
  };

  // Hàm để hiển thị màu cho loại thông báo
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'voucher':
        return 'bg-purple-100 text-purple-800';
      case 'shipping':
        return 'bg-blue-100 text-blue-800';
      case 'promotion':
        return 'bg-yellow-100 text-yellow-800';
      case 'system':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Format thời gian
  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return 'Không giới hạn';
    try {
      return format(new Date(date), 'dd/MM/yyyy');
    } catch (error) {
      return String(date);
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <div className="p-4 border-b">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Tìm kiếm */}
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm kiếm thông báo..."
              className="w-full md:w-80 pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="absolute left-3 top-2.5 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-2">
            {/* Lọc theo loại */}
            <div className="flex space-x-2">
              <button
                className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                  typeFilter === 'all' ? 'bg-pink-100 text-pink-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => setTypeFilter('all')}
              >
                Tất cả
              </button>
              <button
                className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                  typeFilter === 'voucher' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => setTypeFilter('voucher')}
              >
                Mã giảm giá
              </button>
              <button
                className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                  typeFilter === 'promotion' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => setTypeFilter('promotion')}
              >
                Khuyến mãi
              </button>
            </div>

            {/* Lọc theo trạng thái */}
            <div className="flex space-x-2">
              <button
                className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                  statusFilter === 'all' ? 'bg-pink-100 text-pink-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => setStatusFilter('all')}
              >
                Tất cả
              </button>
              <button
                className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                  statusFilter === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => setStatusFilter('active')}
              >
                Đang hiển thị
              </button>
              <button
                className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                  statusFilter === 'inactive' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => setStatusFilter('inactive')}
              >
                Đã ẩn
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nội dung
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Loại
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trạng thái
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thời gian hiển thị
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ngày tạo
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map((notification) => (
                <tr key={notification._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{notification.content}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeColor(notification.type)}`}>
                      {getTypeText(notification.type)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      notification.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {notification.isActive ? 'Đang hiển thị' : 'Đã ẩn'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(notification.startDate)} - {formatDate(notification.endDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(notification.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => onView(notification._id!)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Xem chi tiết"
                      >
                        <FiEye className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => onEdit(notification._id!)}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Chỉnh sửa"
                      >
                        <FiEdit2 className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => onToggleStatus(notification._id!)}
                        className={notification.isActive ? "text-orange-600 hover:text-orange-900" : "text-green-600 hover:text-green-900"}
                        title={notification.isActive ? "Ẩn thông báo" : "Hiển thị thông báo"}
                      >
                        {notification.isActive ? <FiToggleRight className="h-5 w-5" /> : <FiToggleLeft className="h-5 w-5" />}
                      </button>
                      <button
                        onClick={() => onDelete(notification._id!)}
                        className="text-red-600 hover:text-red-900"
                        title="Xóa thông báo"
                      >
                        <FiTrash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                  Không có thông báo nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Phân trang với component Pagination */}
      <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
        {currentPage && totalPages && totalItems && itemsPerPage && onPageChange && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            showItemsInfo={true}
            className="mt-4"
          />
        )}
      </div>
    </div>
  );
} 