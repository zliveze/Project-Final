import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import { FaShoppingBag, FaExternalLinkAlt } from 'react-icons/fa';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { Order } from './types';
import Portal from '@/components/common/Portal';
import InvoiceDownloader from './InvoiceDownloader';
import Link from 'next/link';
import axiosInstance from '@/lib/axiosInstance';

interface OrderDetailModalProps {
  order: Order;
  onClose: () => void;
  onCancelOrder?: (orderId: string) => void;
  onReturnOrder?: (orderId: string) => void;
}

const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  order,
  onClose,
  onCancelOrder,
  onReturnOrder
}) => {
  const router = useRouter();
  const [productSlugs, setProductSlugs] = useState<{[key: string]: string}>({});
  const [loadingSlugs, setLoadingSlugs] = useState<boolean>(false);

  // Lấy slug của sản phẩm từ API
  useEffect(() => {
    const fetchProductSlugs = async () => {
      try {
        setLoadingSlugs(true);
        const productIds = order.products.map(product => product.productId);

        // Tạo một đối tượng để lưu trữ slug cho mỗi productId
        const slugMap: {[key: string]: string} = {};

        // Lấy thông tin slug cho từng sản phẩm
        for (const productId of productIds) {
          try {
            const response = await axiosInstance.get(`/products/${productId}`);
            if (response.data && response.data.slug) {
              slugMap[productId] = response.data.slug;
            }
          } catch (error) {
            console.error(`Không thể lấy thông tin sản phẩm ${productId}:`, error);
          }
        }

        setProductSlugs(slugMap);
      } catch (error) {
        console.error('Lỗi khi lấy thông tin slug sản phẩm:', error);
      } finally {
        setLoadingSlugs(false);
      }
    };

    fetchProductSlugs();
  }, [order.products]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
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
        return 'Đang giao';
      case 'delivered':
        return 'Đã giao';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  return (
    <Portal>
      <div className="fixed inset-0 flex items-center justify-center bg-black/50 p-4" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'auto' }}>
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">
            Chi tiết đơn hàng #{order.orderNumber}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <FaTimes className="text-xl" />
          </button>
        </div>

        <div className="p-6">
          {/* Thông tin đơn hàng */}
          <div className="mb-6">
            <div className="flex flex-wrap justify-between items-start mb-4">
              <div>
                <p className="text-sm text-gray-600">
                  Ngày đặt hàng: {formatDate(order.createdAt)}
                </p>
                <div className="flex items-center mt-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(order.status)}`}>
                    {getStatusText(order.status)}
                  </span>
                </div>
              </div>
              <div className="mt-2 sm:mt-0">
                {order.status === 'delivered' && (
                  <button
                    onClick={() => {
                      onClose();
                      router.push(`/review/create?orderId=${order._id}`);
                    }}
                    className="px-4 py-2 text-sm bg-pink-100 text-pink-700 rounded-md hover:bg-pink-200 transition-colors"
                  >
                    Đánh giá sản phẩm
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Danh sách sản phẩm */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Sản phẩm</h3>
            <div className="space-y-4">
              {order.products.map((product, index) => (
                <div key={index} className="flex border-b pb-4">
                  <div className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded overflow-hidden">
                    <Image
                      src={product.image}
                      alt={product.name}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="ml-4 flex-1">
                    <Link href={`/product/${productSlugs[product.productId] || product.productId}`}>
                      <h4 className="font-medium text-gray-900 hover:text-pink-600 transition-colors">{product.name}</h4>
                    </Link>
                    <div className="mt-1 flex flex-wrap text-sm text-gray-600">
                      {product.options && Object.entries(product.options).map(([key, value]) => (
                        <span key={key} className="mr-4">
                          {key.charAt(0).toUpperCase() + key.slice(1)}: {value as string}
                        </span>
                      ))}
                      <span className="mr-4">Số lượng: {product.quantity}</span>
                    </div>
                    <div className="mt-2 font-medium">
                      {formatCurrency(product.price * product.quantity)}
                    </div>
                    <div className="mt-2">
                      <Link
                        href={`/product/${productSlugs[product.productId] || product.productId}`}
                        className="text-xs px-3 py-1 bg-pink-100 text-pink-600 rounded-full hover:bg-pink-200 transition-colors inline-flex items-center"
                      >
                        <FaExternalLinkAlt className="mr-1 text-xs" /> Xem sản phẩm
                      </Link>
                      {loadingSlugs && !productSlugs[product.productId] && (
                        <span className="ml-2 text-xs text-gray-500">Đang tải...</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Thông tin thanh toán */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Thông tin thanh toán</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Tổng tiền sản phẩm:</span>
                <span>{formatCurrency(order.totalPrice)}</span>
              </div>
              {order.voucher && (
                <div className="flex justify-between mb-2 text-green-600">
                  <span>Giảm giá (voucher):</span>
                  <span>- {formatCurrency(order.voucher.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between font-medium text-lg pt-2 border-t">
                <span>Thành tiền:</span>
                <span className="text-pink-600">{formatCurrency(order.finalPrice)}</span>
              </div>
            </div>
          </div>

          {/* Thông tin giao hàng */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Thông tin giao hàng</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="mb-2"><span className="font-medium">Người nhận:</span> {order.shippingInfo.contact}</p>
              <p className="mb-2"><span className="font-medium">Địa chỉ:</span> {order.shippingInfo.address}</p>
              {order.tracking?.shippingCarrier && (
                <>
                  <p className="mb-2"><span className="font-medium">Đơn vị vận chuyển:</span> {order.tracking.shippingCarrier.name}</p>
                  <p className="mb-2">
                    <span className="font-medium">Mã vận đơn:</span> {order.tracking.shippingCarrier.trackingNumber}
                    {order.tracking.shippingCarrier.trackingUrl && (
                      <a
                        href={order.tracking.shippingCarrier.trackingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 text-pink-600 hover:text-pink-800"
                      >
                        Theo dõi đơn hàng
                      </a>
                    )}
                  </p>
                </>
              )}
              {order.tracking?.estimatedDelivery && (
                <p className="mb-2">
                  <span className="font-medium">Dự kiến giao hàng:</span> {formatDate(order.tracking.estimatedDelivery)}
                </p>
              )}
              {order.tracking?.actualDelivery && (
                <p className="mb-2">
                  <span className="font-medium">Đã giao hàng:</span> {formatDate(order.tracking.actualDelivery)}
                </p>
              )}
            </div>
          </div>

          {/* Timeline trạng thái */}
          {order.tracking?.status && (
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-4">Quá trình vận chuyển</h3>
              <div className="relative pl-8">
                {order.tracking.status.map((status, index) => (
                  <div key={index} className="mb-6 relative">
                    <div className="absolute left-0 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-pink-500 ring-4 ring-pink-100"></div>
                    <div className={`ml-6 ${index === 0 ? 'border-l-0' : 'border-l-2 border-pink-100'} absolute h-full left-0 top-0`}></div>
                    <div className="pl-6">
                      <p className="font-medium text-gray-900">{status.description}</p>
                      <p className="text-sm text-gray-600">{formatDate(status.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Nút hành động */}
          <div className="flex flex-wrap gap-2 justify-end mt-6 pt-4 border-t">
            <Link
              href="/shop"
              className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-md hover:opacity-90 transition-opacity flex items-center justify-center"
              onClick={() => onClose()}
            >
              <FaShoppingBag className="mr-2" /> Tiếp tục mua sắm
            </Link>
            <InvoiceDownloader
              orderId={order._id}
              buttonText="Tải hóa đơn"
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors flex items-center justify-center"
            />
            {order.status === 'pending' && onCancelOrder && (
              <button
                onClick={() => {
                  onClose();
                  onCancelOrder(order._id);
                }}
                className="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
              >
                Hủy đơn hàng
              </button>
            )}
            {order.status === 'delivered' && onReturnOrder && (
              <button
                onClick={() => {
                  onClose();
                  onReturnOrder(order._id);
                }}
                className="px-4 py-2 bg-orange-100 text-orange-700 rounded-md hover:bg-orange-200 transition-colors"
              >
                Yêu cầu trả hàng
              </button>
            )}
          </div>
        </div>
      </div>
      </div>
    </Portal>
  );
};

export default OrderDetailModal;
