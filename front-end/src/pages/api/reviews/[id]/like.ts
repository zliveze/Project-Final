import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Chỉ cho phép phương thức POST
  if (req.method !== 'POST') {
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
    // URL này sẽ được tự động chuyển đến backend NestJS
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'https://backendyumin.vercel.app'}/reviews/${id}/like`;
    
    // Chuyển tiếp Authorization header
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Authorization': token
    };
    
    // Gọi API backend
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers
    });
    
    // Kiểm tra response status
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      return res.status(response.status).json(errorData);
    }
    
    // Trả về dữ liệu từ backend
    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error liking review:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
