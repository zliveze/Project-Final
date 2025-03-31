import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { FiSave, FiX } from 'react-icons/fi';
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

interface OrderEditFormProps {
  orderId: string;
  onCancel: () => void;
  onSuccess: () => void;
}

export default function OrderEditForm({ orderId, onCancel, onSuccess }: OrderEditFormProps) {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    status: '',
    paymentStatus: '',
    shippingAddress: '',
    shippingContact: '',
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
      
      // Giả lập việc tải dữ liệu từ server
      setTimeout(() => {
        // Dữ liệu mẫu
        const sampleOrderDetail: Order = {
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
        
        setOrder(sampleOrderDetail);
        
        // Thiết lập giá trị form ban đầu
        setFormData({
          status: sampleOrderDetail.status,
          paymentStatus: sampleOrderDetail.paymentStatus,
          shippingAddress: sampleOrderDetail.shippingInfo.address,
          shippingContact: sampleOrderDetail.shippingInfo.contact
        });
        
        setLoading(false);
      }, 800);
    } catch (error) {
      console.error('Error fetching order details:', error);
      setError('Không thể tải chi tiết đơn hàng. Vui lòng thử lại sau.');
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      
      // Chuẩn bị dữ liệu để gửi
      const updatedData = {
        status: formData.status,
        paymentStatus: formData.paymentStatus,
        shippingInfo: {
          address: formData.shippingAddress,
          contact: formData.shippingContact
        }
      };
      
      // Giả lập việc cập nhật dữ liệu
      console.log('Đã cập nhật đơn hàng:', updatedData);
      
      // Giả lập thời gian xử lý
      setTimeout(() => {
        setSubmitting(false);
        toast.success('Cập nhật đơn hàng thành công!', {
          id: `update-order-success-${orderId}`
        });
        onSuccess();
      }, 1000);
      
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Có lỗi xảy ra khi cập nhật đơn hàng. Vui lòng thử lại sau.', {
        id: `update-order-error-${orderId}`
      });
      setError('Có lỗi xảy ra khi cập nhật đơn hàng. Vui lòng thử lại sau.');
      setSubmitting(false);
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
                <option value="pending">Chờ xử lý</option>
                <option value="shipped">Đang giao</option>
                <option value="completed">Hoàn thành</option>
                <option value="cancelled">Đã hủy</option>
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
                <option value="pending">Chưa thanh toán</option>
                <option value="completed">Đã thanh toán</option>
                <option value="failed">Thanh toán thất bại</option>
                <option value="refunded">Đã hoàn tiền</option>
              </select>
            </div>
          </div>
          
          <div>
            <h3 className="text-md font-medium text-gray-900 mb-4">Thông tin giao hàng</h3>
            
            <div className="mb-4">
              <label htmlFor="shippingAddress" className="block text-sm font-medium text-gray-700 mb-1">
                Địa chỉ giao hàng
              </label>
              <textarea
                id="shippingAddress"
                name="shippingAddress"
                value={formData.shippingAddress}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                required
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="shippingContact" className="block text-sm font-medium text-gray-700 mb-1">
                Số điện thoại liên hệ
              </label>
              <input
                type="text"
                id="shippingContact"
                name="shippingContact"
                value={formData.shippingContact}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
                required
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
                {order.products.map((product, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {product.image && (
                          <div className="flex-shrink-0 h-10 w-10 mr-3">
                            <img className="h-10 w-10 rounded-md object-cover" src={product.image} alt={product.productName} />
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">{product.productName}</div>
                          <div className="text-sm text-gray-500">
                            {product.options.shade && `Màu: ${product.options.shade}, `}
                            {product.options.size && `Kích thước: ${product.options.size}`}
                          </div>
                        </div>
                      </div>
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
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan={3} className="px-6 py-3 text-sm text-gray-700 text-right font-medium">
                    Tạm tính:
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-900 text-right font-medium">
                    {formatCurrency(order.totalPrice)}
                  </td>
                </tr>
                {order.discountAmount && order.discountAmount > 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-3 text-sm text-gray-700 text-right font-medium">
                      Giảm giá:
                    </td>
                    <td className="px-6 py-3 text-sm text-red-500 text-right font-medium">
                      -{formatCurrency(order.discountAmount)}
                    </td>
                  </tr>
                )}
                <tr>
                  <td colSpan={3} className="px-6 py-3 text-sm text-gray-700 text-right font-medium">
                    Tổng cộng:
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