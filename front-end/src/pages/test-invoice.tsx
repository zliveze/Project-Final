import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useOrder } from '@/contexts/user/OrderContext';
import { downloadInvoicePDF } from '@/utils/invoiceGenerator';
import DefaultLayout from '@/layout/DefaultLayout';

const TestInvoicePage: React.FC = () => {
  const { downloadInvoice } = useOrder();
  const [orderId, setOrderId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleDownload = async () => {
    if (!orderId || orderId === 'user' || orderId === 'undefined') {
      toast.error('ID đơn hàng không hợp lệ');
      return;
    }

    try {
      setIsLoading(true);
      toast.info('Đang tải xuống hóa đơn...');

      console.log('Downloading invoice for order ID:', orderId);

      // Lấy dữ liệu hóa đơn từ API
      const invoiceData = await downloadInvoice(orderId);

      if (invoiceData) {
        // Tạo và tải xuống file PDF
        await downloadInvoicePDF(invoiceData, `invoice_${invoiceData.orderNumber}.pdf`);
        toast.success('Tải xuống hóa đơn thành công!');
      } else {
        toast.error('Không thể tải hóa đơn');
      }
    } catch (err) {
      console.error('Lỗi khi tải hóa đơn:', err);
      toast.error(err instanceof Error ? err.message : 'Đã xảy ra lỗi khi tải hóa đơn');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DefaultLayout>
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-6">Kiểm tra chức năng tải hóa đơn</h1>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="mb-4">
            <label htmlFor="orderId" className="block text-sm font-medium text-gray-700 mb-1">
              ID đơn hàng
            </label>
            <input
              type="text"
              id="orderId"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
              placeholder="Nhập ID đơn hàng"
            />
          </div>

          <button
            onClick={handleDownload}
            disabled={isLoading}
            className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-md hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isLoading ? 'Đang tải...' : 'Tải hóa đơn'}
          </button>
        </div>
      </div>
    </DefaultLayout>
  );
};

export default TestInvoicePage;
