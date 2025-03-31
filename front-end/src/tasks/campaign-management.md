# Kế Hoạch Hoàn Thiện Giao Diện Quản Lý Campaigns

## 1. Tổng Quan

### 1.1 Mục Tiêu
- Hoàn thiện giao diện quản lý Campaigns cho trang Admin
- Tạo các chức năng CRUD (Create, Read, Update, Delete) cho Campaigns
- Sử dụng components dạng Popup cho tất cả các chức năng
- Đảm bảo giao diện trực quan, dễ sử dụng

### 1.2 Mô Hình Dữ Liệu Campaigns
```json
{
  "_id": "ObjectId",
  "title": "string",
  "description": "string",
  "type": "string", // ["Hero Banner", "Sale Event"]
  "startDate": "date",
  "endDate": "date",
  "products": [
    {
      "productId": "ObjectId",
      "variantId": "ObjectId", 
      "adjustedPrice": "number" // Giá sản phẩm trong thời gian Campaign
    }
  ],
  "createdAt": "date",
  "updatedAt": "date"
}
```

## 2. Phân Tích Hiện Trạng

### 2.1 Hiện Trạng
- Đã có trang quản lý Campaigns cơ bản (src/pages/admin/campaigns/index.tsx)
- Đã có component hiển thị danh sách Campaigns (src/components/admin/CampaignTable.tsx)
- Đã có các chức năng xử lý sự kiện cơ bản (xem, sửa, xóa, thay đổi trạng thái)
- Chưa có các components popup để thực hiện CRUD

### 2.2 Các Components Cần Phát Triển
1. **CampaignAddModal**: Component popup để tạo mới Campaign
2. **CampaignEditModal**: Component popup để chỉnh sửa Campaign
3. **CampaignViewModal**: Component popup để xem chi tiết Campaign
4. **CampaignForm**: Component form được sử dụng chung cho việc tạo mới và chỉnh sửa Campaign
5. **ProductSelectionTable**: Component để chọn và cấu hình sản phẩm trong Campaign

## 3. Kế Hoạch Thực Hiện

### 3.1 Tạo các Components Cần Thiết
1. Tạo thư mục `src/components/admin/campaigns` để chứa các components liên quan
2. Phát triển các components:
   - `CampaignForm.tsx`: Form nhập thông tin Campaign
   - `CampaignAddModal.tsx`: Modal tạo mới Campaign
   - `CampaignEditModal.tsx`: Modal chỉnh sửa Campaign
   - `CampaignViewModal.tsx`: Modal xem chi tiết Campaign
   - `ProductSelectionTable.tsx`: Bảng chọn sản phẩm cho Campaign

### 3.2 Cập Nhật Trang Quản Lý Campaigns
- Cập nhật file `src/pages/admin/campaigns/index.tsx` để tích hợp các components mới
- Tạo các state và hàm xử lý cho các chức năng CRUD

### 3.3 Chi Tiết Chức Năng CRUD
1. **Create (Tạo mới Campaign)**
   - Hiển thị form với các trường: tiêu đề, mô tả, loại, ngày bắt đầu, ngày kết thúc
   - Cho phép chọn sản phẩm và cấu hình giá điều chỉnh
   - Xác thực dữ liệu đầu vào

2. **Read (Xem chi tiết Campaign)**
   - Hiển thị đầy đủ thông tin của Campaign
   - Hiển thị danh sách sản phẩm trong Campaign
   - Cho phép xem trạng thái Campaign

3. **Update (Cập nhật Campaign)**
   - Form chỉnh sửa với dữ liệu đã có
   - Cho phép thêm/xóa/sửa sản phẩm trong Campaign
   - Xác thực dữ liệu đầu vào

4. **Delete (Xóa Campaign)**
   - Modal xác nhận trước khi xóa
   - Hiển thị thông báo sau khi xóa thành công

## 4. Thiết Kế UI/UX

### 4.1 Tính Năng UI
- Sử dụng theme màu hồng đồng nhất với toàn bộ trang Admin
- Sử dụng các components từ Tailwind CSS
- Các form có responsive design
- Hiển thị thông báo lỗi/thành công phù hợp

### 4.2 Tính Năng UX
- Validation form realtime
- Hỗ trợ chọn ngày với date picker
- Tìm kiếm sản phẩm khi thêm vào Campaign
- Xác nhận trước khi thực hiện các hành động quan trọng

## 5. Roadmap Thực Hiện
1. Tạo CampaignForm component
2. Tạo CampaignAddModal component
3. Tạo CampaignEditModal component
4. Tạo CampaignViewModal component
5. Tạo ProductSelectionTable component
6. Cập nhật trang quản lý Campaigns
7. Thử nghiệm và điều chỉnh giao diện 