import React, { useState, useEffect } from 'react';
import { FiEye, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { useAdminOrder } from '@/contexts';

// Component hiển thị trạng thái đơn hàng
interface OrderStatusBadgeProps {
  status: string;
}

function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  // Hàm để hiển thị màu sắc dựa trên trạng thái đơn hàng
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'shipped':
      case 'shipping':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'processing':
        return 'bg-purple-100 text-purple-800';
      case 'confirmed':
        return 'bg-indigo-100 text-indigo-800';
      case 'returned':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Hàm để hiển thị tên trạng thái đơn hàng
  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'delivered':
        return 'Hoàn thành';
      case 'shipped':
      case 'shipping':
        return 'Đang giao';
      case 'pending':
        return 'Chờ xử lý';
      case 'cancelled':
        return 'Đã hủy';
      case 'processing':
        return 'Đang xử lý';
      case 'confirmed':
        return 'Đã xác nhận';
      case 'returned':
        return 'Đã trả hàng';
      default:
        return status;
    }
  };

  return (
    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(status)}`}>
      {getStatusText(status)}
    </span>
  );
}

// Component hiển thị trạng thái thanh toán
interface PaymentStatusBadgeProps {
  status: string;
}

function PaymentStatusBadge({ status }: PaymentStatusBadgeProps) {
  // Hàm để hiển thị màu sắc dựa trên trạng thái thanh toán
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Hàm để hiển thị tên trạng thái thanh toán
  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'Đã thanh toán';
      case 'pending':
        return 'Chờ thanh toán';
      case 'failed':
        return 'Thanh toán thất bại';
      case 'refunded':
        return 'Đã hoàn tiền';
      default:
        return status;
    }
  };

  return (
    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(status)}`}>
      {getStatusText(status)}
    </span>
  );
}

// Component tìm kiếm và lọc
interface OrderSearchFilterProps {
  onSearch: (term: string) => void;
  onStatusChange: (status: string) => void;
  selectedStatus: string;
}

function OrderSearchFilter({ onSearch, onStatusChange, selectedStatus }: OrderSearchFilterProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearch(value);
  };

  return (
    <div className="p-6 border-b border-gray-200">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
        <div className="w-full md:w-1/3">
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm kiếm đơn hàng..."
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <select
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="pending">Chờ xử lý</option>
            <option value="confirmed">Đã xác nhận</option>
            <option value="processing">Đang xử lý</option>
            <option value="shipping">Đang giao</option>
            <option value="delivered">Hoàn thành</option>
            <option value="cancelled">Đã hủy</option>
            <option value="returned">Đã trả hàng</option>
          </select>
        </div>
      </div>
    </div>
  );
}

// Component các nút thao tác
interface OrderActionsProps {
  orderId: string;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

function OrderActions({ orderId, onView, onEdit, onDelete }: OrderActionsProps) {
  return (
    <div className="flex items-center justify-end space-x-2">
      <button
        onClick={() => onView(orderId)}
        className="text-gray-600 hover:text-gray-900"
        title="Xem chi tiết"
      >
        <FiEye className="h-5 w-5" />
      </button>
      <button
        onClick={() => onEdit(orderId)}
        className="text-blue-600 hover:text-blue-900"
        title="Chỉnh sửa"
      >
        <FiEdit2 className="h-5 w-5" />
      </button>
      <button
        onClick={() => onDelete(orderId)}
        className="text-red-600 hover:text-red-900"
        title="Xóa"
      >
        <FiTrash2 className="h-5 w-5" />
      </button>
    </div>
  );
}

// Component phân trang
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
}

function Pagination({ currentPage, totalPages, onPageChange, totalItems }: PaginationProps) {
  const [pageInput, setPageInput] = useState('');
  const itemsPerPage = 10; // Giả sử mỗi trang hiển thị 10 mục

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPageInput(e.target.value);
  };

  const handleGoToPage = () => {
    const page = parseInt(pageInput);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      onPageChange(page);
      setPageInput('');
    } else {
      toast.error(`Vui lòng nhập số trang từ 1 đến ${totalPages}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleGoToPage();
    }
  };

  return (
    <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
      <div className="flex flex-col md:flex-row items-center justify-between">
        <div className="text-sm text-gray-500 mb-2 md:mb-0">
          Hiển thị {Math.min(totalItems, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(currentPage * itemsPerPage, totalItems)} / {totalItems} đơn hàng
        </div>
        <div className="flex items-center space-x-2">
          <button
            className={`px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-100 ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
            disabled={currentPage === 1}
          >
            Trước
          </button>

          <div className="flex items-center space-x-1">
            <input
              type="text"
              className="w-12 px-2 py-1 border border-gray-300 rounded-md text-sm text-center"
              placeholder={currentPage.toString()}
              value={pageInput}
              onChange={handlePageInputChange}
              onKeyDown={handleKeyDown}
            />
            <span className="text-sm text-gray-500">/ {totalPages}</span>
            <button
              className="px-2 py-1 bg-gray-200 rounded-md text-sm text-gray-700 hover:bg-gray-300"
              onClick={handleGoToPage}
            >
              Đi
            </button>
          </div>

          <button
            className={`px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-100 ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Sau
          </button>
        </div>
      </div>
    </div>
  );
}

// Component AdminOrderList chính
interface AdminOrderListProps {
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function AdminOrderList({ onView, onEdit, onDelete }: AdminOrderListProps) {
  const {
    orders,
    loading,
    error,
    totalPages,
    currentPage,
    totalItems,
    fetchOrders,
    setFilters
  } = useAdminOrder();

  const [selectedStatus, setSelectedStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Xử lý tìm kiếm
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setFilters(prev => ({ ...prev, search: term }));
  };

  // Xử lý thay đổi trạng thái
  const handleStatusChange = (status: string) => {
    setSelectedStatus(status);
    setFilters(prev => ({ ...prev, status }));
  };

  // Xử lý thay đổi trang
  const handlePageChange = (page: number) => {
    fetchOrders(page);
  };

  // Hàm định dạng số tiền thành VND
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Hàm định dạng ngày tháng
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Hiển thị thông báo loading
  if (loading) {
    return (
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="p-6 text-center">
          <div className="animate-pulse text-gray-500">Đang tải dữ liệu đơn hàng...</div>
        </div>
      </div>
    );
  }

  // Hiển thị thông báo lỗi
  if (error) {
    return (
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="p-6 text-center">
          <div className="text-red-500">Có lỗi xảy ra khi tải dữ liệu đơn hàng: {error}</div>
          <button
            className="mt-4 px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700"
            onClick={() => fetchOrders(currentPage)}
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <OrderSearchFilter
        onSearch={handleSearch}
        onStatusChange={handleStatusChange}
        selectedStatus={selectedStatus}
      />

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mã đơn hàng
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Khách hàng
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ngày đặt
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tổng tiền
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phương thức
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thanh toán
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trạng thái
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.length > 0 ? (
              orders.map((order) => (
                <tr key={order._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {order.orderNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {typeof order.userId === 'object'
                        ? (order.userId as any)?.name || order.userName || 'Khách hàng'
                        : order.userName || 'Khách hàng'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {typeof order.userId === 'object'
                        ? (order.userId as any)?.email || order.userEmail || 'Email không có'
                        : order.userEmail || 'Email không có'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(order.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatCurrency(order.finalPrice)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.paymentMethod === 'cod' ? 'COD' :
                     order.paymentMethod === 'bank_transfer' ? 'Chuyển khoản' :
                     order.paymentMethod === 'credit_card' ? 'Thẻ tín dụng' :
                     order.paymentMethod === 'stripe' ? 'Stripe' :
                     order.paymentMethod === 'momo' ? 'MoMo' : order.paymentMethod}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <PaymentStatusBadge status={order.paymentStatus} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <OrderStatusBadge status={order.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <OrderActions
                      orderId={order._id}
                      onView={onView}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                  Không tìm thấy đơn hàng nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        totalItems={totalItems}
      />
    </div>
  );
}
