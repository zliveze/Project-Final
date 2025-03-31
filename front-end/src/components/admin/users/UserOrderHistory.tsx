import React, { useState, useEffect } from 'react';
import { FiPackage, FiEye, FiFilter, FiCalendar, FiSearch, FiGrid, FiList, FiClock, FiCreditCard, FiMoreVertical, FiShoppingBag } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

interface OrderItem {
  orderId: string;
  date: string;
  totalPrice: number;
  status: 'pending' | 'shipped' | 'completed' | 'cancelled';
  items: number;
  paymentMethod: string;
}

interface UserOrderHistoryProps {
  orders: OrderItem[];
  onViewOrder: (orderId: string) => void;
  userId: string;
}

const UserOrderHistory: React.FC<UserOrderHistoryProps> = ({
  orders,
  onViewOrder,
  userId
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateSort, setDateSort] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Chờ xử lý';
      case 'shipped':
        return 'Đang giao';
      case 'completed':
        return 'Hoàn thành';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'shipped':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <FiClock className="w-4 h-4 mr-1" />;
      case 'shipped':
        return <FiPackage className="w-4 h-4 mr-1" />;
      case 'completed':
        return <FiShoppingBag className="w-4 h-4 mr-1" />;
      case 'cancelled':
        return <FiMoreVertical className="w-4 h-4 mr-1" />;
      default:
        return <FiPackage className="w-4 h-4 mr-1" />;
    }
  };

  // Lọc đơn hàng theo trạng thái
  const filteredOrders = orders.filter(order => {
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesSearch = 
      searchTerm === '' || 
      order.orderId.toLowerCase().includes(searchTerm.toLowerCase()) || 
      order.paymentMethod.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Sắp xếp đơn hàng theo ngày
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return dateSort === 'asc' ? dateA - dateB : dateB - dateA;
  });

  const toggleDateSort = () => {
    setDateSort(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const handleViewOrder = (orderId: string) => {
    setSelectedOrder(orderId);
    setIsLoading(true);
    toast.loading('Đang tải thông tin đơn hàng...');
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      toast.dismiss();
      toast.success('Đã tải thông tin đơn hàng');
      onViewOrder(orderId);
    }, 800);
  };

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden transition-all duration-300">
      <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 sm:mb-0 flex items-center">
          <FiShoppingBag className="mr-2 text-pink-500" />
          Lịch sử đơn hàng
          <span className="ml-2 bg-pink-100 text-pink-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
            {orders.length}
          </span>
        </h2>
        
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setViewMode('table')} 
            className={`p-2 rounded-md ${viewMode === 'table' ? 'bg-pink-100 text-pink-600' : 'text-gray-500 hover:bg-gray-100'}`}
            title="Chế độ xem bảng"
          >
            <FiList className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setViewMode('card')} 
            className={`p-2 rounded-md ${viewMode === 'card' ? 'bg-pink-100 text-pink-600' : 'text-gray-500 hover:bg-gray-100'}`}
            title="Chế độ xem thẻ"
          >
            <FiGrid className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {/* Thanh tìm kiếm và bộ lọc */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0 sm:space-x-4">
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-sm transition duration-150 ease-in-out"
              placeholder="Tìm kiếm đơn hàng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <div className="relative flex-grow sm:flex-grow-0">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiFilter className="h-5 w-5 text-gray-400" />
              </div>
              <select
                className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-sm transition duration-150 ease-in-out appearance-none"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="pending">Chờ xử lý</option>
                <option value="shipped">Đang giao</option>
                <option value="completed">Hoàn thành</option>
                <option value="cancelled">Đã hủy</option>
              </select>
            </div>
            
            <button
              onClick={toggleDateSort}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition duration-150 ease-in-out"
            >
              <FiCalendar className="mr-2 h-5 w-5 text-gray-400" />
              {dateSort === 'asc' ? 'Cũ nhất' : 'Mới nhất'}
            </button>
          </div>
        </div>
      </div>
      
      {sortedOrders.length === 0 ? (
        <div className="p-6 text-center text-gray-500">
          <FiPackage className="mx-auto h-12 w-12 text-gray-400 animate-bounce" />
          <p className="mt-2 text-lg font-medium">Không có đơn hàng nào</p>
          <p className="mt-1">Người dùng này chưa có đơn hàng nào.</p>
        </div>
      ) : viewMode === 'card' ? (
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedOrders.map((order) => (
            <div 
              key={order.orderId} 
              className={`bg-white p-4 rounded-lg border hover:shadow-lg transition-all duration-200 cursor-pointer ${
                selectedOrder === order.orderId ? 'ring-2 ring-pink-500' : ''
              }`}
              onClick={() => handleViewOrder(order.orderId)}
            >
              <div className="flex justify-between items-start mb-3">
                <span className="font-bold text-gray-800">#{order.orderId}</span>
                <span className={`flex items-center text-xs px-2 py-1 rounded-full border ${getStatusColor(order.status)}`}>
                  {getStatusIcon(order.status)}
                  {getStatusText(order.status)}
                </span>
              </div>
              
              <div className="flex items-center text-sm text-gray-600 mb-2">
                <FiCalendar className="mr-1 w-4 h-4" />
                <span>{order.date}</span>
              </div>
              
              <div className="flex items-center text-sm text-gray-600 mb-2">
                <FiShoppingBag className="mr-1 w-4 h-4" />
                <span>{order.items} sản phẩm</span>
              </div>
              
              <div className="flex items-center text-sm text-gray-600 mb-3">
                <FiCreditCard className="mr-1 w-4 h-4" />
                <span>{order.paymentMethod}</span>
              </div>
              
              <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                <span className="font-bold text-pink-600">{formatPrice(order.totalPrice)}</span>
                <button 
                  className="text-pink-600 hover:text-pink-800 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewOrder(order.orderId);
                  }}
                  disabled={isLoading}
                >
                  <FiEye className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mã đơn hàng
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày đặt
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sản phẩm
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tổng tiền
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phương thức
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
              {sortedOrders.map((order) => (
                <tr 
                  key={order.orderId} 
                  className={`hover:bg-gray-50 transition-colors duration-150 ${
                    selectedOrder === order.orderId ? 'bg-pink-50' : ''
                  }`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">#{order.orderId}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{order.date}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{order.items} sản phẩm</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatPrice(order.totalPrice)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.paymentMethod}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      {getStatusText(order.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      onClick={() => handleViewOrder(order.orderId)}
                      className="text-pink-600 hover:text-pink-900 transition-colors p-1 rounded-full hover:bg-pink-50"
                      title="Xem chi tiết đơn hàng"
                      disabled={isLoading}
                    >
                      <FiEye className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UserOrderHistory; 