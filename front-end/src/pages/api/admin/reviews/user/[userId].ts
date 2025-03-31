import { NextApiRequest, NextApiResponse } from 'next';

/**
 * API endpoint để lấy đánh giá của một người dùng cụ thể
 * Endpoint này sẽ được chuyển tiếp đến backend Nest.js thông qua cấu hình API proxy
 * 
 * @param {NextApiRequest} req - Request object từ Next.js
 * @param {NextApiResponse} res - Response object từ Next.js
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ message: 'Missing user ID' });
  }

  try {
    // Lấy các tham số truy vấn từ request
    const { page = 1, limit = 10, status, rating } = req.query;
    
    // Tạo URL với tham số truy vấn
    const queryParams = new URLSearchParams();
    if (page) queryParams.append('page', page.toString());
    if (limit) queryParams.append('limit', limit.toString());
    if (status) queryParams.append('status', status.toString());
    if (rating) queryParams.append('rating', rating.toString());
    
    // URL này sẽ được tự động chuyển đến backend NestJS qua cấu hình rewrites trong next.config.ts
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/admin/reviews/user/${userId}?${queryParams.toString()}`;
    
    // Chuyển tiếp Authorization header nếu có
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    // Lấy token từ request header
    if (req.headers.authorization) {
      headers['Authorization'] = req.headers.authorization;
    }
    
    // Gọi API backend
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers,
    });
    
    // Nhận kết quả từ backend
    const data = await response.json();
    
    // Nếu backend trả về lỗi
    if (!response.ok) {
      return res.status(response.status).json(data);
    }
    
    // Trả về dữ liệu thành công từ backend
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
} 