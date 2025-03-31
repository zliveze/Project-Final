import { useState, useEffect } from 'react';
import { FiX, FiTrash2, FiEdit2, FiPrinter } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

interface Product {
  productId: string;
  productName: string;
  variantId: string;
  options: {
    shade: string;
    size: string;
  };
  quantity: number;
  price: number;
  image?: string;
}

interface Order {
  _id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  products: Product[];
  totalPrice: number;
  discountAmount?: number;
  finalPrice: number;
  status: string;
  shippingInfo: {
    address: string;
    contact: string;
  };
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  updatedAt: string;
}

interface OrderDetailModalProps {
  orderId: string;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function OrderDetailModal({ 
  orderId, 
  isOpen, 
  onClose, 
  onEdit,
  onDelete 
}: OrderDetailModalProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && orderId) {
      fetchOrderDetails();
    }
  }, [isOpen, orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Giả lập việc tải dữ liệu
      setTimeout(() => {
        // Dữ liệu mẫu cho demo
        const sampleOrderDetail = {
          _id: orderId,
          userId: 'user123',
          userName: 'Nguyễn Văn A',
          userEmail: 'nguyenvana@example.com',
          userPhone: '0901234567',
          products: [
            {
              productId: 'prod1',
              productName: 'Kem dưỡng ẩm Yumin',
              variantId: 'var1',
              options: {
                shade: 'Thường',
                size: '50ml'
              },
              quantity: 2,
              price: 450000,
              image: '/images/products/cream1.jpg'
            },
            {
              productId: 'prod2',
              productName: 'Sữa rửa mặt Yumin',
              variantId: 'var2',
              options: {
                shade: 'Dành cho da dầu',
                size: '100ml'
              },
              quantity: 1,
              price: 350000,
              image: '/images/products/cleanser.jpg'
            }
          ],
          totalPrice: 1250000,
          discountAmount: 100000,
          finalPrice: 1150000,
          status: 'pending',
          shippingInfo: {
            address: '123 Đường ABC, Quận 1, TP.HCM',
            contact: '0901234567'
          },
          paymentMethod: 'COD',
          paymentStatus: 'pending',
          createdAt: '2023-04-15T08:30:00Z',
          updatedAt: '2023-04-15T08:30:00Z'
        };
        
        setOrder(sampleOrderDetail as Order);
        setLoading(false);
        toast.success('Đã tải thông tin đơn hàng', {
          id: `view-order-success-${orderId}`
        });
      }, 800);
    } catch (error) {
      console.error('Error fetching order details:', error);
      toast.error('Không thể tải chi tiết đơn hàng. Vui lòng thử lại sau.', {
        id: `view-order-error-${orderId}`
      });
      setError('Không thể tải chi tiết đơn hàng. Vui lòng thử lại sau.');
      setLoading(false);
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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Hàm lấy trạng thái đơn hàng tiếng Việt
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

  // Hàm in đơn hàng
  const handlePrint = () => {
    toast('Đang chuẩn bị in đơn hàng...', {
      id: `print-order-${orderId}`
    });
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div 
          className="fixed inset-0 transition-opacity" 
          aria-hidden="true"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>
        
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <div className="absolute top-0 right-0 pt-4 pr-4">
            <button
              type="button"
              className="text-gray-400 hover:text-gray-500 focus:outline-none"
              onClick={onClose}
            >
              <FiX className="h-6 w-6" />
            </button>
          </div>
          
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
              </div>
            ) : error ? (
              <div className="text-center text-red-500 p-4">
                {error}
                <button 
                  className="mt-2 px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700"
                  onClick={fetchOrderDetails}
                >
                  Thử lại
                </button>
              </div>
            ) : order ? (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Chi tiết đơn hàng #{order._id}
                  </h3>
                  <div className="flex space-x-2">
                    <button 
                      className="p-2 text-blue-600 hover:text-blue-800"
                      onClick={handlePrint}
                      title="In đơn hàng"
                    >
                      <FiPrinter className="h-5 w-5" />
                    </button>
                    <button 
                      className="p-2 text-indigo-600 hover:text-indigo-800"
                      onClick={() => onEdit(order._id)}
                      title="Chỉnh sửa đơn hàng"
                    >
                      <FiEdit2 className="h-5 w-5" />
                    </button>
                    <button 
                      className="p-2 text-red-600 hover:text-red-800"
                      onClick={() => {
                        onDelete(order._id);
                        onClose();
                      }}
                      title="Xóa đơn hàng"
                    >
                      <FiTrash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Thông tin đơn hàng */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">Thông tin đơn hàng</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Mã đơn hàng:</span>
                        <span className="font-medium">{order._id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Ngày đặt:</span>
                        <span>{formatDate(order.createdAt)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Trạng thái:</span>
                        <span className="font-medium">{getStatusText(order.status)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Phương thức thanh toán:</span>
                        <span>{order.paymentMethod}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Trạng thái thanh toán:</span>
                        <span>{order.paymentStatus === 'completed' ? 'Đã thanh toán' : 'Chưa thanh toán'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Thông tin khách hàng */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">Thông tin khách hàng</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Tên khách hàng:</span>
                        <span>{order.userName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Email:</span>
                        <span>{order.userEmail}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Số điện thoại:</span>
                        <span>{order.userPhone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Địa chỉ giao hàng:</span>
                        <span className="text-right">{order.shippingInfo.address}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Danh sách sản phẩm */}
                <div className="mt-6">
                  <h4 className="font-medium text-gray-900 mb-3">Sản phẩm đã đặt</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Sản phẩm
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tùy chọn
                          </th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Giá
                          </th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Số lượng
                          </th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Thành tiền
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {order.products.map((product, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                {product.image && (
                                  <div className="flex-shrink-0 h-10 w-10 mr-3">
                                    <img className="h-10 w-10 rounded-md object-cover" src={product.image} alt={product.productName} />
                                  </div>
                                )}
                                <div className="text-sm font-medium text-gray-900">{product.productName}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {product.options.shade && <div>Màu: {product.options.shade}</div>}
                              {product.options.size && <div>Kích thước: {product.options.size}</div>}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                              {formatCurrency(product.price)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                              {product.quantity}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                              {formatCurrency(product.price * product.quantity)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Tổng tiền */}
                <div className="mt-6 border-t border-gray-200 pt-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Tạm tính:</span>
                    <span className="text-gray-900">{formatCurrency(order.totalPrice)}</span>
                  </div>
                  {order.discountAmount && order.discountAmount > 0 && (
                    <div className="flex justify-between items-center text-sm mt-2">
                      <span className="text-gray-500">Giảm giá:</span>
                      <span className="text-red-500">-{formatCurrency(order.discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center mt-2 font-medium">
                    <span className="text-gray-900">Tổng cộng:</span>
                    <span className="text-xl text-pink-600">{formatCurrency(order.finalPrice)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 p-4">
                Không tìm thấy thông tin đơn hàng
              </div>
            )}
          </div>
          
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-pink-600 text-base font-medium text-white hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={onClose}
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 