import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Lấy token từ request header
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Lấy reviewId từ path parameter
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ message: 'Missing review ID' });
  }

  try {
    // URL này sẽ được tự động chuyển đến backend NestJS qua cấu hình rewrites trong next.config.ts
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/admin/reviews/${id}`;
    
    // Chuyển tiếp Authorization header
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Authorization': token
    };
    
    if (req.method === 'GET') {
      // Gọi API backend để lấy chi tiết đánh giá
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers
      });
      
      // Kiểm tra response status
      if (!response.ok) {
        const errorData = await response.json();
        return res.status(response.status).json(errorData);
      }
      
      // Trả về dữ liệu từ backend
      const data = await response.json();
      return res.status(200).json(data);
    } else if (req.method === 'DELETE') {
      // Gọi API backend để xóa đánh giá
      const response = await fetch(apiUrl, {
        method: 'DELETE',
        headers
      });
      
      // Kiểm tra response status
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        return res.status(response.status).json(errorData);
      }
      
      // Trả về thành công không có nội dung
      return res.status(204).end();
    } else {
      // Phương thức không được hỗ trợ
      return res.status(405).json({ message: 'Method Not Allowed' });
    }
  } catch (error) {
    console.error('Error handling review:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
