# Kế Hoạch Đồng Bộ Hóa Màu Sắc Trang Chi Tiết Sản Phẩm

## Phân tích hiện trạng
Từ phân tích trang chi tiết sản phẩm và các components liên quan trong thư mục `/components/product`, tôi nhận thấy hiện tại hệ thống đang sử dụng màu chính là xanh lá (#306E51), trong khi định hướng thiết kế mới của website Yumin là sử dụng gam màu hồng và tím để phù hợp với thương hiệu mỹ phẩm. Các màu chính đang được sử dụng:

1. **Màu chính**: #306E51 (xanh lá đậm)
2. **Màu phụ**: #e6f0eb (xanh lá nhạt), #edf7f2 (xanh lá nhạt cho thông báo)
3. **Màu hover/focus**: #266246 (xanh lá đậm hơn)
4. **Màu nền thông báo**: #edf7f2 (xanh lá nhạt)

## Yêu cầu thay đổi
Theo file "shop-color-scheme-update.md", màu sắc cần được thay đổi từ tông xanh lá sang tông hồng và tím phù hợp với theme mỹ phẩm. Trang Shop đã áp dụng phối màu mới với:
- Gradient: from-[#fdf2f8] to-[#f5f3ff] (từ hồng nhạt sang tím nhạt)
- Màu chính: #d53f8c (hồng) và #805ad5 (tím)

## Bảng màu mới cần áp dụng
Dựa trên phân tích, tôi đề xuất bảng màu sau để đồng bộ với thiết kế của trang Shop:

1. **Màu chính 1**: #d53f8c (hồng)
2. **Màu chính 2**: #805ad5 (tím)
3. **Màu phụ 1**: #fdf2f8 (hồng nhạt)
4. **Màu phụ 2**: #f5f3ff (tím nhạt)
5. **Màu nền gradient**: from-[#fdf2f8] to-[#f5f3ff]
6. **Màu hover/focus hồng**: #b83280 (hồng đậm hơn)
7. **Màu hover/focus tím**: #6b46c1 (tím đậm hơn)
8. **Màu nền thông báo**: #fdf2f8 (hồng nhạt)

## Các file cần cập nhật
1. `src/components/product/ProductVariants.tsx`
2. `src/components/product/ProductInfo.tsx`
3. `src/pages/product/[slug].tsx`
4. Các component khác trong thư mục `/components/product`

## Nhiệm vụ cần thực hiện
[x] Nhiệm vụ 1: Cập nhật màu sắc trong ProductVariants.tsx
[x] Nhiệm vụ 2: Cập nhật màu sắc trong ProductInfo.tsx
[x] Nhiệm vụ 3: Cập nhật màu sắc trong trang [slug].tsx
[x] Nhiệm vụ 4: Cập nhật màu sắc trong ProductReviews.tsx
[x] Nhiệm vụ 5: Cập nhật màu sắc trong các file component khác

## Chi tiết nhiệm vụ

### Nhiệm vụ 1: Cập nhật màu sắc trong ProductVariants.tsx
- Thay đổi tất cả instance của `border-[#306E51]` thành `border-[#d53f8c]`
- Thay đổi tất cả instance của `ring-[#306E51]` thành `ring-[#d53f8c]`
- Thay đổi tất cả instance của `bg-[#306E51]` thành `bg-gradient-to-r from-[#d53f8c] to-[#805ad5]`
- Thay đổi tất cả instance của `text-[#306E51]` thành `text-[#d53f8c]`
- Thay đổi tất cả instance của `bg-opacity-10` để phù hợp với màu gradient mới

### Nhiệm vụ 2: Cập nhật màu sắc trong ProductInfo.tsx
- Thay đổi tất cả instance của `text-[#306E51]` thành `text-[#d53f8c]` hoặc `text-gradient-to-r from-[#d53f8c] to-[#805ad5]` tùy theo vị trí
- Thay đổi tất cả instance của `hover:text-[#306E51]` thành `hover:text-[#d53f8c]`
- Thay đổi tất cả instance của `bg-[#306E51]` thành `bg-gradient-to-r from-[#d53f8c] to-[#805ad5]`
- Thay đổi tất cả instance của `hover:bg-[#266246]` thành `hover:bg-[#b83280]`
- Thay đổi style thông báo toast có màu xanh lá sang màu hồng phù hợp

### Nhiệm vụ 3: Cập nhật màu sắc trong trang [slug].tsx
- Thay đổi tất cả instance của `hover:text-[#306E51]` thành `hover:text-[#d53f8c]`
- Thay đổi background của các div section từ `bg-white` thành `bg-gradient-to-r from-white to-[#fdf2f8] opacity-50` hoặc phù hợp
- Cập nhật màu sắc của breadcrumb và các button

### Nhiệm vụ 4: Cập nhật màu sắc trong ProductReviews.tsx
- Thay đổi tất cả instance của `text-[#306E51]` thành `text-[#d53f8c]`
- Thay đổi tất cả instance của `bg-[#306E51]` hoặc có liên quan thành `bg-gradient-to-r from-[#d53f8c] to-[#805ad5]`
- Thay đổi các button và form elements để phù hợp với màu sắc mới

### Nhiệm vụ 5: Cập nhật màu sắc trong các file component khác
- Quét toàn bộ các file trong thư mục `/components/product` để tìm và thay thế màu xanh lá với màu hồng-tím phù hợp
- Đảm bảo tính nhất quán giữa các component

## Lưu ý khi thực hiện
- Đảm bảo contrast đủ giữa text và background để đảm bảo khả năng đọc
- Kiểm tra hiển thị UI trên các kích thước màn hình khác nhau sau khi thay đổi
- Một số trường hợp có thể cần thêm text-white khi background là gradient màu đậm
- Đối với một số thành phần interactive, cân nhắc sử dụng animation và transition mượt mà khi hover/focus 