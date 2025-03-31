import { useState } from 'react';
import { FaShoppingBag, FaEye, FaFileDownload, FaTimes, FaUndo, FaShoppingCart } from 'react-icons/fa';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'react-toastify';
import OrderDetail from './OrderDetail';

interface OrderProduct {
  productId: string;
  variantId?: string;
  name: string;
  image: string;
  options?: {
    shade?: string;
    size?: string;
  };
  quantity: number;
  price: number;
}

interface Order {
  _id: string;
  orderNumber: string;
  createdAt: string;
  status: string;
  products: OrderProduct[];
  totalPrice: number;
  finalPrice: number;
  voucher?: {
    voucherId: string;
    discountAmount: number;
  };
  shippingInfo: {
    address: string;
    contact: string;
  };
  tracking?: {
    status: {
      state: string;
      description: string;
      timestamp: string;
    }[];
    shippingCarrier?: {
      name: string;
      trackingNumber: string;
      trackingUrl: string;
    };
    estimatedDelivery?: string;
    actualDelivery?: string;
  };
}

interface OrderHistoryProps {
  orders: Order[];
  onViewOrderDetails?: (orderId: string) => void;
  onDownloadInvoice?: (orderId: string) => void;
  onCancelOrder?: (orderId: string) => void;
  onReturnOrder?: (orderId: string) => void;
  onBuyAgain?: (orderId: string) => void;
}

const OrderHistory = ({ 
  orders, 
  onViewOrderDetails, 
  onDownloadInvoice,
  onCancelOrder,
  onReturnOrder,
  onBuyAgain
}: OrderHistoryProps) => {
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-pink-100 text-pink-800';
      case 'processing':
        return 'bg-purple-100 text-purple-800';
      case 'shipping':
        return 'bg-indigo-100 text-indigo-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Chờ xác nhận';
      case 'confirmed':
        return 'Đã xác nhận';
      case 'processing':
        return 'Đang xử lý';
      case 'shipping':
        return 'Đang giao hàng';
      case 'delivered':
        return 'Đã giao hàng';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  const handleViewDetails = (orderId: string) => {
    if (onViewOrderDetails) {
      onViewOrderDetails(orderId);
    } else {
      // Mở modal chi tiết đơn hàng
      const order = orders.find(o => o._id === orderId);
      if (order) {
        setSelectedOrder(order);
      }
    }
  };

  const handleCloseModal = () => {
    setSelectedOrder(null);
  };

  const handleDownloadInvoice = (orderId: string) => {
    if (onDownloadInvoice) {
      onDownloadInvoice(orderId);
    } else {
      toast.info('Tính năng tải hóa đơn đang được phát triển');
    }
  };

  const handleCancelOrder = (orderId: string) => {
    if (onCancelOrder) {
      onCancelOrder(orderId);
    } else {
      toast.info('Tính năng hủy đơn hàng đang được phát triển');
    }
  };

  const handleReturnOrder = (orderId: string) => {
    if (onReturnOrder) {
      onReturnOrder(orderId);
    } else {
      toast.info('Tính năng trả hàng đang được phát triển');
    }
  };

  const handleBuyAgain = (orderId: string) => {
    if (onBuyAgain) {
      onBuyAgain(orderId);
    } else {
      toast.info('Tính năng mua lại đang được phát triển');
    }
  };

  // Kiểm tra xem đơn hàng có thể hủy không (chỉ hủy được khi đang ở trạng thái pending hoặc confirmed)
  const canCancelOrder = (status: string) => {
    return ['pending', 'confirmed'].includes(status);
  };

  // Kiểm tra xem đơn hàng có thể trả hàng không (chỉ trả được khi đã giao hàng)
  const canReturnOrder = (status: string) => {
    return status === 'delivered';
  };

  if (orders.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Đơn hàng của tôi</h2>
        <div className="text-center py-8">
          <div className="w-20 h-20 mx-auto bg-pink-50 rounded-full flex items-center justify-center mb-4">
            <FaShoppingBag className="text-pink-400 text-4xl" />
          </div>
          <p className="text-gray-500 mb-4">Bạn chưa có đơn hàng nào</p>
          <Link href="/shop">
            <button className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-md hover:opacity-90 transition-opacity shadow-sm">
              Mua sắm ngay
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {orders.map((order) => (
        <div key={order._id} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all">
          <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-4 flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-200">
            <div className="mb-2 md:mb-0">
              <p className="text-sm text-gray-500">Mã đơn hàng: <span className="font-medium text-gray-900">{order.orderNumber}</span></p>
              <p className="text-sm text-gray-500">Ngày đặt: <span className="font-medium text-gray-900">{formatDate(order.createdAt)}</span></p>
            </div>
            <div className="flex flex-col md:flex-row items-start md:items-center space-y-2 md:space-y-0 md:space-x-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                {getStatusText(order.status)}
              </span>
              <button
                onClick={() => handleViewDetails(order._id)}
                className="flex items-center text-pink-600 hover:text-pink-800 text-sm"
              >
                <FaEye className="mr-1" /> Xem chi tiết
              </button>
              <button
                onClick={() => handleDownloadInvoice(order._id)}
                className="flex items-center text-purple-600 hover:text-purple-800 text-sm"
              >
                <FaFileDownload className="mr-1" /> Hóa đơn
              </button>
            </div>
          </div>
          
          <div className="p-4">
            <div className="flex flex-col sm:flex-row items-start">
              {/* Hiển thị ảnh sản phẩm đầu tiên */}
              <div className="relative h-16 w-16 flex-shrink-0 mb-2 sm:mb-0">
                <Image
                  src={order.products[0].image}
                  alt={order.products[0].name}
                  fill
                  sizes="64px"
                  className="object-cover rounded-md"
                />
                {order.products.length > 1 && (
                  <div className="absolute -right-2 -bottom-2 bg-pink-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    +{order.products.length - 1}
                  </div>
                )}
              </div>
              
              {/* Thông tin đơn hàng */}
              <div className="sm:ml-4 flex-1">
                <h3 className="text-sm font-medium text-gray-800 truncate">{order.products[0].name}</h3>
                <p className="text-xs text-gray-500">
                  {order.products.length > 1 
                    ? `và ${order.products.length - 1} sản phẩm khác` 
                    : 'Số lượng: ' + order.products[0].quantity}
                </p>
                <p className="mt-1 text-sm font-medium text-pink-600">
                  {formatPrice(order.finalPrice)}
                </p>
              </div>
              
              {/* Hành động với đơn hàng */}
              <div className="mt-2 sm:mt-0 w-full sm:w-auto flex flex-col sm:flex-row gap-2 sm:ml-4">
                {canCancelOrder(order.status) && (
                  <button
                    onClick={() => handleCancelOrder(order._id)}
                    className="px-3 py-1 border border-red-200 text-red-600 rounded hover:bg-red-50 text-xs flex items-center justify-center"
                  >
                    <FaTimes className="mr-1" /> Hủy đơn
                  </button>
                )}
                
                {canReturnOrder(order.status) && (
                  <button
                    onClick={() => handleReturnOrder(order._id)}
                    className="px-3 py-1 border border-orange-200 text-orange-600 rounded hover:bg-orange-50 text-xs flex items-center justify-center"
                  >
                    <FaUndo className="mr-1" /> Trả hàng
                  </button>
                )}
                
                {order.status === 'delivered' && (
                  <button
                    onClick={() => handleBuyAgain(order._id)}
                    className="px-3 py-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded hover:opacity-90 text-xs flex items-center justify-center"
                  >
                    <FaShoppingCart className="mr-1" /> Mua lại
                  </button>
                )}
              </div>
            </div>
            
            {/* Hiện thị trạng thái đơn hàng */}
            {order.tracking && order.tracking.status && order.tracking.status.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-2">Trạng thái mới nhất:</p>
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-pink-600 mr-2"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {order.tracking.status[0].description}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(order.tracking.status[0].timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
      
      {/* Hiện thị modal chi tiết đơn hàng nếu có */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-medium">Chi tiết đơn hàng #{selectedOrder.orderNumber}</h2>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                <FaTimes />
              </button>
            </div>
            <div className="p-4">
              <OrderDetail order={selectedOrder} onClose={handleCloseModal} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderHistory; 