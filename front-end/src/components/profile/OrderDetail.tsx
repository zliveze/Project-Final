import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FaTimes, FaFileDownload, FaUndo, FaShoppingCart, FaExternalLinkAlt } from 'react-icons/fa';

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

interface OrderDetailProps {
  order: Order | null;
  onClose: () => void;
  onDownloadInvoice?: (orderId: string) => void;
  onCancelOrder?: (orderId: string) => void;
  onReturnOrder?: (orderId: string) => void;
  onBuyAgain?: (orderId: string) => void;
}

const OrderDetail: React.FC<OrderDetailProps> = ({
  order,
  onClose,
  onDownloadInvoice,
  onCancelOrder,
  onReturnOrder,
  onBuyAgain
}) => {
  if (!order) return null;

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
        return 'bg-blue-100 text-blue-800';
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

  // Kiểm tra xem đơn hàng có thể hủy không (chỉ hủy được khi đang ở trạng thái pending hoặc confirmed)
  const canCancelOrder = (status: string) => {
    return ['pending', 'confirmed'].includes(status);
  };

  // Kiểm tra xem đơn hàng có thể trả hàng không (chỉ trả được khi đã giao hàng)
  const canReturnOrder = (status: string) => {
    return status === 'delivered';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">Chi tiết đơn hàng #{order.orderNumber}</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Đóng"
          >
            <FaTimes size={20} />
          </button>
        </div>
        
        <div className="p-6">
          {/* Thông tin đơn hàng */}
          <div className="flex flex-col md:flex-row justify-between mb-6">
            <div>
              <p className="text-sm text-gray-500">Mã đơn hàng: <span className="font-medium text-gray-900">{order.orderNumber}</span></p>
              <p className="text-sm text-gray-500">Ngày đặt: <span className="font-medium text-gray-900">{formatDate(order.createdAt)}</span></p>
            </div>
            <div className="mt-2 md:mt-0">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                {getStatusText(order.status)}
              </span>
            </div>
          </div>
          
          {/* Thông tin giao hàng */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="font-medium text-gray-900 mb-2">Thông tin giao hàng</h3>
            <p className="text-sm text-gray-600">{order.shippingInfo.address}</p>
            <p className="text-sm text-gray-600">{order.shippingInfo.contact}</p>
          </div>
          
          {/* Trạng thái đơn hàng */}
          {order.tracking && (
            <div className="mb-6">
              <h3 className="font-medium text-gray-900 mb-3">Trạng thái đơn hàng</h3>
              <div className="relative">
                {/* Đường kẻ dọc kết nối các trạng thái */}
                <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-blue-200"></div>
                
                <div className="space-y-6">
                  {order.tracking.status.map((status, index) => (
                    <div key={index} className="flex items-start relative">
                      <div className={`z-10 mr-3 mt-0.5 h-4 w-4 rounded-full ${
                        index === order.tracking!.status.length - 1 
                          ? 'bg-blue-500' 
                          : 'bg-blue-300'
                      }`}></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{status.description}</p>
                        <p className="text-xs text-gray-500">{formatDate(status.timestamp)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Thông tin vận chuyển */}
              {order.tracking.shippingCarrier && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Đơn vị vận chuyển:</span> {order.tracking.shippingCarrier.name}
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Mã vận đơn:</span> {order.tracking.shippingCarrier.trackingNumber}
                  </p>
                  {order.tracking.shippingCarrier.trackingUrl && (
                    <a 
                      href={order.tracking.shippingCarrier.trackingUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                    >
                      Theo dõi đơn hàng <FaExternalLinkAlt className="ml-1 text-xs" />
                    </a>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Danh sách sản phẩm */}
          <div className="mb-6">
            <h3 className="font-medium text-gray-900 mb-3">Sản phẩm ({order.products.length})</h3>
            <div className="border rounded-lg overflow-hidden">
              {order.products.map((product, index) => (
                <div 
                  key={`${product.productId}-${product.variantId || ''}`} 
                  className={`flex items-center p-4 ${
                    index < order.products.length - 1 ? 'border-b border-gray-200' : ''
                  }`}
                >
                  <div className="relative h-20 w-20 flex-shrink-0">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      sizes="80px"
                      className="object-cover rounded-md"
                    />
                  </div>
                  <div className="ml-4 flex-1">
                    <Link href={`/shop/product/${product.productId}`} className="hover:text-blue-600">
                      <h4 className="text-sm font-medium text-gray-900">{product.name}</h4>
                    </Link>
                    {product.options && (
                      <p className="text-xs text-gray-500 mt-1">
                        {product.options.shade && `Màu: ${product.options.shade}`}
                        {product.options.shade && product.options.size && ' | '}
                        {product.options.size && `Kích thước: ${product.options.size}`}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">SL: {product.quantity}</p>
                    <p className="text-sm font-medium text-gray-900 mt-1">{formatPrice(product.price)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Thông tin thanh toán */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="font-medium text-gray-900 mb-3">Thông tin thanh toán</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tạm tính:</span>
                <span className="text-gray-900">{formatPrice(order.totalPrice)}</span>
              </div>
              {order.voucher && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Giảm giá:</span>
                  <span className="text-red-600">-{formatPrice(order.voucher.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between font-medium text-base pt-2 border-t border-gray-200 mt-2">
                <span className="text-gray-900">Tổng cộng:</span>
                <span className="text-gray-900">{formatPrice(order.finalPrice)}</span>
              </div>
            </div>
          </div>
          
          {/* Các nút hành động */}
          <div className="flex flex-wrap gap-2 justify-end">
            <button
              onClick={() => onDownloadInvoice && onDownloadInvoice(order._id)}
              className="flex items-center px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 text-sm"
            >
              <FaFileDownload className="mr-2" /> Tải hóa đơn
            </button>
            
            <button
              onClick={() => onBuyAgain && onBuyAgain(order._id)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
            >
              <FaShoppingCart className="mr-2" /> Mua lại
            </button>
            
            {canReturnOrder(order.status) && (
              <button
                onClick={() => onReturnOrder && onReturnOrder(order._id)}
                className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 text-sm"
              >
                <FaUndo className="mr-2" /> Yêu cầu trả hàng
              </button>
            )}
            
            {canCancelOrder(order.status) && (
              <button
                onClick={() => onCancelOrder && onCancelOrder(order._id)}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
              >
                <FaTimes className="mr-2" /> Hủy đơn hàng
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail; 