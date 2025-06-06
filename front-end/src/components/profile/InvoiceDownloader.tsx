import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { useOrder } from '@/contexts/user/OrderContext';
import { downloadInvoicePDF } from '@/utils/invoiceGenerator';

// Import InvoiceData interface
interface InvoiceData {
  orderNumber: string;
  date: string;
  customerName: string;
  customerAddress: string;
  customerPhone: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
}

interface InvoiceDownloaderProps {
  orderId: string;
  buttonText?: string;
  className?: string;
}

const InvoiceDownloader: React.FC<InvoiceDownloaderProps> = ({
  orderId,
  buttonText = 'Tải hóa đơn',
  className = 'flex items-center text-purple-600 hover:text-purple-800 text-sm'
}) => {
  const { downloadInvoice } = useOrder();
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
        // Type assertion để đảm bảo invoiceData có đúng cấu trúc InvoiceData
        const typedInvoiceData = invoiceData as InvoiceData;

        // Kiểm tra các trường bắt buộc
        if (typedInvoiceData.orderNumber && typedInvoiceData.customerName) {
          // Tạo và tải xuống file PDF
          await downloadInvoicePDF(typedInvoiceData, `invoice_${typedInvoiceData.orderNumber}.pdf`);
          toast.success('Tải xuống hóa đơn thành công!');
        } else {
          toast.error('Dữ liệu hóa đơn không hợp lệ');
        }
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
    <button
      onClick={handleDownload}
      disabled={isLoading}
      className={className}
    >
      {isLoading ? (
        <>
          <span className="animate-spin mr-2">⏳</span>
          Đang tải...
        </>
      ) : (
        <>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          {buttonText}
        </>
      )}
    </button>
  );
};

export default InvoiceDownloader;
