import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Chỉ cho phép phương thức GET
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // Lấy productId từ path parameter
  const { productId } = req.query;

  if (!productId) {
    return res.status(400).json({ message: 'Missing product ID' });
  }

  try {
    // URL này sẽ được tự động chuyển đến backend NestJS qua cấu hình rewrites trong next.config.ts
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'https://backendyumin.vercel.app'}/reviews/stats/rating/${productId}`;
    
    // Chuyển tiếp Authorization header nếu có
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
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
    console.error('Error fetching review stats:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
