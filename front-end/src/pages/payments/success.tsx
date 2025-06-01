import React, { useEffect, useState } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { FiCheckCircle, FiHome, FiPackage, FiClock, FiFileText } from 'react-icons/fi';
import DefaultLayout from '@/layout/DefaultLayout';
import { BreadcrumItem } from '@/components/common/Breadcrum';
import { useUserOrder } from '@/contexts/user/UserOrderContext';

// Định nghĩa kiểu dữ liệu
interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  variantId?: string;
  variantName?: string;
}

interface OrderData {
  shippingAddress: {
    fullName: string;
    phone: string;
    email?: string;
    addressLine1: string;
    province: string;
    district: string;
    ward: string;
    notes?: string;
  };
  paymentMethod: string;
  items: OrderItem[];
  subtotal: number;
  tax?: number;
  shippingFee: number;
  totalPrice: number;
  finalPrice: number;
  voucher?: {
    code: string;
    discountAmount: number;
  };
}

const PaymentSuccessPage: NextPage = () => {
  const router = useRouter();

  const [orderNumber, setOrderNumber] = useState('');
  const [estimatedDelivery, setEstimatedDelivery] = useState('');
  const [orderData, setOrderData] = useState<OrderData | null>(null);

  const { fetchOrderDetail } = useUserOrder();

  useEffect(() => {
    const loadOrderData = async () => {
      // Lấy thông tin đơn hàng khác từ localStorage
      const savedOrderData = localStorage.getItem('currentOrder');
      const savedOrderCreatedAt = localStorage.getItem('orderCreatedAt');

      // Lấy tham số từ URL query
      const { extraData, session_id } = router.query;
      // resultCode và message không được sử dụng trong logic hiện tại

      let extractedOrderNumber = '';

      // Xử lý redirect từ Momo
      if (extraData && typeof extraData === 'string') {
        try {
          // Giải mã Base64 extraData
          const decodedExtraData = Buffer.from(extraData, 'base64').toString('utf-8');
          const parsedExtraData = JSON.parse(decodedExtraData);
          // Lấy orderNumber từ extraData đã giải mã
          if (parsedExtraData && parsedExtraData.orderNumber) {
            extractedOrderNumber = parsedExtraData.orderNumber;
            console.log('Extracted orderNumber from URL extraData:', extractedOrderNumber);
          } else {
             console.warn('orderNumber not found in parsed extraData:', parsedExtraData);
          }
        } catch (error) {
          console.error('Error decoding/parsing extraData from URL:', error);
          // Có thể hiển thị thông báo lỗi cho người dùng nếu cần
        }
      } else {
         console.warn('extraData not found in URL query parameters for Momo payment.');
      }

      // Xử lý redirect từ Stripe Checkout (giữ nguyên logic cũ nếu cần)
      if (session_id && typeof session_id === 'string' && session_id.startsWith('cs_')) {
        console.log('Stripe Checkout session completed:', session_id);
        // Nếu là Stripe và chưa có orderNumber từ Momo, thử lấy từ localStorage
        if (!extractedOrderNumber) {
           const savedOrderNumber = localStorage.getItem('orderNumber');
           if (savedOrderNumber) {
             extractedOrderNumber = savedOrderNumber;
             console.log('Using orderNumber from localStorage for Stripe:', extractedOrderNumber);
           }
        }
      }

      // Ưu tiên orderNumber từ URL (Momo), sau đó là localStorage (Stripe fallback), cuối cùng báo lỗi
      if (extractedOrderNumber) {
        setOrderNumber(extractedOrderNumber);
      } else {
        // Fallback: Thử lấy từ localStorage một lần nữa (cho các trường hợp khác)
        const savedOrderNumber = localStorage.getItem('orderNumber');
        if (savedOrderNumber) {
          setOrderNumber(savedOrderNumber);
          console.log('Using orderNumber from localStorage as fallback:', savedOrderNumber);
        } else {
          console.error('Could not determine order number from URL or localStorage!');
          setOrderNumber('Không xác định'); // Hiển thị lỗi hoặc mã tạm
          // Cân nhắc chuyển hướng về trang lỗi hoặc giỏ hàng
          // router.push('/cart');
        }
      }

      // Tính ngày giao hàng dự kiến (3-5 ngày từ hiện tại)
      const today = savedOrderCreatedAt ? new Date(savedOrderCreatedAt) : new Date();
      const deliveryDate = new Date(today);
      deliveryDate.setDate(today.getDate() + 3 + Math.floor(Math.random() * 3)); // 3-5 ngày

      // Format ngày giao hàng
      const day = deliveryDate.getDate();
      const month = deliveryDate.getMonth() + 1;
      const year = deliveryDate.getFullYear();
      setEstimatedDelivery(`${day < 10 ? '0' + day : day}/${month < 10 ? '0' + month : month}/${year}`);

      if (savedOrderData) {
        try {
          const parsedData = JSON.parse(savedOrderData);
          setOrderData(parsedData);
        } catch {
          // Xử lý lỗi khi phân tích dữ liệu đơn hàng
          console.error('Error parsing saved order data');
          router.push('/cart');
        }
      } else {
        // Nếu không có dữ liệu đơn hàng, chuyển hướng về trang giỏ hàng
        router.push('/cart');
      }
    };

    loadOrderData();
  }, [router, fetchOrderDetail]);

  // Breadcrumb items
  const breadcrumbItems: BreadcrumItem[] = [
    { label: 'Giỏ hàng', href: '/cart' },
    { label: 'Thanh toán', href: '/payments' },
    { label: 'Đặt hàng thành công' }
  ];

  return (
    <DefaultLayout breadcrumItems={breadcrumbItems}>
      <Head>
        <title>Đặt hàng thành công | YUMIN</title>
        <meta name="description" content="Đặt hàng thành công tại YUMIN" />
      </Head>

      <main className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm p-6 md:p-8">
            {/* Icon thành công */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-pink-50 flex items-center justify-center">
                <FiCheckCircle className="w-10 h-10 text-pink-600" />
              </div>
            </div>

            {/* Tiêu đề */}
            <h1 className="text-2xl md:text-3xl font-semibold text-center text-gray-800 mb-2">
              Đặt hàng thành công!
            </h1>
            <p className="text-center text-gray-600 mb-8">
              Cảm ơn {orderData?.shippingAddress?.fullName || 'bạn'} đã mua sắm tại YUMIN. Đơn hàng của bạn đã được xác nhận.
            </p>

            {/* Thông tin đơn hàng */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex flex-col md:flex-row justify-between mb-4">
                <div className="mb-4 md:mb-0">
                  <p className="text-sm text-gray-500">Mã đơn hàng</p>
                  <p className="font-semibold text-pink-600">{orderNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Ngày giao hàng dự kiến</p>
                  <p className="font-semibold">{estimatedDelivery}</p>
                </div>
              </div>

              {/* Hiển thị thông tin đơn hàng */}
              {orderData && (
                <div className="border-t border-gray-200 pt-4 pb-2">
                  <p className="text-sm font-medium text-gray-700 mb-2">Thông tin đơn hàng</p>

                  <div className="text-sm text-gray-600 mb-4">
                    <p><span className="font-medium">Họ tên:</span> {orderData.shippingAddress.fullName}</p>
                    <p><span className="font-medium">Điện thoại:</span> {orderData.shippingAddress.phone}</p>
                    <p><span className="font-medium">Địa chỉ:</span> {orderData.shippingAddress.addressLine1}, {orderData.shippingAddress.ward}, {orderData.shippingAddress.district}, {orderData.shippingAddress.province}</p>
                    <p><span className="font-medium">Phương thức thanh toán:</span> {orderData.paymentMethod === 'cod' ? 'Thanh toán khi nhận hàng' : 'Thanh toán online'}</p>
                    {orderData.voucher?.code && <p><span className="font-medium">Mã giảm giá:</span> {orderData.voucher.code}</p>}
                    <div className="mt-2 flex flex-col sm:flex-row sm:justify-between">
                      <span><span className="font-medium">Tạm tính:</span> {new Intl.NumberFormat('vi-VN').format(orderData.subtotal)}đ</span>
                      <span><span className="font-medium">Giảm giá:</span> {new Intl.NumberFormat('vi-VN').format(orderData.voucher?.discountAmount || 0)}đ</span>
                      <span><span className="font-medium">Phí vận chuyển:</span> {orderData.shippingFee > 0 ? `${new Intl.NumberFormat('vi-VN').format(orderData.shippingFee)}đ` : 'Miễn phí'}</span>
                      <span className="font-medium text-pink-600">Tổng: {new Intl.NumberFormat('vi-VN').format(orderData.finalPrice)}đ</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="border-t border-gray-200 pt-4">
                <p className="text-sm text-gray-500 mb-2">Trạng thái đơn hàng</p>
                <div className="relative">
                  {/* Thanh tiến trình */}
                  <div className="h-1 bg-gray-200 rounded-full">
                    <div className="h-1 bg-pink-50 rounded-full w-1/4"></div>
                  </div>

                  {/* Các bước */}
                  <div className="flex justify-between mt-2">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-pink-50 flex items-center justify-center">
                        <FiCheckCircle className="w-4 h-4 text-pink-600" />
                      </div>
                      <span className="text-xs mt-1 text-center">Đã xác nhận</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-pink-50 flex items-center justify-center">
                        <FiPackage className="w-4 h-4 text-pink-600" />
                      </div>
                      <span className="text-xs mt-1 text-center">Đang chuẩn bị</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-pink-50 flex items-center justify-center">
                        <FiClock className="w-4 h-4 text-pink-600" />
                      </div>
                      <span className="text-xs mt-1 text-center">Đang giao</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-pink-50 flex items-center justify-center">
                        <FiFileText className="w-4 h-4 text-pink-600" />
                      </div>
                      <span className="text-xs mt-1 text-center">Đã giao</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Thông tin thêm */}
            <div className="mb-8">
              <p className="text-gray-600 mb-4">
                Chúng tôi đã gửi email xác nhận đơn hàng đến địa chỉ email của bạn. Bạn có thể theo dõi trạng thái đơn hàng trong tài khoản của mình.
              </p>
              <p className="text-gray-600">
                Nếu bạn có bất kỳ câu hỏi nào về đơn hàng, vui lòng liên hệ với chúng tôi qua email <a href="mailto:support@yumin.vn" className="text-[#306E51] hover:underline">support@yumin.vn</a> hoặc gọi đến số <a href="tel:1900123456" className="text-[#306E51] hover:underline">1900 123 456</a>.
              </p>
            </div>

            {/* Các nút hành động */}
            <div className="flex flex-col md:flex-row gap-4">
              <Link href="/" className="flex-1">
                <button className="w-full py-3 px-4 bg-white border border-pink-200 text-pink-600 rounded-md font-medium hover:bg-pink-50 transition-colors flex items-center justify-center">
                  <FiHome className="mr-2" />
                  Về trang chủ
                </button>
              </Link>
              <Link href="/account/orders" className="flex-1">
                <button className="w-full py-3 px-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-md font-medium hover:opacity-90 transition-opacity flex items-center justify-center">
                  <FiFileText className="mr-2" />
                  Xem đơn hàng
                </button>
              </Link>
            </div>

            {/* Sản phẩm gợi ý */}
            <div className="mt-12">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Có thể bạn cũng thích</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {recommendedProducts.map((product) => (
                  <Link key={product.id} href={`/product/${product.slug}`} className="group">
                    <div className="bg-white border border-gray-100 rounded-lg overflow-hidden">
                      <div className="relative h-32 overflow-hidden">
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="p-3">
                        <h3 className="text-sm font-medium text-gray-800 line-clamp-2 group-hover:text-[#306E51] transition-colors">
                          {product.name}
                        </h3>
                        <p className="text-[#306E51] font-medium text-sm mt-1">
                          {new Intl.NumberFormat('vi-VN').format(product.price)}đ
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </DefaultLayout>
  );
};

// Dữ liệu sản phẩm gợi ý
const recommendedProducts = [
  {
    id: 1,
    name: 'Kem Chống Nắng La Roche-Posay Anthelios UVMune 400',
    slug: 'kem-chong-nang-la-roche-posay-anthelios-uvmune-400',
    price: 405000,
    image: '/images/products/kem-chong-nang.jpg',
  },
  {
    id: 2,
    name: 'Serum Vitamin C Klairs Freshly Juiced Vitamin Drop',
    slug: 'serum-vitamin-c-klairs-freshly-juiced-vitamin-drop',
    price: 320000,
    image: '/images/products/serum-vitamin-c.jpg',
  },
  {
    id: 3,
    name: 'Nước Tẩy Trang Bioderma Sensibio H2O',
    slug: 'nuoc-tay-trang-bioderma-sensibio-h2o',
    price: 350000,
    image: '/images/products/nuoc-tay-trang.jpg',
  },
  {
    id: 4,
    name: 'Kem Dưỡng Ẩm CeraVe Moisturizing Cream',
    slug: 'kem-duong-am-cerave-moisturizing-cream',
    price: 315000,
    image: '/images/products/kem-duong-am.jpg',
  },
];

export default PaymentSuccessPage;
