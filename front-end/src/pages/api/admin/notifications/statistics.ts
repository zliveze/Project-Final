import { NextApiRequest, NextApiResponse } from 'next';

/**
 * API endpoint để lấy thống kê về thông báo
 * GET: Lấy thống kê thông báo (tổng số, đang active, inactive, sắp hết hạn)
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Chỉ cho phép phương thức GET
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Phương thức không được hỗ trợ' });
  }

  // Lấy token xác thực từ header
  const token = req.headers.authorization;
  
  if (!token) {
    return res.status(401).json({ message: 'Không tìm thấy token xác thực' });
  }

  try {
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/admin/notifications/statistics`;
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token
      }
    });
    
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error: any) {
    console.error('Lỗi khi lấy thống kê thông báo:', error);
    return res.status(500).json({ 
      message: 'Lỗi máy chủ khi lấy thống kê thông báo', 
      error: error.message 
    });
  }
} 