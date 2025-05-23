HƯỚNG DẪN TẠO FILE EXCEL IMPORT SẢN PHẨM

File Excel cần có các cột sau (vị trí cột không được thay đổi):
Cột 2: Nhóm hàng (3 Cấp) - Được đưa vào danh mục
Cột 3: Mã hàng - Đưa vào mã SKU (bắt buộc)
Cột 4: Mã vạch - Được thêm vào phần đầu của mô tả đầy đủ
Cột 5: Tên hàng - Tên sản phẩm (bắt buộc)
Cột 7: Giá bán - Giá hiện tại (currentPrice)
Cột 8: Giá vốn - Giá gốc (originalPrice)
Cột 9: Tồn kho - Số lượng tại chi nhánh được chọn
Cột 19: Hình ảnh - Các URL hình ảnh, phân cách bằng dấu phẩy (url1,url2,...)

Lưu ý:
- Dòng đầu tiên của file Excel phải là tên các cột
- Các cột bắt buộc: Mã hàng (3) và Tên hàng (5)
- Mã hàng phải là duy nhất, nếu đã tồn tại thì sẽ cập nhật sản phẩm
- Mã vạch sẽ được tự động thêm vào phần đầu của mô tả đầy đủ
- URL hình ảnh phải là đường dẫn HTTP/HTTPS hợp lệ 
- Hệ thống sẽ tự động tạo slug từ tên sản phẩm
- Đơn vị của các số là VNĐ, không cần thêm đơn vị

KHẮC PHỤC CÁC LỖI THƯỜNG GẶP:

1. Lỗi "File Excel trống hoặc không hợp lệ":
   - Đảm bảo file Excel có định dạng .xlsx hoặc .xls
   - Kích thước file không vượt quá 10MB
   - Không chứa macro, mật khẩu bảo vệ hoặc các tính năng nâng cao khác
   - Thử lưu lại file dưới định dạng Excel 2007-2019 (.xlsx) tiêu chuẩn

2. Lỗi "File Excel không có dữ liệu sản phẩm":
   - Đảm bảo file có ít nhất 2 dòng (1 dòng tiêu đề và 1 dòng dữ liệu)
   - Kiểm tra các sheet khác nếu dữ liệu không nằm trong sheet đầu tiên
   - Đảm bảo các cột bắt buộc (Mã hàng, Tên hàng) có dữ liệu

3. Lỗi khi nhập dữ liệu:
   - Nếu có lỗi với một số dòng, hệ thống vẫn tiếp tục xử lý các dòng còn lại
   - Kết quả import sẽ hiển thị số lượng sản phẩm thành công và danh sách lỗi
   - Nếu xảy ra lỗi với toàn bộ file, hãy kiểm tra lại định dạng và cấu trúc file

Nếu vẫn gặp vấn đề, hãy tải về file mẫu từ hệ thống và điền dữ liệu vào file mẫu đó.
