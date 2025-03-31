import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FiEye, FiEdit2, FiTrash2, FiMoreVertical, FiSearch, FiFilter, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

// Định nghĩa interface cho dữ liệu đơn hàng dựa trên model
interface Product {
  productId: string;
  variantId: string;
  options: {
    shade: string;
    size: string;
  };
  quantity: number;
  price: number;
}

interface Voucher {
  voucherId: string;
  discountAmount: number;
}

interface ShippingInfo {
  address: string;
  contact: string;
}

interface Order {
  _id: string;
  userId: string;
  userName?: string; // Tên khách hàng
  userEmail?: string; // Email khách hàng
  products: Product[];
  totalPrice: number;
  voucher?: Voucher;
  finalPrice: number;
  status: string; // ["pending", "shipped", "completed", "cancelled"]
  shippingInfo: ShippingInfo;
  branchId?: string;
  paymentMethod?: string; // Phương thức thanh toán
  paymentStatus?: string; // Trạng thái thanh toán
  createdAt: string;
  updatedAt: string;
  // Các trường tạm thời cho dữ liệu mẫu
  customer?: string; // Sẽ loại bỏ sau khi kết nối API thực tế
  email?: string; // Sẽ loại bỏ sau khi kết nối API thực tế
  date?: string; // Sẽ loại bỏ sau khi kết nối API thực tế
  amount?: string; // Sẽ loại bỏ sau khi kết nối API thực tế
  id?: string; // Sẽ loại bỏ sau khi kết nối API thực tế
}

// Dữ liệu mẫu cho đơn hàng
const sampleOrders = [
  {
    id: 'ORD-001',
    customer: 'Nguyễn Văn A',
    email: 'nguyenvana@example.com',
    date: '15/03/2025',
    amount: '1,250,000đ',
    paymentMethod: 'COD',
    status: 'completed'
  },
  {
    id: 'ORD-002',
    customer: 'Trần Thị B',
    email: 'tranthib@example.com',
    date: '14/03/2025',
    amount: '850,000đ',
    paymentMethod: 'Banking',
    status: 'shipped'
  },
  {
    id: 'ORD-003',
    customer: 'Lê Văn C',
    email: 'levanc@example.com',
    date: '14/03/2025',
    amount: '2,100,000đ',
    paymentMethod: 'Momo',
    status: 'pending'
  },
  {
    id: 'ORD-004',
    customer: 'Phạm Thị D',
    email: 'phamthid@example.com',
    date: '13/03/2025',
    amount: '750,000đ',
    paymentMethod: 'COD',
    status: 'cancelled'
  },
  {
    id: 'ORD-005',
    customer: 'Hoàng Văn E',
    email: 'hoangvane@example.com',
    date: '12/03/2025',
    amount: '1,800,000đ',
    paymentMethod: 'Banking',
    status: 'shipped'
  },
  {
    id: 'ORD-006',
    customer: 'Đỗ Thị F',
    email: 'dothif@example.com',
    date: '11/03/2025',
    amount: '950,000đ',
    paymentMethod: 'Momo',
    status: 'completed'
  },
  {
    id: 'ORD-007',
    customer: 'Vũ Văn G',
    email: 'vuvang@example.com',
    date: '10/03/2025',
    amount: '1,450,000đ',
    paymentMethod: 'COD',
    status: 'pending'
  }
];

// Component hiển thị trạng thái đơn hàng
interface OrderStatusBadgeProps {
  status: string;
}

function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
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
    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(status)}`}>
      {getStatusText(status)}
    </span>
  );
}

// Component tìm kiếm và lọc
interface OrderSearchFilterProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  selectedStatus: string;
  setSelectedStatus: (value: string) => void;
}

function OrderSearchFilter({ searchTerm, setSearchTerm, selectedStatus, setSelectedStatus }: OrderSearchFilterProps) {
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
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="pending">Chờ xử lý</option>
            <option value="shipped">Đang giao</option>
            <option value="completed">Hoàn thành</option>
            <option value="cancelled">Đã hủy</option>
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
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  indexOfFirstOrder: number;
  indexOfLastOrder: number;
  totalOrders: number;
}

function Pagination({ 
  currentPage, 
  totalPages, 
  setCurrentPage, 
  indexOfFirstOrder, 
  indexOfLastOrder, 
  totalOrders 
}: PaginationProps) {
  return (
    <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          Hiển thị {indexOfFirstOrder + 1}-{Math.min(indexOfLastOrder, totalOrders)} / {totalOrders} đơn hàng
        </div>
        <div className="flex items-center space-x-2">
          <button 
            className={`px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-100 ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Trước
          </button>
          <button 
            className={`px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-100 ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Sau
          </button>
        </div>
      </div>
    </div>
  );
}

// Component OrderTable chính
interface OrderFilterState {
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  dateRange: {
    from: string;
    to: string;
  };
  priceRange: {
    min: string;
    max: string;
  };
}

interface OrderTableProps {
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  filters?: OrderFilterState | null;
  refreshData?: () => void;
}

export default function OrderTable({ onView, onEdit, onDelete, filters, refreshData }: OrderTableProps) {
  const [orders, setOrders] = useState<Order[]>(sampleOrders as unknown as Order[]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [fetchStatus, setFetchStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const ordersPerPage = 5;

  useEffect(() => {
    fetchOrders();
  }, []);

  // Khi bộ lọc thay đổi, reset trang hiện tại về 1
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const fetchOrders = async () => {
    try {
      setFetchStatus('loading');
      
      // Giả lập việc tải dữ liệu từ server
      setTimeout(() => {
        // Lọc dữ liệu mẫu nếu có bộ lọc
        let filteredData = [...sampleOrders];
        
        if (filters) {
          if (filters.status && filters.status !== 'all') {
            filteredData = filteredData.filter(order => order.status === filters.status);
          }
          
          if (filters.paymentStatus && filters.paymentStatus !== 'all') {
            filteredData = filteredData.filter(order => 
              (order as any).paymentStatus === filters.paymentStatus
            );
          }
          
          if (filters.paymentMethod && filters.paymentMethod !== 'all') {
            filteredData = filteredData.filter(order => order.paymentMethod === filters.paymentMethod);
          }
        }
        
        // Lọc theo tìm kiếm
        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          filteredData = filteredData.filter(order => 
            order.id.toLowerCase().includes(term) || 
            order.customer.toLowerCase().includes(term) ||
            order.email.toLowerCase().includes(term)
          );
        }
        
        // Lọc theo trạng thái
        if (selectedStatus !== 'all') {
          filteredData = filteredData.filter(order => order.status === selectedStatus);
        }
        
        setOrders(filteredData as unknown as Order[]);
        setFetchStatus('success');
        toast.success(`Đã tải ${filteredData.length} đơn hàng`, {
          id: 'load-orders-success',
        });
      }, 500);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setFetchStatus('error');
      toast.error('Không thể tải danh sách đơn hàng. Vui lòng thử lại sau.', {
        id: 'load-orders-error',
      });
    }
  };

  // Hàm định dạng số tiền thành VND
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  // Hàm định dạng ngày tháng
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };

  // Lọc đơn hàng theo từ khóa tìm kiếm và trạng thái
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      (order._id || order.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.userName || order.customer || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.userEmail || order.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus;
    
    // Áp dụng bộ lọc nâng cao nếu có
    let matchesAdvancedFilters = true;
    
    if (filters) {
      // Lọc theo trạng thái từ bộ lọc nâng cao
      if (filters.status !== 'all' && order.status !== filters.status) {
        matchesAdvancedFilters = false;
      }
      
      // Lọc theo trạng thái thanh toán
      if (filters.paymentStatus !== 'all') {
        const paymentStatus = order.paymentStatus || 'pending';
        if (paymentStatus !== filters.paymentStatus) {
          matchesAdvancedFilters = false;
        }
      }
      
      // Lọc theo phương thức thanh toán
      if (filters.paymentMethod !== 'all') {
        const paymentMethod = order.paymentMethod || 'COD';
        if (paymentMethod !== filters.paymentMethod) {
          matchesAdvancedFilters = false;
        }
      }
      
      // Lọc theo khoảng thời gian
      if (filters.dateRange.from || filters.dateRange.to) {
        const orderDate = order.createdAt ? new Date(order.createdAt) : new Date();
        
        if (filters.dateRange.from) {
          const fromDate = new Date(filters.dateRange.from);
          if (orderDate < fromDate) {
            matchesAdvancedFilters = false;
          }
        }
        
        if (filters.dateRange.to) {
          const toDate = new Date(filters.dateRange.to);
          toDate.setHours(23, 59, 59, 999); // Đặt thời gian là cuối ngày
          if (orderDate > toDate) {
            matchesAdvancedFilters = false;
          }
        }
      }
      
      // Lọc theo khoảng giá
      if (filters.priceRange.min || filters.priceRange.max) {
        const orderPrice = order.finalPrice || parseInt((order.amount || '0').replace(/[^\d]/g, ''));
        
        if (filters.priceRange.min && orderPrice < parseInt(filters.priceRange.min)) {
          matchesAdvancedFilters = false;
        }
        
        if (filters.priceRange.max && orderPrice > parseInt(filters.priceRange.max)) {
          matchesAdvancedFilters = false;
        }
      }
    }
    
    return matchesSearch && matchesStatus && matchesAdvancedFilters;
  });

  // Phân trang
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  // Hiển thị thông báo loading
  if (fetchStatus === 'loading') {
    return (
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="p-6 text-center">
          <div className="animate-pulse text-gray-500">Đang tải dữ liệu đơn hàng...</div>
        </div>
      </div>
    );
  }

  // Hiển thị thông báo lỗi
  if (fetchStatus === 'error') {
    return (
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="p-6 text-center">
          <div className="text-red-500">Có lỗi xảy ra khi tải dữ liệu đơn hàng. Vui lòng thử lại sau.</div>
          <button 
            className="mt-4 px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700"
            onClick={() => {
              fetchOrders();
              if (refreshData) refreshData();
            }}
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
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
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
                Trạng thái
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentOrders.map((order) => (
              <tr key={order._id || order.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {order._id || order.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{order.userName || order.customer}</div>
                  <div className="text-sm text-gray-500">{order.userEmail || order.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {order.createdAt ? formatDate(order.createdAt) : order.date}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {order.finalPrice ? formatCurrency(order.finalPrice) : order.amount}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {order.paymentMethod || 'COD'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <OrderStatusBadge status={order.status} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <OrderActions 
                    orderId={order._id || order.id || ''} 
                    onView={onView} 
                    onEdit={onEdit} 
                    onDelete={onDelete} 
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {filteredOrders.length === 0 && (
        <div className="px-6 py-4 text-center text-gray-500">
          Không tìm thấy đơn hàng nào
        </div>
      )}
      
      <Pagination 
        currentPage={currentPage}
        totalPages={totalPages}
        setCurrentPage={setCurrentPage}
        indexOfFirstOrder={indexOfFirstOrder}
        indexOfLastOrder={indexOfLastOrder}
        totalOrders={filteredOrders.length}
      />
    </div>
  );
} 