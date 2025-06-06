import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FiEye } from 'react-icons/fi';
import { useAdminOrder } from '@/contexts/AdminOrderContext';

interface RecentOrder {
  id: string;
  customer: string;
  date: string;
  amount: string;
  status: string;
}

export default function RecentOrders() {
  const { orders, loading, fetchOrders } = useAdminOrder();
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);

  useEffect(() => {
    // Chỉ fetch một lần khi component mount
    if (!hasAttemptedFetch) {
      setHasAttemptedFetch(true);
      // Gọi API để lấy 5 đơn hàng gần đây nhất
      fetchOrders(1, 5);
    }
  }, [hasAttemptedFetch, fetchOrders]);

  useEffect(() => {
    // Cập nhật danh sách đơn hàng gần đây khi có dữ liệu thực từ API
    if (orders && orders.length > 0) {
      const formattedOrders = orders.map(order => ({
        id: order.orderNumber || order._id,
        customer: typeof order.userId === 'object' ? order.userId.name || order.userName || 'Khách hàng' : order.userName || 'Khách hàng',
        date: new Date(order.createdAt).toLocaleDateString('vi-VN'),
        amount: order.finalPrice.toLocaleString('vi-VN') + 'đ',
        status: order.status
      }));
      setRecentOrders(formattedOrders);
    }
  }, [orders]);

  // Hàm để hiển thị màu sắc dựa trên trạng thái đơn hàng
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Hàm để hiển thị tên trạng thái đơn hàng
  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Hoàn thành';
      case 'shipped':
        return 'Đang giao';
      case 'pending':
        return 'Chờ xử lý';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Đơn hàng gần đây</h3>
      </div>
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
                Trạng thái
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              // Hiển thị skeleton loading
              Array.from({ length: 5 }).map((_, index) => (
                <tr key={index} className="animate-pulse">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-4 bg-gray-200 rounded w-28"></div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="h-4 bg-gray-200 rounded w-8 ml-auto"></div>
                  </td>
                </tr>
              ))
            ) : recentOrders.length > 0 ? (
              recentOrders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {order.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {order.customer}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {order.date}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {order.amount}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                    {getStatusText(order.status)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Link href={`/admin/orders/${order.id}`} className="text-pink-600 hover:text-pink-900">
                    <FiEye className="h-5 w-5 inline" />
                  </Link>
                </td>
              </tr>
            ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  Chưa có đơn hàng nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
        <Link href="/admin/orders" className="text-sm font-medium text-pink-600 hover:text-pink-500">
          Xem tất cả đơn hàng
        </Link>
      </div>
    </div>
  );
}
