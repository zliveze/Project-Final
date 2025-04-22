import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FiAlertCircle, FiArrowLeft, FiCreditCard } from 'react-icons/fi';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import DefaultLayout from '@/layout/DefaultLayout';
import { useUserPayment } from '@/contexts/user/UserPaymentContext';
import { useCart } from '@/contexts/user/cart/CartContext';

// Khởi tạo Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

// Component thanh toán Stripe
const StripeCheckoutForm: React.FC<{ clientSecret: string; orderId: string }> = ({
  clientSecret,
  orderId
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const { confirmPayment } = useUserPayment();
  const { clearCart } = useCart();

  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const [disabled, setDisabled] = useState(true);

  // Xử lý khi thẻ thay đổi
  const handleChange = (event: any) => {
    setDisabled(event.empty);
    setError(event.error ? event.error.message : '');
  };

  // Xử lý khi submit form
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);

    try {
      // Lấy CardElement
      const cardElement = elements.getElement(CardElement);

      if (!cardElement) {
        throw new Error('Không thể lấy thông tin thẻ');
      }

      // Xác nhận thanh toán với Stripe
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        }
      });

      if (error) {
        setError(`Thanh toán thất bại: ${error.message}`);
        setProcessing(false);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Thanh toán thành công, cập nhật đơn hàng
        await confirmPayment(paymentIntent.id, orderId);

        // Lưu thông tin đơn hàng vào localStorage
        localStorage.setItem('paymentStatus', 'succeeded');

        // Xóa giỏ hàng
        await clearCart();

        setSucceeded(true);
        setProcessing(false);

        // Chuyển đến trang thành công
        router.push('/payments/success');
      }
    } catch (err: any) {
      setError(`Đã xảy ra lỗi khi xử lý thanh toán: ${err.message}`);
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="stripe-form">
      <div className="mb-6">
        <label className="block text-gray-700 text-sm font-medium mb-2">
          Thông tin thẻ
        </label>
        <div className="border border-gray-300 rounded-md p-4 bg-white">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
                invalid: {
                  color: '#9e2146',
                },
              },
            }}
            onChange={handleChange}
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <FiAlertCircle className="h-5 w-5 text-red-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={processing || disabled || succeeded}
        className={`w-full py-3 rounded-md font-medium flex items-center justify-center ${
          processing || disabled || succeeded
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-[#306E51] text-white hover:bg-[#266246] transition-colors'
        }`}
      >
        {processing ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Đang xử lý...
          </>
        ) : succeeded ? (
          'Thanh toán thành công'
        ) : (
          'Thanh toán'
        )}
      </button>
    </form>
  );
};

// Trang thanh toán Stripe
const StripePaymentPage: NextPage = () => {
  const router = useRouter();
  const { order_id } = router.query;

  const [clientSecret, setClientSecret] = useState<string>('');
  const [orderId, setOrderId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Lấy thông tin thanh toán từ localStorage
  useEffect(() => {
    if (router.isReady) {
      const id = order_id as string;
      const secret = localStorage.getItem('paymentIntentClientSecret');

      if (!id || !secret) {
        setError('Không tìm thấy thông tin thanh toán. Vui lòng thử lại.');
        setLoading(false);
        return;
      }

      setOrderId(id);
      setClientSecret(secret);
      setLoading(false);
    }
  }, [router.isReady, order_id]);

  // Breadcrumb items
  const breadcrumbItems = [
    { label: 'Giỏ hàng', href: '/cart' },
    { label: 'Thanh toán', href: '/payments' },
    { label: 'Thanh toán Stripe' }
  ];

  // Quay lại trang thanh toán
  const handleGoBack = () => {
    router.push('/payments');
  };

  return (
    <DefaultLayout breadcrumItems={breadcrumbItems}>
      <Head>
        <title>Thanh toán với Stripe | YUMIN</title>
        <meta name="description" content="Thanh toán đơn hàng với Stripe tại YUMIN" />
      </Head>

      <main className="min-h-screen bg-gray-50 pb-12">
        <div className="container mx-auto px-4 py-6">
          <button
            onClick={handleGoBack}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <FiArrowLeft className="mr-2" />
            Quay lại
          </button>

          <h1 className="text-2xl font-semibold text-gray-800 mt-2 mb-8">Thanh toán với Stripe</h1>

          {loading ? (
            <div className="bg-white rounded-lg shadow-sm p-8 max-w-md mx-auto">
              <div className="animate-pulse space-y-4">
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            </div>
          ) : error ? (
            <div className="bg-white rounded-lg shadow-sm p-8 max-w-md mx-auto">
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <FiAlertCircle className="h-5 w-5 text-red-500" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
              <button
                onClick={handleGoBack}
                className="w-full py-3 rounded-md font-medium bg-[#306E51] text-white hover:bg-[#266246] transition-colors"
              >
                Quay lại trang thanh toán
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-8 max-w-md mx-auto">
              <div className="flex items-center justify-center mb-6">
                <FiCreditCard className="text-[#306E51] text-3xl" />
                <span className="ml-2 text-lg font-medium">Stripe</span>
              </div>

              <p className="text-gray-600 mb-6 text-center">
                Vui lòng nhập thông tin thẻ của bạn để hoàn tất thanh toán
              </p>

              {clientSecret && (
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <StripeCheckoutForm clientSecret={clientSecret} orderId={orderId} />
                </Elements>
              )}
            </div>
          )}
        </div>
      </main>

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

export default StripePaymentPage;
