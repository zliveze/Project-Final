import { useState } from 'react';
import Link from 'next/link';
import { FiEye } from 'react-icons/fi';

// Dữ liệu mẫu cho đơn hàng gần đây
const sampleOrders = [
  {
    id: 'ORD-001',
    customer: 'Nguyễn Văn A',
    date: '15/03/2025',
    amount: '1,250,000đ',
    status: 'completed'
  },
  {
    id: 'ORD-002',
    customer: 'Trần Thị B',
    date: '14/03/2025',
    amount: '850,000đ',
    status: 'shipped'
  },
  {
    id: 'ORD-003',
    customer: 'Lê Văn C',
    date: '14/03/2025',
    amount: '2,100,000đ',
    status: 'pending'
  },
  {
    id: 'ORD-004',
    customer: 'Phạm Thị D',
    date: '13/03/2025',
    amount: '750,000đ',
    status: 'cancelled'
  },
  {
    id: 'ORD-005',
    customer: 'Hoàng Văn E',
    date: '12/03/2025',
    amount: '1,800,000đ',
    status: 'shipped'
  }
];

export default function RecentOrders() {
  const [orders] = useState(sampleOrders);

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
            {orders.map((order) => (
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
            ))}
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