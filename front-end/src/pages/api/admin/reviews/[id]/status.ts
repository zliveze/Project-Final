import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Chỉ cho phép phương thức PATCH
  if (req.method !== 'PATCH') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

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
    // Lấy status từ request body
    const { status } = req.body;
    
    if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }
    
    // URL này sẽ được tự động chuyển đến backend NestJS qua cấu hình rewrites trong next.config.ts
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/admin/reviews/${id}/status`;
    
    // Chuyển tiếp Authorization header
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Authorization': token
    };
    
    // Gọi API backend
    const response = await fetch(apiUrl, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status })
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
    console.error('Error updating review status:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
