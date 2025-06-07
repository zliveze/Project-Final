import { NextApiRequest, NextApiResponse } from 'next';

/**
 * API endpoint cho thống kê người dùng - chỉ trả về dữ liệu thống kê và tăng trưởng
 * Endpoint này sẽ được chuyển tiếp đến backend Nest.js thông qua cấu hình API proxy
 * 
 * @param {NextApiRequest} req - Request object từ Next.js
 * @param {NextApiResponse} res - Response object từ Next.js
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    // URL này sẽ được tự động chuyển đến backend NestJS qua cấu hình rewrites trong next.config.ts
    const userStatsUrl = `${process.env.NEXT_PUBLIC_API_URL || 'https://project-final-livid.vercel.app'}/api/admin/users/stats`;
    
    // Chuyển tiếp Authorization header nếu có
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    // Lấy token từ request header
    if (req.headers.authorization) {
      headers['Authorization'] = req.headers.authorization;
    }
    
    // Gọi API backend
    const response = await fetch(userStatsUrl, {
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
    console.error('Error fetching user stats:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
} 