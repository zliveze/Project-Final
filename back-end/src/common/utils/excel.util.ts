import * as XLSX from 'xlsx';
import { join } from 'path';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { Logger } from '@nestjs/common';

const logger = new Logger('ExcelUtils');

/**
 * Tạo file Excel mẫu để import sản phẩm
 */
export function createProductImportTemplate(): string {
  try {
    // Mảng header với các cột trống để đảm bảo đúng vị trí
    const headers = Array(30).fill(''); // Tạo 30 cột trống
    
    // Đặt tên cột theo vị trí
    headers[1] = 'Nhóm hàng (3 Cấp)';
    headers[2] = 'Mã hàng';
    headers[3] = 'Mã vạch';
    headers[4] = 'Tên hàng';
    headers[6] = 'Giá bán';
    headers[7] = 'Giá vốn';  
    headers[8] = 'Tồn kho';
    headers[18] = 'Hình ảnh (url1,url2,...)';
    
    // Dữ liệu mẫu
    const sampleData = [
      headers, // Hàng tiêu đề
      [
        '',                             // Cột 1: Trống
        'Mỹ phẩm/Chăm sóc da/Kem',     // Cột 2: Nhóm hàng (3 cấp)
        'SP001',                        // Cột 3: Mã hàng
        '8938512345678',                // Cột 4: Mã vạch
        'Kem dưỡng da Example',         // Cột 5: Tên hàng
        '',                             // Cột 6: Trống
        '250000',                       // Cột 7: Giá bán
        '180000',                       // Cột 8: Giá vốn
        '100',                          // Cột 9: Tồn kho
        '', '', '', '', '', '', '', '', '', 
        'https://example.com/image1.jpg,https://example.com/image2.jpg' // Cột 19: URL hình ảnh
      ],
      [
        '',                             // Cột 1: Trống
        'Mỹ phẩm/Chăm sóc da/Serum',    // Cột 2: Nhóm hàng (3 cấp)
        'SP002',                        // Cột 3: Mã hàng
        '8938512345679',                // Cột 4: Mã vạch
        'Serum Vitamin C',              // Cột 5: Tên hàng
        '',                             // Cột 6: Trống
        '350000',                       // Cột 7: Giá bán
        '230000',                       // Cột 8: Giá vốn
        '50',                           // Cột 9: Tồn kho
        '', '', '', '', '', '', '', '', '',
        'https://example.com/image3.jpg' // Cột 19: URL hình ảnh
      ]
    ];
    
    // Tạo workbook mới
    const workbook = XLSX.utils.book_new();
    
    // Tạo worksheet từ dữ liệu mẫu
    const worksheet = XLSX.utils.aoa_to_sheet(sampleData);
    
    // Định dạng ô tiêu đề (hàng 1)
    const headerStyle = {
      font: { bold: true, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '4F81BD' } },
      alignment: { horizontal: 'center' }
    };
    
    // Định dạng ô bắt buộc
    const requiredStyle = {
      font: { bold: true },
      fill: { fgColor: { rgb: 'FFFF00' } }
    };
    
    // Các cột bắt buộc
    const requiredColumns = [2, 4]; // Mã hàng (cột 3) và Tên hàng (cột 5) (index bắt đầu từ 0)
    
    // Áp dụng style cho hàng tiêu đề
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:Z3');
    for (let C = range.s.c; C <= range.e.c; C++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
      if (worksheet[cellAddress]) {
        // Áp dụng định dạng cho cột bắt buộc
        if (requiredColumns.includes(C)) {
          worksheet[cellAddress].s = requiredStyle;
        } else if (worksheet[cellAddress].v) {
          // Chỉ định dạng các ô có nội dung
          worksheet[cellAddress].s = headerStyle;
        }
      }
    }
    
    // Thêm worksheet vào workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');
    
    // Tạo thư mục nếu không tồn tại
    const uploadDir = join(process.cwd(), 'uploads');
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true });
    }
    
    // Lưu file
    const filename = 'product-import-template.xlsx';
    const filePath = join(uploadDir, filename);
    
    // Ghi file vào hệ thống
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
    writeFileSync(filePath, excelBuffer);
    
    logger.log(`Đã tạo file mẫu Excel tại: ${filePath}`);
    
    return filePath;
  } catch (error) {
    logger.error(`Lỗi khi tạo file mẫu Excel: ${error.message}`, error.stack);
    throw error;
  }
} 