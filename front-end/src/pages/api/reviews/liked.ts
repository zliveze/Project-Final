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
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    // URL này sẽ được tự động chuyển đến backend NestJS
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'https://backendyumin.vercel.app'}/reviews/liked`;
    
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
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      return res.status(response.status).json(errorData);
    }
    
    // Trả về kết quả từ backend
    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching liked reviews:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
