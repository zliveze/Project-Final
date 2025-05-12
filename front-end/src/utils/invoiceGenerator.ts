import { jsPDF } from 'jspdf';
import { loadPinSansFont } from './fontLoader';

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
export const generateInvoicePDF = async (invoiceData: InvoiceData): Promise<jsPDF> => {
  // Tạo một document PDF mới
  const doc = new jsPDF();

  // Tải font Pin-Sans
  await loadPinSansFont(doc);

  // Thiết lập font và kích thước cho tiêu đề
  doc.setFont('Pin-Sans', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(0, 0, 0); // Màu đen

  // Tiêu đề
  doc.text('HÓA ĐƠN YUMIN COSMETICS', 105, 20, { align: 'center' });

  // Vẽ đường kẻ phân cách
  doc.setDrawColor(0, 0, 0); // Màu đen
  doc.setLineWidth(0.5);
  doc.line(20, 25, 190, 25);

  // Thông tin đơn hàng
  doc.setFont('Pin-Sans', 'bold');
  doc.setFontSize(12);
  doc.text('THÔNG TIN ĐƠN HÀNG', 20, 35);

  doc.setFont('Pin-Sans', 'normal');
  doc.text(`Mã đơn hàng: ${invoiceData.orderNumber}`, 20, 45);
  doc.text(`Ngày: ${invoiceData.date}`, 20, 55);

  // Vẽ đường kẻ phân cách
  doc.line(20, 60, 190, 60);

  // Thông tin khách hàng
  doc.setFont('Pin-Sans', 'bold');
  doc.text('THÔNG TIN KHÁCH HÀNG', 20, 70);

  doc.setFont('Pin-Sans', 'normal');
  doc.text(`Tên: ${invoiceData.customerName}`, 20, 80);
  doc.text(`Địa chỉ: ${invoiceData.customerAddress}`, 20, 90);
  doc.text(`Điện thoại: ${invoiceData.customerPhone}`, 20, 100);

  // Vẽ đường kẻ phân cách
  doc.line(20, 105, 190, 105);

  // Bảng sản phẩm
  doc.setFont('Pin-Sans', 'bold');
  doc.setFontSize(12);
  doc.text('DANH SÁCH SẢN PHẨM', 105, 115, { align: 'center' });

  // Header của bảng
  doc.setFillColor(240, 240, 240); // Màu xám nhạt
  doc.rect(20, 120, 170, 10, 'F');

  doc.setFont('Pin-Sans', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0); // Màu đen
  doc.text('Sản phẩm', 25, 127);
  doc.text('SL', 130, 127);
  doc.text('Đơn giá', 150, 127);
  doc.text('Thành tiền', 170, 127);

  // Vẽ đường viền cho bảng
  doc.setDrawColor(0, 0, 0); // Màu đen
  doc.setLineWidth(0.1);
  doc.rect(20, 120, 170, 10, 'S'); // Header

  // Nội dung bảng
  doc.setFont('Pin-Sans', 'normal');
  let y = 137;

  // Vẽ đường viền cho bảng
  doc.setDrawColor(0, 0, 0); // Màu đen
  doc.setLineWidth(0.1);
  doc.rect(20, 120, 170, 10 + invoiceData.items.length * 10, 'S');

  // Vẽ các đường kẻ ngang phân cách các dòng
  for (let i = 0; i <= invoiceData.items.length; i++) {
    doc.line(20, 130 + i * 10, 190, 130 + i * 10);
  }

  // Vẽ các đường kẻ dọc phân cách các cột
  doc.line(125, 120, 125, 130 + invoiceData.items.length * 10); // Cột SL
  doc.line(145, 120, 145, 130 + invoiceData.items.length * 10); // Cột Đơn giá
  doc.line(170, 120, 170, 130 + invoiceData.items.length * 10); // Cột Thành tiền

  invoiceData.items.forEach((item) => {
    // Kiểm tra nếu y quá lớn, tạo trang mới
    if (y > 270) {
      doc.addPage();
      y = 30;

      // Thêm header cho trang mới
      doc.setFillColor(240, 240, 240); // Màu xám nhạt
      doc.rect(20, y - 10, 170, 10, 'F');

      doc.setFont('Pin-Sans', 'bold');
      doc.setTextColor(0, 0, 0); // Màu đen
      doc.text('Sản phẩm', 25, y - 3);
      doc.text('SL', 130, y - 3);
      doc.text('Đơn giá', 150, y - 3);
      doc.text('Thành tiền', 170, y - 3);

      // Vẽ đường viền
      doc.setDrawColor(0, 0, 0);
      doc.rect(20, y - 10, 170, 10, 'S');

      doc.setFont('Pin-Sans', 'normal');
      doc.setTextColor(0, 0, 0);
    }

    // Cắt tên sản phẩm nếu quá dài
    const productName = item.name.length > 40 ? item.name.substring(0, 37) + '...' : item.name;

    doc.text(productName, 25, y);
    doc.text(item.quantity.toString(), 130, y);
    doc.text(item.price.toLocaleString('vi-VN') + 'đ', 150, y);
    doc.text(item.total.toLocaleString('vi-VN') + 'đ', 170, y);

    y += 10;
  });

  // Phần tổng cộng
  y += 10;

  // Vẽ đường kẻ phân cách
  doc.line(20, y - 5, 190, y - 5);

  // Thông tin tổng cộng
  doc.setFont('Pin-Sans', 'normal');
  doc.text('Tạm tính:', 130, y);
  doc.text(invoiceData.subtotal.toLocaleString('vi-VN') + 'đ', 170, y);

  y += 10;
  doc.text('Phí vận chuyển:', 130, y);
  doc.text(invoiceData.shippingFee.toLocaleString('vi-VN') + 'đ', 170, y);

  if (invoiceData.discount > 0) {
    y += 10;
    doc.text('Giảm giá:', 130, y);
    doc.text('-' + invoiceData.discount.toLocaleString('vi-VN') + 'đ', 170, y);
  }

  y += 10;
  doc.setFont('Pin-Sans', 'bold');
  doc.text('TỔNG CỘNG:', 130, y);
  doc.text(invoiceData.total.toLocaleString('vi-VN') + 'đ', 170, y);

  // Chân trang
  // Vẽ đường kẻ phân cách
  doc.line(20, 270, 190, 270);

  // Thêm lời cảm ơn
  doc.setFont('Pin-Sans', 'normal');
  doc.setFontSize(10);
  doc.text('Cảm ơn quý khách đã mua hàng tại Yumin Cosmetics!', 105, 280, { align: 'center' });

  // Thêm thông tin liên hệ
  doc.setFontSize(8);
  doc.text('Website: yumin.vn | Email: contact@yumin.vn | Hotline: 1900 1234', 105, 285, { align: 'center' });

  return doc;
};

/**
 * Tải xuống hóa đơn PDF
 * @param invoiceData Dữ liệu hóa đơn
 * @param filename Tên file PDF (mặc định: invoice.pdf)
 */
export const downloadInvoicePDF = async (invoiceData: InvoiceData, filename: string = 'invoice.pdf'): Promise<void> => {
  const doc = await generateInvoicePDF(invoiceData);
  doc.save(filename);
};
