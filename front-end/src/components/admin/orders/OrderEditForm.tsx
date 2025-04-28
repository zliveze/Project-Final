import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { FiSave, FiX, FiAlertCircle } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { useAdminOrder, Order, OrderItem, ShippingAddress } from '@/contexts';

interface OrderEditFormProps {
  orderId: string;
  onCancel: () => void;
  onSuccess: () => void;
}

export default function OrderEditForm({ orderId, onCancel, onSuccess }: OrderEditFormProps) {
  const router = useRouter();
  const { fetchOrderDetail, updateOrderStatus, loading: contextLoading, error: contextError } = useAdminOrder();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    status: '',
    paymentStatus: '',
    notes: '',
    shippingAddress: {
      fullName: '',
      phone: '',
      addressLine1: '',
      addressLine2: '',
      ward: '',
      district: '',
      province: '',
      postalCode: '',
    },
  });

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const orderDetail = await fetchOrderDetail(orderId);

      if (orderDetail) {
        setOrder(orderDetail);

        // Thiết lập giá trị form ban đầu
        setFormData({
          status: orderDetail.status,
          paymentStatus: orderDetail.paymentStatus,
          notes: orderDetail.notes || '',
          shippingAddress: {
            fullName: orderDetail.shippingAddress.fullName || '',
            phone: orderDetail.shippingAddress.phone || '',
            addressLine1: orderDetail.shippingAddress.addressLine1 || '',
            addressLine2: orderDetail.shippingAddress.addressLine2 || '',
            ward: orderDetail.shippingAddress.ward || '',
            district: orderDetail.shippingAddress.district || '',
            province: orderDetail.shippingAddress.province || '',
            postalCode: orderDetail.shippingAddress.postalCode || '',
          },
        });

        toast.success('Đã tải thông tin đơn hàng', {
          id: `edit-order-load-${orderId}`
        });
      } else {
        setError('Không tìm thấy thông tin đơn hàng');
      }
    } catch (error: any) {
      console.error('Error fetching order details:', error);
      setError(`Không thể tải chi tiết đơn hàng: ${error.message || 'Vui lòng thử lại sau'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    // Xử lý các trường thông tin địa chỉ
    if (name.startsWith('shipping.')) {
      const addressField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        shippingAddress: {
          ...prev.shippingAddress,
          [addressField]: value
        }
      }));
    } else {
      // Xử lý các trường thông thường
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);

      // Chuẩn bị dữ liệu để gửi
      const updatedData = {
        status: formData.status,
        paymentStatus: formData.paymentStatus,
        notes: formData.notes,
        shippingAddress: {
          fullName: formData.shippingAddress.fullName,
          phone: formData.shippingAddress.phone,
          addressLine1: formData.shippingAddress.addressLine1,
          addressLine2: formData.shippingAddress.addressLine2,
          ward: formData.shippingAddress.ward,
          district: formData.shippingAddress.district,
          province: formData.shippingAddress.province,
          postalCode: formData.shippingAddress.postalCode,
        }
      };

      // Gọi API để cập nhật đơn hàng
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(updatedData)
      });

      if (response.ok) {
        toast.success('Cập nhật đơn hàng thành công!', {
          id: `update-order-success-${orderId}`
        });
        onSuccess();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Không thể cập nhật đơn hàng');
      }
    } catch (error: any) {
      console.error('Error updating order:', error);
      toast.error(`Có lỗi xảy ra khi cập nhật đơn hàng: ${error.message || 'Vui lòng thử lại sau'}`, {
        id: `update-order-error-${orderId}`
      });
      setError(`Có lỗi xảy ra khi cập nhật đơn hàng: ${error.message || 'Vui lòng thử lại sau'}`);
    } finally {
      setSubmitting(false);
    }
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

  // Hàm định dạng số tiền thành VND
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-4">
        {error}
        <button
          className="mt-4 px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700"
          onClick={fetchOrderDetails}
        >
          Thử lại
        </button>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center text-gray-500 p-4">
        Không tìm thấy thông tin đơn hàng
      </div>
    );
  }

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <div className="bg-pink-50 px-6 py-4 border-b border-pink-100">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">Chỉnh sửa đơn hàng #{order._id}</h2>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-md font-medium text-gray-900 mb-4">Thông tin đơn hàng</h3>

            <div className="mb-4">
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Trạng thái đơn hàng
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                required
              >
                <option value="pending">{getStatusText('pending')}</option>
                <option value="confirmed">{getStatusText('confirmed')}</option>
                <option value="processing">{getStatusText('processing')}</option>
                <option value="shipping">{getStatusText('shipping')}</option>
                <option value="delivered">{getStatusText('delivered')}</option>
                <option value="cancelled">{getStatusText('cancelled')}</option>
                <option value="returned">{getStatusText('returned')}</option>
              </select>
            </div>

            <div className="mb-4">
              <label htmlFor="paymentStatus" className="block text-sm font-medium text-gray-700 mb-1">
                Trạng thái thanh toán
              </label>
              <select
                id="paymentStatus"
                name="paymentStatus"
                value={formData.paymentStatus}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                required
              >
                <option value="pending">{getPaymentStatusText('pending')}</option>
                <option value="paid">{getPaymentStatusText('paid')}</option>
                <option value="failed">{getPaymentStatusText('failed')}</option>
                <option value="refunded">{getPaymentStatusText('refunded')}</option>
              </select>
            </div>

            <div className="mb-4">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                Ghi chú
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
              />
            </div>
          </div>

          <div>
            <h3 className="text-md font-medium text-gray-900 mb-4">Thông tin giao hàng</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="shipping.fullName" className="block text-sm font-medium text-gray-700 mb-1">
                  Họ tên người nhận
                </label>
                <input
                  type="text"
                  id="shipping.fullName"
                  name="shipping.fullName"
                  value={formData.shippingAddress.fullName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="shipping.phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Số điện thoại
                </label>
                <input
                  type="text"
                  id="shipping.phone"
                  name="shipping.phone"
                  value={formData.shippingAddress.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                  required
                />
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="shipping.addressLine1" className="block text-sm font-medium text-gray-700 mb-1">
                Địa chỉ
              </label>
              <input
                type="text"
                id="shipping.addressLine1"
                name="shipping.addressLine1"
                value={formData.shippingAddress.addressLine1}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                required
              />
            </div>

            <div className="mb-4">
              <label htmlFor="shipping.addressLine2" className="block text-sm font-medium text-gray-700 mb-1">
                Địa chỉ bổ sung (tùy chọn)
              </label>
              <input
                type="text"
                id="shipping.addressLine2"
                name="shipping.addressLine2"
                value={formData.shippingAddress.addressLine2}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label htmlFor="shipping.province" className="block text-sm font-medium text-gray-700 mb-1">
                  Tỉnh/Thành phố
                </label>
                <input
                  type="text"
                  id="shipping.province"
                  name="shipping.province"
                  value={formData.shippingAddress.province}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="shipping.district" className="block text-sm font-medium text-gray-700 mb-1">
                  Quận/Huyện
                </label>
                <input
                  type="text"
                  id="shipping.district"
                  name="shipping.district"
                  value={formData.shippingAddress.district}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="shipping.ward" className="block text-sm font-medium text-gray-700 mb-1">
                  Phường/Xã
                </label>
                <input
                  type="text"
                  id="shipping.ward"
                  name="shipping.ward"
                  value={formData.shippingAddress.ward}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                  required
                />
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="shipping.postalCode" className="block text-sm font-medium text-gray-700 mb-1">
                Mã bưu điện (tùy chọn)
              </label>
              <input
                type="text"
                id="shipping.postalCode"
                name="shipping.postalCode"
                value={formData.shippingAddress.postalCode}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
              />
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-md font-medium text-gray-900 mb-4">Sản phẩm đã đặt</h3>
          <div className="overflow-x-auto border border-gray-200 rounded-md">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sản phẩm
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
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {item.image && (
                          <div className="flex-shrink-0 h-10 w-10 mr-3">
                            <img className="h-10 w-10 rounded-md object-cover" src={item.image} alt={item.name} />
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">{item.name}</div>
                          <div className="text-sm text-gray-500">
                            {item.options && Object.entries(item.options).map(([key, value]) => (
                              <span key={key}>{key}: {value} </span>
                            ))}
                          </div>
                          <div className="text-xs text-gray-400">ID: {item.productId}</div>
                        </div>
                      </div>
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
                  <td className="px-6 py-3 text-sm text-gray-900 text-right font-medium">
                    {formatCurrency(order.subtotal)}
                  </td>
                </tr>
                {order.tax > 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-3 text-sm text-gray-700 text-right font-medium">
                      Thuế:
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-900 text-right font-medium">
                      {formatCurrency(order.tax)}
                    </td>
                  </tr>
                )}
                {order.shippingFee > 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-3 text-sm text-gray-700 text-right font-medium">
                      Phí vận chuyển:
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-900 text-right font-medium">
                      {formatCurrency(order.shippingFee)}
                    </td>
                  </tr>
                )}
                <tr>
                  <td colSpan={3} className="px-6 py-3 text-sm text-gray-700 text-right font-medium">
                    Tổng tiền:
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-900 text-right font-medium">
                    {formatCurrency(order.totalPrice)}
                  </td>
                </tr>
                {order.voucher && (
                  <tr>
                    <td colSpan={3} className="px-6 py-3 text-sm text-gray-700 text-right font-medium">
                      Giảm giá {order.voucher.code && `(${order.voucher.code})`}:
                    </td>
                    <td className="px-6 py-3 text-sm text-red-500 text-right font-medium">
                      -{formatCurrency(order.voucher.discountAmount)}
                    </td>
                  </tr>
                )}
                <tr>
                  <td colSpan={3} className="px-6 py-3 text-sm text-gray-700 text-right font-medium">
                    Thành tiền:
                  </td>
                  <td className="px-6 py-3 text-pink-600 text-right font-medium">
                    {formatCurrency(order.finalPrice)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 border-t border-gray-200 pt-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
            disabled={submitting}
          >
            Hủy
          </button>
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <span className="mr-2">Đang cập nhật...</span>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              </>
            ) : (
              <>
                <FiSave className="mr-2 h-4 w-4" />
                Lưu thay đổi
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}