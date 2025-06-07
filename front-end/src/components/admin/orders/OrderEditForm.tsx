import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { FiSave, FiX, FiAlertCircle, FiTrash2 } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { useAdminOrder } from '@/contexts';

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  options?: Record<string, string>;
}

interface ShippingAddress {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  ward: string;
  district: string;
  province: string;
  postalCode?: string;
}

interface Order {
  _id: string;
  status: string;
  paymentStatus: string;
  notes?: string;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  subtotal: number;
  tax: number;
  shippingFee: number;
  totalPrice: number;
  finalPrice: number;
  voucher?: {
    code?: string;
    discountAmount: number;
  };
}

interface OrderEditFormProps {
  orderId: string;
  onCancel: () => void;
  onSuccess: () => void;
}

interface OrderUpdateData {
  notes?: string;
  shippingAddress?: Partial<ShippingAddress>;
  paymentStatus?: string;
  status?: string;
}

export default function OrderEditForm({ orderId, onCancel, onSuccess }: OrderEditFormProps) {
  const {
    fetchOrderDetail,
    updateOrderStatus,
    cancelOrder,
    updateViettelPostStatus,
  } = useAdminOrder();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [reasonModalType, setReasonModalType] = useState<'cancelled' | 'returned' | null>(null);
  const [statusReason, setStatusReason] = useState('');
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

  const fetchOrderDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const orderDetailData = await fetchOrderDetail(orderId);

      if (orderDetailData) {
        setOrder(orderDetailData);

        // Thiết lập giá trị form ban đầu
        setFormData({
          status: orderDetailData.status,
          paymentStatus: orderDetailData.paymentStatus,
          notes: orderDetailData.notes || '',
          shippingAddress: {
            fullName: orderDetailData.shippingAddress.fullName || '',
            phone: orderDetailData.shippingAddress.phone || '',
            addressLine1: orderDetailData.shippingAddress.addressLine1 || '',
            addressLine2: orderDetailData.shippingAddress.addressLine2 || '',
            ward: orderDetailData.shippingAddress.ward || '',
            district: orderDetailData.shippingAddress.district || '',
            province: orderDetailData.shippingAddress.province || '',
            postalCode: orderDetailData.shippingAddress.postalCode || '',
          },
        });

        toast.success('Đã tải thông tin đơn hàng', {
          id: `edit-order-load-${orderId}`
        });
      } else {
        setError('Không tìm thấy thông tin đơn hàng');
      }
    } catch (error: unknown) {
      console.error('Error fetching order details:', error);
      setError(`Không thể tải chi tiết đơn hàng: ${(error instanceof Error ? error.message : String(error)) || 'Vui lòng thử lại sau'}`);
    } finally {
      setLoading(false);
    }
  }, [orderId, fetchOrderDetail]);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId, fetchOrderDetails]);

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
    } else if (name === 'status') {
      // Kiểm tra xem trạng thái mới có cần lý do không
      if ((value === 'cancelled' || value === 'returned') && value !== order?.status) {
        // Hiển thị modal nhập lý do
        setReasonModalType(value as 'cancelled' | 'returned');
        setShowReasonModal(true);
        setStatusReason('');
        return; // Không cập nhật formData ngay lập tức
      }

      // Xử lý các trường thông thường
      setFormData(prev => ({
        ...prev,
        [name]: value
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

      // Kiểm tra xem có thay đổi trạng thái đơn hàng không
      const statusChanged = formData.status !== order?.status;
      const paymentStatusChanged = formData.paymentStatus !== order?.paymentStatus;

      // Nếu có thay đổi trạng thái đơn hàng, sử dụng updateOrderStatus để cập nhật kho
      if (statusChanged) {
        console.log(`[DEBUG] Trạng thái đơn hàng thay đổi từ ${order?.status} thành ${formData.status}`);

        // Kiểm tra xem trạng thái có cần lý do không
        const reason = undefined;
        if (formData.status === 'cancelled' || formData.status === 'returned') {
          // Lý do đã được nhập trong modal trước đó, không cần xử lý thêm
          // vì logic này chỉ chạy khi không có modal reason
        }

        // Sử dụng updateOrderStatus từ context để đảm bảo cập nhật kho chính xác
        const updatedOrder = await updateOrderStatus(orderId, formData.status, reason);

        if (!updatedOrder) {
          throw new Error('Không thể cập nhật trạng thái đơn hàng');
        }
      }

      // Chuẩn bị dữ liệu để gửi (loại bỏ status nếu đã cập nhật ở trên)
      const updatedData: OrderUpdateData = {
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

      // Chỉ cập nhật paymentStatus nếu có thay đổi và chưa cập nhật status
      if (paymentStatusChanged) {
        updatedData.paymentStatus = formData.paymentStatus;
      }

      // Chỉ cập nhật status nếu chưa được cập nhật ở trên
      if (!statusChanged) {
        updatedData.status = formData.status;
      }

      // Gọi API để cập nhật các thông tin khác của đơn hàng
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://backendyumin.vercel.app'}/admin/orders/${orderId}`, {
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
    } catch (error: unknown) {
      console.error('Error updating order:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(`Có lỗi xảy ra khi cập nhật đơn hàng: ${errorMessage || 'Vui lòng thử lại sau'}`, {
        id: `update-order-error-${orderId}`
      });
      setError(`Có lỗi xảy ra khi cập nhật đơn hàng: ${errorMessage || 'Vui lòng thử lại sau'}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Xử lý xác nhận lý do cho trạng thái cancelled/returned
  const handleConfirmStatusReason = async () => {
    if (!statusReason.trim()) {
      toast.error('Vui lòng nhập lý do');
      return;
    }

    if (!reasonModalType) {
      return;
    }

    try {
      setSubmitting(true);

      // Cập nhật trạng thái với lý do
      const updatedOrder = await updateOrderStatus(orderId, reasonModalType, statusReason);

      if (updatedOrder) {
        // Cập nhật formData để phản ánh trạng thái mới
        setFormData(prev => ({
          ...prev,
          status: reasonModalType
        }));

        toast.success(`Cập nhật trạng thái ${reasonModalType === 'cancelled' ? 'hủy' : 'trả hàng'} thành công!`);
        setShowReasonModal(false);
        setStatusReason('');
        setReasonModalType(null);
        onSuccess();
      } else {
        throw new Error('Không thể cập nhật trạng thái đơn hàng');
      }
    } catch (error: unknown) {
      console.error('Error updating order status with reason:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(`Có lỗi xảy ra: ${errorMessage || 'Vui lòng thử lại sau'}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Hiển thị modal xác nhận hủy đơn hàng
  const handleShowCancelModal = () => {
    setShowCancelModal(true);
  };

  // Xử lý hủy đơn hàng
  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) {
      toast.error('Vui lòng nhập lý do hủy đơn hàng');
      return;
    }

    try {
      setSubmitting(true);
      console.log(`[DEBUG] Bắt đầu hủy đơn hàng ${orderId} với lý do: ${cancelReason}`);

      // Gọi API hủy đơn hàng
      const cancelledOrder = await cancelOrder(orderId, cancelReason);
      console.log(`[DEBUG] Kết quả hủy đơn hàng:`, cancelledOrder);

      if (cancelledOrder) {
        // Nếu đơn hàng có mã vận đơn, gửi yêu cầu hủy đến Viettelpost
        if (cancelledOrder.trackingCode) {
          console.log(`[DEBUG] Đơn hàng có mã vận đơn ${cancelledOrder.trackingCode}, gửi yêu cầu hủy đến Viettelpost`);

          const viettelPostData = {
            TYPE: 4, // Mã hủy đơn hàng
            ORDER_NUMBER: cancelledOrder.trackingCode,
            NOTE: `Đơn hàng hủy bởi admin: ${cancelReason}`
          };

          console.log(`[DEBUG] Dữ liệu gửi đến Viettelpost:`, viettelPostData);

          try {
            const vtpResult = await updateViettelPostStatus(orderId, viettelPostData);
            console.log(`[DEBUG] Kết quả từ Viettelpost:`, vtpResult);

            // Kiểm tra xem đơn hàng đã hủy trước đó chưa
            if (vtpResult && vtpResult.status === 'already_cancelled') {
              console.log(`[DEBUG] Đơn hàng đã được hủy trước đó trên Viettelpost`);
              const message = vtpResult.message && typeof vtpResult.message === 'string'
                ? vtpResult.message
                : 'Đơn hàng đã được hủy trước đó trên Viettelpost';
              toast.success(message);
            } else {
              toast.success('Đã hủy đơn hàng và cập nhật trạng thái trên Viettelpost thành công!', {
                id: `cancel-order-vtp-success-${orderId}`
              });
            }
          } catch (vtpError: unknown) {
            console.error('[DEBUG] Lỗi khi cập nhật trạng thái Viettelpost:', vtpError);
            const vtpErrorMessage = vtpError instanceof Error ? vtpError.message : String(vtpError);

            // Đơn hàng đã được hủy trong hệ thống nội bộ, nên vẫn hiển thị thông báo thành công
            toast.success('Đã hủy đơn hàng trong hệ thống nội bộ thành công!', {
              id: `cancel-order-success-${orderId}`
            });

            // Hiển thị thông báo cảnh báo về lỗi Viettelpost
            toast.error(`Không thể cập nhật trạng thái trên Viettelpost: ${vtpErrorMessage || 'Vui lòng thử lại sau'}`, {
              id: `cancel-order-vtp-error-${orderId}`,
              duration: 5000
            });
          }
        } else {
          console.log(`[DEBUG] Đơn hàng không có mã vận đơn, chỉ cập nhật trạng thái nội bộ`);
          toast.success('Đã hủy đơn hàng thành công!', {
            id: `cancel-order-success-${orderId}`
          });
        }

        // Đóng modal và làm mới dữ liệu
        setShowCancelModal(false);
        setCancelReason('');
        onSuccess();
      }
    } catch (error: unknown) {
      console.error('[DEBUG] Lỗi khi hủy đơn hàng:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(`Có lỗi xảy ra khi hủy đơn hàng: ${errorMessage || 'Vui lòng thử lại sau'}`, {
        id: `cancel-order-error-${orderId}`
      });
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
                {order.items.map((item: OrderItem, index: number) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {item.image && (
                          <div className="flex-shrink-0 h-10 w-10 mr-3">
                            <Image src={item.image} alt={item.name} width={40} height={40} className="rounded-md object-cover" />
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

        <div className="flex items-center justify-between space-x-3 border-t border-gray-200 pt-6">
          <button
            type="button"
            onClick={handleShowCancelModal}
            className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            disabled={submitting || order?.status === 'cancelled' || order?.status === 'delivered' || order?.status === 'returned'}
          >
            <FiTrash2 className="mr-2 h-4 w-4" />
            Hủy đơn hàng
          </button>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
              disabled={submitting}
            >
              Đóng
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
        </div>

        {/* Modal xác nhận hủy đơn hàng */}
        {showCancelModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>

              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                      <FiAlertCircle className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">Xác nhận hủy đơn hàng</h3>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          Bạn có chắc chắn muốn hủy đơn hàng này? Hành động này không thể hoàn tác.
                        </p>
                        <div className="mt-4">
                          <label htmlFor="cancelReason" className="block text-sm font-medium text-gray-700">
                            Lý do hủy đơn hàng <span className="text-red-500">*</span>
                          </label>
                          <textarea
                            id="cancelReason"
                            name="cancelReason"
                            rows={3}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            placeholder="Vui lòng nhập lý do hủy đơn hàng"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={handleCancelOrder}
                    disabled={submitting}
                  >
                    {submitting ? 'Đang xử lý...' : 'Xác nhận hủy'}
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={() => setShowCancelModal(false)}
                    disabled={submitting}
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal nhập lý do cho trạng thái cancelled/returned */}
        {showReasonModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>

              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 sm:mx-0 sm:h-10 sm:w-10">
                      <FiAlertCircle className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        {reasonModalType === 'cancelled' ? 'Xác nhận hủy đơn hàng' : 'Xác nhận trả hàng'}
                      </h3>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          Vui lòng nhập lý do {reasonModalType === 'cancelled' ? 'hủy đơn hàng' : 'trả hàng'}.
                        </p>
                        <div className="mt-4">
                          <label htmlFor="statusReason" className="block text-sm font-medium text-gray-700">
                            Lý do <span className="text-red-500">*</span>
                          </label>
                          <textarea
                            id="statusReason"
                            name="statusReason"
                            rows={3}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
                            value={statusReason}
                            onChange={(e) => setStatusReason(e.target.value)}
                            placeholder={`Vui lòng nhập lý do ${reasonModalType === 'cancelled' ? 'hủy đơn hàng' : 'trả hàng'}`}
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-pink-600 text-base font-medium text-white hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={handleConfirmStatusReason}
                    disabled={submitting}
                  >
                    {submitting ? 'Đang xử lý...' : 'Xác nhận'}
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={() => {
                      setShowReasonModal(false);
                      setStatusReason('');
                      setReasonModalType(null);
                      // Reset lại trạng thái trong dropdown về giá trị cũ
                      setFormData(prev => ({
                        ...prev,
                        status: order?.status || ''
                      }));
                    }}
                    disabled={submitting}
                  >
                    Hủy
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
