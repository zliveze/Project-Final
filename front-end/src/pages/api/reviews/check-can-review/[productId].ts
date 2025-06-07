import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Chỉ cho phép phương thức GET
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // Lấy token từ request header
  const token = req.headers.authorization;

  if (!token) {
    console.log('Không tìm thấy token trong request header');
    return res.status(401).json({
      message: 'Unauthorized',
      canReview: false,
      hasPurchased: false,
      hasReviewed: false
    });
  }

  // Lấy productId từ path parameter
  const { productId } = req.query;

  if (!productId) {
    return res.status(400).json({ message: 'Missing productId parameter' });
  }

  try {
    // URL này sẽ được tự động chuyển đến backend NestJS qua cấu hình rewrites trong next.config.ts
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'https://backendyumin.vercel.app'}/reviews/check-can-review/${productId}`;

    // Chuyển tiếp Authorization header
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Authorization': token
    };

    // Gọi API backend
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers
    });

    // Kiểm tra response status
    if (!response.ok) {
      console.log(`API trả về lỗi: ${response.status} ${response.statusText}`);
      try {
        const errorData = await response.json();
        console.log('Chi tiết lỗi:', errorData);

        // Nếu API không hoạt động, trả về giá trị mặc định cho phép đánh giá
        return res.status(200).json({
          canReview: true,
          hasPurchased: true,
          hasReviewed: false,
          message: 'Giá trị mặc định do API lỗi'
        });
      } catch (e) {
        console.error('Không thể parse lỗi JSON:', e);

        // Nếu API không hoạt động, trả về giá trị mặc định cho phép đánh giá
        return res.status(200).json({
          canReview: true,
          hasPurchased: true,
          hasReviewed: false,
          message: 'Giá trị mặc định do API lỗi'
        });
      }
    }

    // Trả về dữ liệu từ backend
    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error checking can review:', error);

    // Nếu có lỗi, trả về giá trị mặc định cho phép đánh giá
    return res.status(200).json({
      canReview: true,
      hasPurchased: true,
      hasReviewed: false,
      message: 'Giá trị mặc định do lỗi kết nối'
    });
  }
}
