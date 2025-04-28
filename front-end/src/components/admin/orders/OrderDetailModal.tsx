import { useState, useEffect } from 'react';
import { FiX, FiTrash2, FiEdit2, FiPrinter, FiTruck, FiPackage, FiInfo, FiRefreshCw } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { useAdminOrder, Order, OrderItem, OrderTracking } from '@/contexts';

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
  const {
    fetchOrderDetail,
    fetchOrderTracking,
    createShipment,
    getShipmentInfo,
    updateOrderStatus,
    loading: contextLoading,
    error: contextError
  } = useAdminOrder();

  const [order, setOrder] = useState<Order | null>(null);
  const [orderTracking, setOrderTracking] = useState<OrderTracking | null>(null);
  const [loading, setLoading] = useState(true);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [shipmentLoading, setShipmentLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'tracking'>('details');

  useEffect(() => {
    if (isOpen && orderId) {
      fetchOrderDetails();
    }
  }, [isOpen, orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // Gọi API để lấy chi tiết đơn hàng
      const orderDetail = await fetchOrderDetail(orderId);

      if (orderDetail) {
        setOrder(orderDetail);

        // Nếu đơn hàng có mã vận đơn, tải thông tin vận đơn
        if (orderDetail.trackingCode) {
          fetchTrackingInfo();
        }

        toast.success('Đã tải thông tin đơn hàng', {
          id: `view-order-success-${orderId}`
        });
      } else {
        setError('Không tìm thấy thông tin đơn hàng');
      }
    } catch (error: any) {
      console.error('Error fetching order details:', error);
      toast.error(`Không thể tải chi tiết đơn hàng: ${error.message || 'Vui lòng thử lại sau'}`, {
        id: `view-order-error-${orderId}`
      });
      setError(`Không thể tải chi tiết đơn hàng: ${error.message || 'Vui lòng thử lại sau'}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrackingInfo = async () => {
    if (!orderId) return;

    try {
      setTrackingLoading(true);
      const trackingData = await fetchOrderTracking(orderId);
      if (trackingData) {
        setOrderTracking(trackingData);
      }
    } catch (error: any) {
      console.error('Error fetching tracking info:', error);
      toast.error(`Không thể tải thông tin vận đơn: ${error.message || 'Vui lòng thử lại sau'}`);
    } finally {
      setTrackingLoading(false);
    }
  };

  const handleCreateShipment = async () => {
    if (!order) return;

    try {
      setShipmentLoading(true);
      const result = await createShipment(orderId);

      if (result && result.success) {
        toast.success('Tạo vận đơn thành công!');
        // Cập nhật lại thông tin đơn hàng và thông tin vận đơn
        fetchOrderDetails();
        setActiveTab('tracking');
      } else {
        toast.error('Không thể tạo vận đơn. Vui lòng thử lại sau.');
      }
    } catch (error: any) {
      console.error('Error creating shipment:', error);
      toast.error(`Không thể tạo vận đơn: ${error.message || 'Vui lòng thử lại sau'}`);
    } finally {
      setShipmentLoading(false);
    }
  };

  const handleRefreshTracking = async () => {
    if (!order?.trackingCode) return;

    try {
      setTrackingLoading(true);
      const result = await getShipmentInfo(orderId);

      if (result && result.success) {
        toast.success('Đã cập nhật thông tin vận đơn!');
        fetchTrackingInfo();
      } else {
        toast.error('Không thể cập nhật thông tin vận đơn. Vui lòng thử lại sau.');
      }
    } catch (error: any) {
      console.error('Error refreshing tracking info:', error);
      toast.error(`Không thể cập nhật thông tin vận đơn: ${error.message || 'Vui lòng thử lại sau'}`);
    } finally {
      setTrackingLoading(false);
    }
  };

  const handleUpdateStatus = async (status: string) => {
    if (!order) return;

    try {
      setLoading(true);
      const result = await updateOrderStatus(orderId, status);

      if (result) {
        toast.success(`Đã cập nhật trạng thái đơn hàng thành ${getStatusText(status)}!`);
        setOrder({...order, status});
      } else {
        toast.error('Không thể cập nhật trạng thái đơn hàng. Vui lòng thử lại sau.');
      }
    } catch (error: any) {
      console.error('Error updating order status:', error);
      toast.error(`Không thể cập nhật trạng thái đơn hàng: ${error.message || 'Vui lòng thử lại sau'}`);
    } finally {
      setLoading(false);
    }
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

  // Hàm lấy trạng thái đơn hàng tiếng Việt
  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
      case 'completed':
        return 'Hoàn thành';
      case 'shipping':
      case 'shipped':
        return 'Đang giao';
      case 'pending':
        return 'Chờ xử lý';
      case 'confirmed':
        return 'Đã xác nhận';
      case 'processing':
        return 'Đang xử lý';
      case 'cancelled':
        return 'Đã hủy';
      case 'returned':
        return 'Đã trả hàng';
      default:
        return status;
    }
  };

  // Hàm lấy màu sắc cho trạng thái đơn hàng
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'shipping':
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-indigo-100 text-indigo-800';
      case 'processing':
        return 'bg-purple-100 text-purple-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'returned':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Hàm lấy trạng thái thanh toán tiếng Việt
  const getPaymentStatusText = (status: string) => {
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

  // Hàm lấy màu sắc cho trạng thái thanh toán
  const getPaymentStatusColor = (status: string) => {
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

  // Hàm lấy tên phương thức thanh toán tiếng Việt
  const getPaymentMethodText = (method: string) => {
    switch (method.toLowerCase()) {
      case 'cod':
        return 'Thanh toán khi nhận hàng (COD)';
      case 'bank_transfer':
        return 'Chuyển khoản ngân hàng';
      case 'credit_card':
        return 'Thẻ tín dụng';
      case 'stripe':
        return 'Stripe';
      case 'momo':
        return 'Ví MoMo';
      default:
        return method;
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
            {loading || contextLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
              </div>
            ) : error || contextError ? (
              <div className="text-center text-red-500 p-4">
                {error || contextError}
                <button
                  className="mt-2 px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700"
                  onClick={fetchOrderDetails}
                >
                  Thử lại
                </button>
              </div>
            ) : order ? (
              <div>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-2">
                      Chi tiết đơn hàng #{order.orderNumber}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${getPaymentStatusColor(order.paymentStatus)}`}>
                        {getPaymentStatusText(order.paymentStatus)}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap mt-3 md:mt-0 space-x-2">
                    {/* Nút tạo vận đơn - chỉ hiển thị khi đơn hàng đã xác nhận và chưa có mã vận đơn */}
                    {(order.status === 'confirmed' || order.status === 'processing') && !order.trackingCode && (
                      <button
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 flex items-center"
                        onClick={handleCreateShipment}
                        disabled={shipmentLoading}
                      >
                        {shipmentLoading ? (
                          <>
                            <div className="w-4 h-4 mr-2 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            Đang tạo...
                          </>
                        ) : (
                          <>
                            <FiTruck className="h-4 w-4 mr-1" />
                            Tạo vận đơn
                          </>
                        )}
                      </button>
                    )}
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

                {/* Tab điều hướng */}
                <div className="mb-6 border-b border-gray-200">
                  <nav className="flex -mb-px">
                    <button
                      className={`mr-8 py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'details'
                          ? 'border-pink-500 text-pink-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                      onClick={() => setActiveTab('details')}
                    >
                      Chi tiết đơn hàng
                    </button>
                    <button
                      className={`py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'tracking'
                          ? 'border-pink-500 text-pink-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                      onClick={() => setActiveTab('tracking')}
                    >
                      Thông tin vận chuyển
                    </button>
                  </nav>
                </div>

                {activeTab === 'details' && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      {/* Thông tin đơn hàng */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-3">Thông tin đơn hàng</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Mã đơn hàng:</span>
                            <span className="font-medium">{order.orderNumber}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">ID đơn hàng:</span>
                            <span className="font-medium text-gray-400 text-xs">{order._id}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Ngày đặt:</span>
                            <span>{formatDate(order.createdAt)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Cập nhật lần cuối:</span>
                            <span>{formatDate(order.updatedAt)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Trạng thái:</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(order.status)}`}>
                              {getStatusText(order.status)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Phương thức thanh toán:</span>
                            <span>{getPaymentMethodText(order.paymentMethod)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Trạng thái thanh toán:</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs ${getPaymentStatusColor(order.paymentStatus)}`}>
                              {getPaymentStatusText(order.paymentStatus)}
                            </span>
                          </div>
                          {order.trackingCode && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">Mã vận đơn:</span>
                              <span className="font-medium">{order.trackingCode}</span>
                            </div>
                          )}
                          {order.notes && (
                            <div className="pt-2">
                              <span className="text-gray-500 block mb-1">Ghi chú:</span>
                              <p className="text-gray-700 bg-white p-2 rounded border border-gray-200">{order.notes}</p>
                            </div>
                          )}
                        </div>

                        {/* Nút cập nhật trạng thái */}
                        <div className="mt-4 pt-3 border-t border-gray-200">
                          <div className="flex flex-col space-y-2">
                            <span className="text-gray-700 text-sm font-medium">Cập nhật trạng thái:</span>
                            <div className="flex flex-wrap gap-2">
                              {order.status !== 'pending' && (
                                <button
                                  className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200"
                                  onClick={() => handleUpdateStatus('pending')}
                                >
                                  Chờ xử lý
                                </button>
                              )}
                              {order.status !== 'confirmed' && (
                                <button
                                  className="px-2 py-1 text-xs bg-indigo-100 text-indigo-800 rounded hover:bg-indigo-200"
                                  onClick={() => handleUpdateStatus('confirmed')}
                                >
                                  Xác nhận
                                </button>
                              )}
                              {order.status !== 'processing' && (
                                <button
                                  className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded hover:bg-purple-200"
                                  onClick={() => handleUpdateStatus('processing')}
                                >
                                  Đang xử lý
                                </button>
                              )}
                              {order.status !== 'shipping' && (
                                <button
                                  className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                                  onClick={() => handleUpdateStatus('shipping')}
                                >
                                  Đang giao
                                </button>
                              )}
                              {order.status !== 'delivered' && (
                                <button
                                  className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200"
                                  onClick={() => handleUpdateStatus('delivered')}
                                >
                                  Hoàn thành
                                </button>
                              )}
                              {order.status !== 'cancelled' && (
                                <button
                                  className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200"
                                  onClick={() => handleUpdateStatus('cancelled')}
                                >
                                  Hủy đơn
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Thông tin khách hàng */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-3">Thông tin khách hàng</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">ID khách hàng:</span>
                            <span className="text-gray-400 text-xs">
                              {typeof order.userId === 'object'
                                ? (order.userId as any)?._id || 'Không có thông tin'
                                : order.userId}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Tên khách hàng:</span>
                            <span>
                              {typeof order.userId === 'object'
                                ? (order.userId as any)?.name || order.userName || 'Không có thông tin'
                                : order.userName || 'Không có thông tin'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Email:</span>
                            <span>
                              {typeof order.userId === 'object'
                                ? (order.userId as any)?.email || order.userEmail || 'Không có thông tin'
                                : order.userEmail || 'Không có thông tin'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Số điện thoại:</span>
                            <span>{order.shippingAddress?.phone || 'Không có thông tin'}</span>
                          </div>
                        </div>

                        <h4 className="font-medium text-gray-900 mt-4 mb-3">Địa chỉ giao hàng</h4>
                        <div className="bg-white p-3 rounded border border-gray-200">
                          <p className="text-gray-700">
                            <span className="font-medium">{order.shippingAddress?.fullName}</span><br />
                            {order.shippingAddress?.phone}<br />
                            {order.shippingAddress?.addressLine1}
                            {order.shippingAddress?.addressLine2 && <>, {order.shippingAddress.addressLine2}</>}<br />
                            {order.shippingAddress?.ward}, {order.shippingAddress?.district}, {order.shippingAddress?.province}
                            {order.shippingAddress?.postalCode && <>, {order.shippingAddress.postalCode}</>}
                          </p>
                        </div>

                        {order.branchId && (
                          <div className="mt-4">
                            <h4 className="font-medium text-gray-900 mb-2">Chi nhánh xử lý</h4>
                            <div className="bg-white p-3 rounded border border-gray-200">
                              <p className="text-gray-700">
                                ID Chi nhánh: {order.branchId}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {activeTab === 'details' && (
                  <>
                    {/* Danh sách sản phẩm */}
                    <div className="mt-6">
                      <h4 className="font-medium text-gray-900 mb-3">Sản phẩm đã đặt</h4>
                      <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg">
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
                            {order.items.map((item, index) => (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    {item.image && (
                                      <div className="flex-shrink-0 h-12 w-12 mr-3">
                                        <img className="h-12 w-12 rounded-md object-cover" src={item.image} alt={item.name} />
                                      </div>
                                    )}
                                    <div>
                                      <div className="text-sm font-medium text-gray-900">{item.name}</div>
                                      <div className="text-xs text-gray-500">ID: {item.productId}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {item.options && Object.entries(item.options).map(([key, value]) => (
                                    <div key={key}>{key}: {value}</div>
                                  ))}
                                  {item.variantId && <div className="text-xs text-gray-400">Variant ID: {item.variantId}</div>}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                                  {formatCurrency(item.price)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                                  {item.quantity}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                                  {formatCurrency(item.price * item.quantity)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="bg-gray-50">
                            <tr>
                              <td colSpan={3} className="px-6 py-3 text-sm text-gray-700 text-right font-medium">
                                Tạm tính:
                              </td>
                              <td colSpan={2} className="px-6 py-3 text-sm text-gray-900 text-right font-medium">
                                {formatCurrency(order.subtotal)}
                              </td>
                            </tr>
                            {order.tax > 0 && (
                              <tr>
                                <td colSpan={3} className="px-6 py-3 text-sm text-gray-700 text-right font-medium">
                                  Thuế:
                                </td>
                                <td colSpan={2} className="px-6 py-3 text-sm text-gray-900 text-right font-medium">
                                  {formatCurrency(order.tax)}
                                </td>
                              </tr>
                            )}
                            {order.shippingFee > 0 && (
                              <tr>
                                <td colSpan={3} className="px-6 py-3 text-sm text-gray-700 text-right font-medium">
                                  Phí vận chuyển:
                                </td>
                                <td colSpan={2} className="px-6 py-3 text-sm text-gray-900 text-right font-medium">
                                  {formatCurrency(order.shippingFee)}
                                </td>
                              </tr>
                            )}
                            <tr>
                              <td colSpan={3} className="px-6 py-3 text-sm text-gray-700 text-right font-medium">
                                Tổng tiền:
                              </td>
                              <td colSpan={2} className="px-6 py-3 text-sm text-gray-900 text-right font-medium">
                                {formatCurrency(order.totalPrice)}
                              </td>
                            </tr>
                            {order.voucher && (
                              <tr>
                                <td colSpan={3} className="px-6 py-3 text-sm text-gray-700 text-right font-medium">
                                  Giảm giá {order.voucher.code && `(${order.voucher.code})`}:
                                </td>
                                <td colSpan={2} className="px-6 py-3 text-sm text-red-500 text-right font-medium">
                                  -{formatCurrency(order.voucher.discountAmount)}
                                </td>
                              </tr>
                            )}
                            <tr>
                              <td colSpan={3} className="px-6 py-3 text-base text-gray-900 text-right font-medium">
                                Thành tiền:
                              </td>
                              <td colSpan={2} className="px-6 py-3 text-base text-pink-600 text-right font-bold">
                                {formatCurrency(order.finalPrice)}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  </>
                )}

                {/* Tab thông tin vận chuyển */}
                {activeTab === 'tracking' && (
                  <div className="mt-2">
                    {trackingLoading ? (
                      <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
                      </div>
                    ) : !order.trackingCode ? (
                      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <FiInfo className="h-5 w-5 text-yellow-400" />
                          </div>
                          <div className="ml-3">
                            <p className="text-sm text-yellow-700">
                              Đơn hàng này chưa có mã vận đơn. Vui lòng tạo vận đơn trước khi xem thông tin vận chuyển.
                            </p>
                            {(order.status === 'confirmed' || order.status === 'processing') && (
                              <div className="mt-3">
                                <button
                                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 flex items-center"
                                  onClick={handleCreateShipment}
                                  disabled={shipmentLoading}
                                >
                                  {shipmentLoading ? (
                                    <>
                                      <div className="w-4 h-4 mr-2 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                      Đang tạo...
                                    </>
                                  ) : (
                                    <>
                                      <FiTruck className="h-4 w-4 mr-1" />
                                      Tạo vận đơn
                                    </>
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : !orderTracking ? (
                      <div className="text-center text-gray-500 p-4">
                        <p>Không tìm thấy thông tin vận chuyển</p>
                        <button
                          className="mt-3 px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center mx-auto"
                          onClick={fetchTrackingInfo}
                        >
                          <FiRefreshCw className="h-4 w-4 mr-1" />
                          Tải lại thông tin
                        </button>
                      </div>
                    ) : (
                      <div>
                        <div className="flex justify-between items-center mb-4">
                          <div>
                            <h4 className="font-medium text-gray-900">Thông tin vận chuyển</h4>
                            <p className="text-sm text-gray-500 mt-1">
                              Mã vận đơn: <span className="font-medium">{order.trackingCode}</span>
                              {orderTracking.carrier && (
                                <> | Đơn vị vận chuyển: <span className="font-medium">{orderTracking.carrier.name}</span></>
                              )}
                            </p>
                          </div>
                          <button
                            className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center"
                            onClick={handleRefreshTracking}
                            disabled={trackingLoading}
                          >
                            {trackingLoading ? (
                              <>
                                <div className="w-4 h-4 mr-2 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
                                Đang cập nhật...
                              </>
                            ) : (
                              <>
                                <FiRefreshCw className="h-4 w-4 mr-1" />
                                Cập nhật
                              </>
                            )}
                          </button>
                        </div>

                        {orderTracking.estimatedDelivery && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                            <p className="text-blue-700">
                              <span className="font-medium">Dự kiến giao hàng:</span> {formatDate(orderTracking.estimatedDelivery)}
                            </p>
                          </div>
                        )}

                        {/* Lịch sử vận chuyển */}
                        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                            <h5 className="font-medium text-gray-700">Lịch sử vận chuyển</h5>
                          </div>
                          <div className="p-4">
                            {orderTracking.history && orderTracking.history.length > 0 ? (
                              <div className="relative">
                                <div className="absolute top-0 bottom-0 left-4 w-0.5 bg-gray-200"></div>
                                <ul className="space-y-6">
                                  {orderTracking.history.map((item, index) => (
                                    <li key={index} className="relative pl-10">
                                      <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-white border-2 border-pink-500 flex items-center justify-center">
                                        <div className="w-3 h-3 bg-pink-500 rounded-full"></div>
                                      </div>
                                      <div className="bg-gray-50 rounded-lg p-3">
                                        <p className="text-sm font-medium text-gray-900">{getStatusText(item.status)}</p>
                                        <p className="text-xs text-gray-500 mt-1">{formatDate(item.timestamp)}</p>
                                        {item.description && (
                                          <p className="text-sm text-gray-700 mt-2">{item.description}</p>
                                        )}
                                        {item.location && (
                                          <p className="text-xs text-gray-500 mt-1">Địa điểm: {item.location}</p>
                                        )}
                                      </div>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ) : (
                              <p className="text-center text-gray-500 py-4">Chưa có thông tin cập nhật</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
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
              className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-pink-600 text-base font-medium text-white hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={onClose}
            >
              Đóng
            </button>
            {order && activeTab === 'details' && (
              <button
                type="button"
                className="mr-2 inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 sm:w-auto sm:text-sm"
                onClick={() => setActiveTab('tracking')}
              >
                Xem thông tin vận chuyển
              </button>
            )}
            {order && activeTab === 'tracking' && (
              <button
                type="button"
                className="mr-2 inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 sm:w-auto sm:text-sm"
                onClick={() => setActiveTab('details')}
              >
                Xem chi tiết đơn hàng
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}