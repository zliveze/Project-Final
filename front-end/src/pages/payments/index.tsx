import React, { useState, useEffect, useRef } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FiAlertCircle } from 'react-icons/fi';

// Components
import ShippingForm from '@/components/payments/ShippingForm';
import PaymentMethods, { PaymentMethod } from '@/components/payments/PaymentMethods';
import OrderSummary from '@/components/payments/OrderSummary';
import Breadcrum from '@/components/common/Breadcrum';
import DefaultLayout from '@/layout/DefaultLayout';

// Định nghĩa kiểu dữ liệu
interface ShippingInfo {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  district: string;
  ward: string;
  notes?: string;
}

interface OrderItem {
  _id: string;
  name: string;
  slug: string;
  price: number;
  quantity: number;
  image: {
    url: string;
    alt: string;
  };
}

// Dữ liệu mẫu cho đơn hàng
const sampleOrderItems: OrderItem[] = [
  {
    _id: '1',
    name: 'Kem Chống Nắng La Roche-Posay Anthelios UVMune 400',
    slug: 'kem-chong-nang-la-roche-posay-anthelios-uvmune-400',
    price: 405000,
    quantity: 1,
    image: {
      url: 'https://product.hstatic.net/1000006063/product/1_9b2a8d9c4e8c4e7a9a3e270d8d0c4c0d_1024x1024.jpg',
      alt: 'Kem Chống Nắng La Roche-Posay'
    }
  },
  {
    _id: '2',
    name: 'Serum Vitamin C Klairs Freshly Juiced Vitamin Drop',
    slug: 'serum-vitamin-c-klairs-freshly-juiced-vitamin-drop',
    price: 320000,
    quantity: 2,
    image: {
      url: 'https://product.hstatic.net/1000006063/product/1_9b2a8d9c4e8c4e7a9a3e270d8d0c4c0d_1024x1024.jpg',
      alt: 'Serum Vitamin C Klairs'
    }
  }
];

const PaymentsPage: NextPage = () => {
  const router = useRouter();
  
  // State
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [shipping, setShipping] = useState(0);
  const [total, setTotal] = useState(0);
  const [voucherCode, setVoucherCode] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // State cho thông tin giao hàng và phương thức thanh toán
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  
  // Giả lập việc tải dữ liệu từ API
  useEffect(() => {
    // Trong thực tế, đây sẽ là một API call để lấy thông tin đơn hàng từ giỏ hàng
    const fetchOrderData = async () => {
      try {
        // Giả lập thời gian tải
        await new Promise(resolve => setTimeout(resolve, 800));
        
        setOrderItems(sampleOrderItems);
        
        // Tính tổng giá trị đơn hàng
        const calculatedSubtotal = sampleOrderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
        setSubtotal(calculatedSubtotal);
        
        // Giả định có mã giảm giá
        const calculatedDiscount = Math.round(calculatedSubtotal * 0.1); // Giảm 10%
        setDiscount(calculatedDiscount);
        setVoucherCode('WELCOME10');
        
        // Tính phí vận chuyển (miễn phí nếu tổng giá trị > 500.000đ)
        const calculatedShipping = calculatedSubtotal > 500000 ? 0 : 30000;
        setShipping(calculatedShipping);
        
        // Tính tổng cộng
        setTotal(calculatedSubtotal - calculatedDiscount + calculatedShipping);
      } catch (error) {
        console.error('Lỗi khi tải thông tin đơn hàng:', error);
        toast.error('Không thể tải thông tin đơn hàng. Vui lòng thử lại sau.');
        router.push('/cart');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrderData();
    
    // Kiểm tra xem có thông tin giao hàng đã lưu không
    const savedShippingInfo = localStorage.getItem('shippingInfo');
    if (savedShippingInfo) {
      setShippingInfo(JSON.parse(savedShippingInfo));
    }
  }, [router]);

  // Xử lý cập nhật thông tin giao hàng
  const handleShippingInfoSubmit = (values: ShippingInfo) => {
    setShippingInfo(values);
    setErrorMessage(null); // Xóa thông báo lỗi khi lưu thông tin thành công
    
    // Lưu thông tin giao hàng vào localStorage để sử dụng lần sau
    localStorage.setItem('shippingInfo', JSON.stringify(values));
    
    toast.success('Đã cập nhật thông tin giao hàng', {
      position: "bottom-right",
      autoClose: 2000,
      theme: "light",
      style: { backgroundColor: '#fdf2f8', color: '#db2777', borderLeft: '4px solid #db2777' }
    });
  };

  // Xử lý đặt hàng
  const handlePlaceOrder = async () => {
    // Kiểm tra xem đã có thông tin giao hàng chưa
    if (!shippingInfo) {
      // Hiển thị thông báo lỗi
      setErrorMessage('Vui lòng nhập và lưu thông tin giao hàng trước khi đặt hàng');
      toast.error('Vui lòng nhập và lưu thông tin giao hàng trước khi đặt hàng', {
        position: "bottom-right",
        autoClose: 3000,
        theme: "light"
      });
      
      // Cuộn đến form thông tin giao hàng
      const shippingFormElement = document.querySelector('.shipping-form');
      if (shippingFormElement) {
        shippingFormElement.scrollIntoView({ behavior: 'smooth' });
      }
      
      return;
    }
    
    // Kiểm tra xem đã chọn phương thức thanh toán chưa
    if (!paymentMethod) {
      setErrorMessage('Vui lòng chọn phương thức thanh toán');
      toast.error('Vui lòng chọn phương thức thanh toán', {
        position: "bottom-right",
        autoClose: 3000,
        theme: "light"
      });
      return;
    }
    
    // Xóa thông báo lỗi nếu mọi thứ hợp lệ
    setErrorMessage(null);
    setIsProcessing(true);
    
    try {
      // Trong thực tế, đây sẽ là một API call để tạo đơn hàng
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Tạo đơn hàng thành công, chuyển đến trang xác nhận
      router.push('/payments/success');
    } catch (error) {
      console.error('Lỗi khi đặt hàng:', error);
      setIsProcessing(false);
      setErrorMessage('Đã xảy ra lỗi khi xử lý đơn hàng. Vui lòng thử lại sau.');
      
      // Xử lý lỗi, chuyển đến trang thất bại
      router.push('/payments/fail');
    }
  };

  // Breadcrumb items
  const breadcrumbItems = [
    { label: 'Giỏ hàng', href: '/cart' },
    { label: 'Thanh toán' }
  ];

  return (
    <DefaultLayout breadcrumItems={breadcrumbItems}>
      <Head>
        <title>Thanh toán | YUMIN</title>
        <meta name="description" content="Thanh toán đơn hàng tại YUMIN" />
      </Head>

      <main className="min-h-screen bg-gray-50 pb-12">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-semibold text-gray-800 mt-6 mb-8">Thanh toán</h1>
          
          {/* Hiển thị thông báo lỗi nếu có */}
          {errorMessage && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <FiAlertCircle className="h-5 w-5 text-red-500" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{errorMessage}</p>
                </div>
              </div>
            </div>
          )}
          
          {isLoading ? (
            // Hiển thị skeleton loading
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-1/4 mb-6"></div>
                  <div className="space-y-4">
                    <div className="h-10 bg-gray-200 rounded"></div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-1/4 mb-6"></div>
                  <div className="space-y-4">
                    <div className="h-16 bg-gray-200 rounded"></div>
                    <div className="h-16 bg-gray-200 rounded"></div>
                    <div className="h-16 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>
              
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-40 bg-gray-200 rounded mb-4"></div>
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between">
                      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    </div>
                    <div className="flex justify-between">
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/5"></div>
                    </div>
                    <div className="flex justify-between">
                      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    </div>
                    <div className="pt-3 flex justify-between">
                      <div className="h-5 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-5 bg-gray-200 rounded w-1/3"></div>
                    </div>
                  </div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {/* Form thông tin giao hàng */}
                <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 shipping-form">
                  <ShippingForm
                    initialValues={shippingInfo || undefined}
                    onSubmit={handleShippingInfoSubmit}
                    showSubmitButton={!shippingInfo} // Chỉ hiển thị nút khi chưa có thông tin
                  />
                  
                  {/* Hiển thị thông tin đã lưu và nút chỉnh sửa */}
                  {shippingInfo && (
                    <div className="mt-4 border-t border-gray-100 pt-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-medium text-gray-700">Thông tin giao hàng đã lưu</h3>
                        <button
                          type="button"
                          onClick={() => setShippingInfo(null)}
                          className="text-sm text-[#306E51] hover:underline"
                        >
                          Chỉnh sửa
                        </button>
                      </div>
                      <div className="mt-2 text-sm text-gray-600">
                        <p><span className="font-medium">Họ tên:</span> {shippingInfo.fullName}</p>
                        <p><span className="font-medium">Số điện thoại:</span> {shippingInfo.phone}</p>
                        <p><span className="font-medium">Địa chỉ:</span> {shippingInfo.address}, {shippingInfo.ward}, {shippingInfo.district}, {shippingInfo.city}</p>
                        {shippingInfo.email && <p><span className="font-medium">Email:</span> {shippingInfo.email}</p>}
                        {shippingInfo.notes && <p><span className="font-medium">Ghi chú:</span> {shippingInfo.notes}</p>}
                      </div>
                      
                      {/* Nút đặt hàng cho thiết bị di động */}
                      <div className="mt-4 lg:hidden">
                        <button
                          type="button"
                          onClick={handlePlaceOrder}
                          disabled={isProcessing}
                          className={`w-full py-3 rounded-md font-medium flex items-center justify-center ${
                            isProcessing
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-[#306E51] text-white hover:bg-[#266246] transition-colors'
                          }`}
                        >
                          {isProcessing ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Đang xử lý...
                            </>
                          ) : (
                            <>
                              Đặt hàng
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Phương thức thanh toán */}
                <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
                  <PaymentMethods
                    selectedMethod={paymentMethod}
                    onSelectMethod={setPaymentMethod}
                  />
                </div>
              </div>
              
              <div className="lg:col-span-1">
                {/* Tóm tắt đơn hàng */}
                <OrderSummary
                  items={orderItems}
                  subtotal={subtotal}
                  discount={discount}
                  shipping={shipping}
                  total={total}
                  voucherCode={voucherCode}
                  onPlaceOrder={handlePlaceOrder}
                  isProcessing={isProcessing}
                />
              </div>
            </div>
          )}
        </div>
      </main>
      
      {/* Toast Container */}
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </DefaultLayout>
  );
};

export default PaymentsPage; 