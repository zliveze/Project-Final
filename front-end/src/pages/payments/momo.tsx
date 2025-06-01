import React, { useEffect } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { FiAlertCircle, FiArrowLeft, FiSmartphone } from 'react-icons/fi';
import DefaultLayout from '@/layout/DefaultLayout';
// Removed unused imports: useUserPayment and useCart

const MomoPaymentPage: NextPage = () => {
  const router = useRouter();
  const { payUrl } = router.query;
  
  // Chuyển hướng đến trang thanh toán MoMo nếu có payUrl
  useEffect(() => {
    if (payUrl && typeof payUrl === 'string') {
      // Chuyển hướng đến trang thanh toán MoMo
      window.location.href = decodeURIComponent(payUrl);
    }
  }, [payUrl]);

  // Breadcrumb items
  const breadcrumbItems = [
    { label: 'Giỏ hàng', href: '/cart' },
    { label: 'Thanh toán', href: '/payments' },
    { label: 'Thanh toán MoMo' }
  ];

  // Quay lại trang thanh toán
  const handleGoBack = () => {
    router.push('/payments');
  };

  return (
    <DefaultLayout breadcrumItems={breadcrumbItems}>
      <Head>
        <title>Thanh toán với MoMo | YUMIN</title>
        <meta name="description" content="Thanh toán đơn hàng với MoMo tại YUMIN" />
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

          <div className="max-w-md mx-auto bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-pink-100 flex items-center justify-center">
                <FiSmartphone className="w-8 h-8 text-pink-600" />
              </div>
            </div>

            <h1 className="text-2xl font-semibold text-center mb-4">Thanh toán với MoMo</h1>
            
            <div className="flex justify-center mb-6">
              <div className="animate-pulse flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-pink-200 mb-2"></div>
                <div className="h-2 w-24 bg-pink-200 rounded"></div>
              </div>
            </div>

            <p className="text-center text-gray-600 mb-6">
              Đang chuyển hướng đến trang thanh toán MoMo...
            </p>

            <div className="bg-pink-50 border border-pink-100 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <FiAlertCircle className="text-pink-600 mt-1 mr-2 flex-shrink-0" />
                <p className="text-sm text-gray-700">
                  Nếu bạn không được chuyển hướng tự động, vui lòng nhấn vào nút bên dưới để tiếp tục thanh toán.
                </p>
              </div>
            </div>

            {payUrl && (
              <a
                href={decodeURIComponent(payUrl as string)}
                className="block w-full py-3 px-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-md font-medium hover:opacity-90 transition-opacity text-center"
              >
                Tiếp tục thanh toán
              </a>
            )}

            {!payUrl && (
              <div className="text-center text-red-500">
                <FiAlertCircle className="inline-block mr-2" />
                Không tìm thấy thông tin thanh toán. Vui lòng thử lại.
              </div>
            )}
          </div>
        </div>
      </main>
    </DefaultLayout>
  );
};

export default MomoPaymentPage;
