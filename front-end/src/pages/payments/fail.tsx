import React from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { FiAlertCircle, FiHome, FiShoppingCart, FiHelpCircle, FiXCircle, FiAlertTriangle, FiCreditCard, FiDollarSign, FiRefreshCw } from 'react-icons/fi';
import DefaultLayout from '@/layout/DefaultLayout';
import { BreadcrumItem } from '@/components/common/Breadcrum';

const PaymentFailPage: NextPage = () => {
  // Breadcrumb items
  const breadcrumbItems: BreadcrumItem[] = [
    { label: 'Giỏ hàng', href: '/cart' },
    { label: 'Thanh toán', href: '/payments' },
    { label: 'Thanh toán thất bại' }
  ];

  return (
    <DefaultLayout breadcrumItems={breadcrumbItems}>
      <Head>
        <title>Thanh toán không thành công | YUMIN</title>
        <meta name="description" content="Thanh toán không thành công tại YUMIN" />
      </Head>

      <main className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm p-6 md:p-8">
            {/* Icon thất bại */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-pink-50 flex items-center justify-center">
                <FiXCircle className="w-10 h-10 text-pink-600" />
              </div>
            </div>
            
            {/* Tiêu đề */}
            <h1 className="text-2xl md:text-3xl font-semibold text-center text-gray-800 mb-2">
              Thanh toán không thành công
            </h1>
            <p className="text-center text-gray-600 mb-8">
              Rất tiếc, đã xảy ra lỗi trong quá trình thanh toán đơn hàng của bạn.
            </p>
            
            {/* Thông tin lỗi */}
            <div className="bg-pink-50 rounded-lg p-4 mb-8 border border-pink-100">
              <h2 className="font-medium text-pink-700 mb-2">Có thể do một trong các nguyên nhân sau:</h2>
              <ul className="list-disc pl-5 text-gray-700 space-y-1">
                <li>Thông tin thẻ không chính xác hoặc đã hết hạn</li>
                <li>Tài khoản của bạn không đủ số dư để thanh toán</li>
                <li>Ngân hàng từ chối giao dịch vì lý do bảo mật</li>
                <li>Kết nối internet không ổn định trong quá trình thanh toán</li>
                <li>Lỗi từ cổng thanh toán</li>
              </ul>
            </div>
            
            {/* Hướng dẫn */}
            <div className="mb-8">
              <h2 className="font-medium text-gray-800 mb-2">Bạn có thể thử các cách sau:</h2>
              <ul className="list-disc pl-5 text-gray-600 space-y-2">
                <li>Kiểm tra lại thông tin thanh toán và thử lại</li>
                <li>Sử dụng phương thức thanh toán khác</li>
                <li>Liên hệ với ngân hàng của bạn để biết thêm thông tin</li>
                <li>Thử lại sau vài phút</li>
              </ul>
            </div>
            
            {/* Thông tin liên hệ */}
            <div className="bg-pink-50 border border-pink-100 rounded-lg p-4 mb-8">
              <h3 className="text-lg font-semibold mb-2 text-pink-600">Cần hỗ trợ?</h3>
              <p className="text-gray-700 mb-2">
                Nếu bạn vẫn gặp vấn đề, vui lòng liên hệ với chúng tôi để được hỗ trợ:
              </p>
              <ul className="text-gray-600 space-y-1">
                <li>Email: <a href="mailto:support@yumin.vn" className="text-[#306E51] hover:underline">support@yumin.vn</a></li>
                <li>Hotline: <a href="tel:1900123456" className="text-[#306E51] hover:underline">1900 123 456</a> (8:00 - 20:00, thứ 2 - chủ nhật)</li>
              </ul>
            </div>
            
            {/* Các nút hành động */}
            <div className="flex flex-col md:flex-row gap-4">
              <Link href="/payments" className="flex-1">
                <button className="w-full py-3 px-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-md font-medium hover:opacity-90 transition-opacity flex items-center justify-center">
                  <FiRefreshCw className="mr-2" />
                  Thử lại thanh toán
                </button>
              </Link>
              <Link href="/" className="flex-1">
                <button className="w-full py-3 px-4 bg-white border border-pink-200 text-pink-600 rounded-md font-medium hover:bg-pink-50 transition-colors flex items-center justify-center">
                  <FiHome className="mr-2" />
                  Về trang chủ
                </button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </DefaultLayout>
  );
};

export default PaymentFailPage; 