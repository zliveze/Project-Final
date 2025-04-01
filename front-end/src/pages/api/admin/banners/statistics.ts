import { NextApiRequest, NextApiResponse } from 'next';

/**
 * API endpoint để lấy thống kê về banner
 * GET: Lấy thống kê về banner
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Lấy token xác thực từ header
  const token = req.headers.authorization;
  
  if (!token) {
    return res.status(401).json({ message: 'Không tìm thấy token xác thực' });
  }

  // Chỉ cho phép phương thức GET
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Phương thức không được hỗ trợ' });
  }

  try {
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/admin/banners/statistics`;
    
    console.log(`Gửi request GET đến ${apiUrl}`);
    
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
    console.error('Lỗi khi lấy thống kê banner:', error);
    return res.status(500).json({ 
      message: 'Lỗi máy chủ khi lấy thống kê banner', 
      error: error.message 
    });
  }
} 