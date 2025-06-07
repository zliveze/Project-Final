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

  try {
    // Lấy các tham số truy vấn từ request
    const { page, limit, status, rating, userId } = req.query;
    
    // Tạo URL với tham số truy vấn
    const queryParams = new URLSearchParams();
    if (page) queryParams.append('page', page.toString());
    if (limit) queryParams.append('limit', limit.toString());
    if (status) queryParams.append('status', status.toString());
    if (rating) queryParams.append('rating', rating.toString());
    if (userId) queryParams.append('userId', userId.toString());
    
    // URL này sẽ được tự động chuyển đến backend NestJS qua cấu hình rewrites trong next.config.ts
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'https://backendyumin.vercel.app'}/admin/reviews?${queryParams.toString()}`;
    
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
      const errorData = await response.json();
      return res.status(response.status).json(errorData);
    }
    
    // Trả về dữ liệu từ backend
    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
