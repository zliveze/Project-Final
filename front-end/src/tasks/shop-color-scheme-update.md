# Kế Hoạch Đồng Bộ Hóa Màu Sắc Trang Shop và Components

## Phân tích hiện trạng
Dựa trên phân tích trang Shop và các components liên quan, tôi nhận thấy hiện tại hệ thống sử dụng màu sắc chính là xanh lá (#306E51), trong khi định hướng thiết kế mới của website Yumin là sử dụng gam màu hồng và tím để phù hợp với thương hiệu mỹ phẩm. Các màu chính đang được sử dụng:

1. **Màu chính**: #306E51 (xanh lá đậm)
2. **Màu phụ**: #e6f0eb (xanh lá nhạt)
3. **Màu nền gradient**: from-[#f8faf9] to-[#e6f0eb]
4. **Màu hover/focus**: #266246 (xanh lá đậm hơn)
5. **Màu nền thông báo**: #f8faf9 (xanh lá rất nhạt)

## Yêu cầu thay đổi
Theo file "home-upgrade-plan.md", màu sắc cần được thay đổi từ tông xanh lá sang tông hồng và tím phù hợp với theme mỹ phẩm. Trang 404 đã áp dụng phối màu mới với:
- Gradient: from-[#fdf2f8] to-[#f5f3ff] (từ hồng nhạt sang tím nhạt)
- Màu chính: #d53f8c (hồng) và #805ad5 (tím)

## Bảng màu mới cần áp dụng
Dựa trên phân tích, tôi đề xuất bảng màu sau để đồng bộ với thiết kế:

1. **Màu chính 1**: #d53f8c (hồng)
2. **Màu chính 2**: #805ad5 (tím)
3. **Màu phụ 1**: #fdf2f8 (hồng nhạt)
4. **Màu phụ 2**: #f5f3ff (tím nhạt)
5. **Màu nền gradient**: from-[#fdf2f8] to-[#f5f3ff]
6. **Màu hover/focus hồng**: #b83280 (hồng đậm hơn)
7. **Màu hover/focus tím**: #6b46c1 (tím đậm hơn)
8. **Màu nền thông báo**: #fdf2f8 (hồng nhạt)

## Nhiệm vụ cần thực hiện
[x] Nhiệm vụ 1: Cập nhật màu sắc trong ShopBanner.tsx
[x] Nhiệm vụ 2: Cập nhật màu sắc trong ShopPagination.tsx
[x] Nhiệm vụ 3: Cập nhật màu sắc trong ShopFilters.tsx
[x] Nhiệm vụ 4: Cập nhật màu sắc trong trang index.tsx của Shop

## Chi tiết nhiệm vụ

### Nhiệm vụ 1: Cập nhật màu sắc trong ShopBanner.tsx (Đã hoàn thành)
- Thay đổi `bg-gradient-to-b from-[#f8faf9] to-[#e6f0eb]` thành `bg-gradient-to-b from-[#fdf2f8] to-[#f5f3ff]`
- Thay đổi `bg-[#306E51]` thành `bg-[#d53f8c]`
- Thay đổi `text-[#306E51]` thành `text-[#d53f8c]`
- Thay đổi `bg-[#e6f0eb]` thành `bg-[#fdf2f8]`
- Thay đổi `hover:bg-[#266246]` thành `hover:bg-[#b83280]`

### Nhiệm vụ 2: Cập nhật màu sắc trong ShopPagination.tsx (Đã hoàn thành)
- Thay đổi `text-[#306E51]` thành `text-gradient-to-r from-[#d53f8c] to-[#805ad5]`
- Thay đổi `hover:bg-[#e6f0eb]` thành `hover:bg-[#fdf2f8]`
- Thay đổi `bg-[#306E51]` thành `bg-gradient-to-r from-[#d53f8c] to-[#805ad5]`

### Nhiệm vụ 3: Cập nhật màu sắc trong ShopFilters.tsx (Đã hoàn thành)
- Thay đổi tất cả instance của `text-[#306E51]` thành `text-[#d53f8c]`
- Thay đổi tất cả instance của `bg-[#306E51]` thành `bg-gradient-to-r from-[#d53f8c] to-[#805ad5]`
- Thay đổi tất cả instance của `border-[#306E51]` thành `border-[#d53f8c]`
- Thay đổi tất cả instance của `ring-[#306E51]` thành `ring-[#d53f8c]`
- Thay đổi tất cả checkbox và radio với màu gradient phù hợp
- Thay đổi slider range với màu gradient phù hợp

### Nhiệm vụ 4: Cập nhật màu sắc trong trang index.tsx của Shop (Đã hoàn thành)
- Thay đổi tất cả instance của `bg-[#e6f0eb]` thành `bg-[#fdf2f8]`
- Thay đổi tất cả instance của `text-[#306E51]` thành `text-[#d53f8c]`
- Thay đổi tất cả instance của `bg-[#306E51]` thành `bg-gradient-to-r from-[#d53f8c] to-[#805ad5]`
- Thay đổi tất cả instance của `hover:bg-[#266246]` thành `hover:bg-[#b83280]`
- Thay đổi instance của `bg-[#f8faf9]` thành `bg-[#fdf2f8]`

## Kết quả đạt được
- Màu sắc của trang Shop đã được đồng bộ theo thiết kế mới với tông màu hồng và tím
- Các component như ShopBanner, ShopPagination, ShopFilters đã được cập nhật để phù hợp với bảng màu mới
- Giao diện trang Shop hiện đã thống nhất với phong cách thiết kế mới của website Yumin
- Các yếu tố tương tác như nút bấm, bộ lọc, phân trang đã được cập nhật với hiệu ứng hover và focus phù hợp

## Lưu ý khi thực hiện
- Đảm bảo contrast đủ giữa text và background để đảm bảo khả năng đọc
- Kiểm tra hiển thị UI trên các kích thước màn hình khác nhau sau khi thay đổi
- Một số trường hợp có thể cần thêm text-white khi background là gradient màu đậm
- Đối với một số thành phần interactive, cân nhắc sử dụng animation và transition mượt mà khi hover/focus 