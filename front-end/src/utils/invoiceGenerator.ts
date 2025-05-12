import { jsPDF } from 'jspdf';

interface InvoiceItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
}

interface InvoiceData {
  orderNumber: string;
  date: string;
  customerName: string;
  customerAddress: string;
  customerPhone: string;
  items: InvoiceItem[];
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
}

/**
 * Tạo file PDF hóa đơn từ dữ liệu JSON
 * @param invoiceData Dữ liệu hóa đơn
 * @returns Đối tượng jsPDF đã được tạo
 */
export const generateInvoicePDF = (invoiceData: InvoiceData): jsPDF => {
  // Tạo một document PDF mới
  const doc = new jsPDF();
  
  // Thiết lập font và kích thước
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  
  // Tiêu đề
  doc.text('HÓA ĐƠN YUMIN COSMETICS', 105, 20, { align: 'center' });
  
  // Thông tin đơn hàng
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.text(`Mã đơn hàng: ${invoiceData.orderNumber}`, 20, 40);
  doc.text(`Ngày: ${invoiceData.date}`, 20, 50);
  
  // Thông tin khách hàng
  doc.text('Thông tin khách hàng:', 20, 70);
  doc.text(`Tên: ${invoiceData.customerName}`, 30, 80);
  doc.text(`Địa chỉ: ${invoiceData.customerAddress}`, 30, 90);
  doc.text(`Điện thoại: ${invoiceData.customerPhone}`, 30, 100);
  
  // Bảng sản phẩm
  doc.setFontSize(12);
  doc.text('Danh sách sản phẩm:', 20, 120);
  
  // Header của bảng
  doc.setFont('helvetica', 'bold');
  doc.text('Sản phẩm', 20, 130);
  doc.text('SL', 130, 130);
  doc.text('Đơn giá', 150, 130);
  doc.text('Thành tiền', 180, 130);
  
  // Nội dung bảng
  doc.setFont('helvetica', 'normal');
  let y = 140;
  
  invoiceData.items.forEach((item) => {
    // Kiểm tra nếu y quá lớn, tạo trang mới
    if (y > 270) {
      doc.addPage();
      y = 20;
      
      // Thêm header cho trang mới
      doc.setFont('helvetica', 'bold');
      doc.text('Sản phẩm', 20, y);
      doc.text('SL', 130, y);
      doc.text('Đơn giá', 150, y);
      doc.text('Thành tiền', 180, y);
      doc.setFont('helvetica', 'normal');
      y += 10;
    }
    
    // Cắt tên sản phẩm nếu quá dài
    const productName = item.name.length > 40 ? item.name.substring(0, 37) + '...' : item.name;
    
    doc.text(productName, 20, y);
    doc.text(item.quantity.toString(), 130, y);
    doc.text(item.price.toLocaleString('vi-VN') + 'đ', 150, y);
    doc.text(item.total.toLocaleString('vi-VN') + 'đ', 180, y);
    
    y += 10;
  });
  
  // Tổng cộng
  y += 10;
  doc.text('Tạm tính:', 130, y);
  doc.text(invoiceData.subtotal.toLocaleString('vi-VN') + 'đ', 180, y);
  
  y += 10;
  doc.text('Phí vận chuyển:', 130, y);
  doc.text(invoiceData.shippingFee.toLocaleString('vi-VN') + 'đ', 180, y);
  
  if (invoiceData.discount > 0) {
    y += 10;
    doc.text('Giảm giá:', 130, y);
    doc.text('-' + invoiceData.discount.toLocaleString('vi-VN') + 'đ', 180, y);
  }
  
  y += 10;
  doc.setFont('helvetica', 'bold');
  doc.text('Tổng cộng:', 130, y);
  doc.text(invoiceData.total.toLocaleString('vi-VN') + 'đ', 180, y);
  
  // Chân trang
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(10);
  doc.text('Cảm ơn quý khách đã mua hàng tại Yumin Cosmetics!', 105, 280, { align: 'center' });
  
  return doc;
};

/**
 * Tải xuống hóa đơn PDF
 * @param invoiceData Dữ liệu hóa đơn
 * @param filename Tên file PDF (mặc định: invoice.pdf)
 */
export const downloadInvoicePDF = (invoiceData: InvoiceData, filename: string = 'invoice.pdf'): void => {
  const doc = generateInvoicePDF(invoiceData);
  doc.save(filename);
};
