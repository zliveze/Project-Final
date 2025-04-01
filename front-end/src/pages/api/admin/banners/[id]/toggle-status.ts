import { NextApiRequest, NextApiResponse } from 'next';

/**
 * API endpoint để bật/tắt trạng thái banner
 * PATCH: Bật/tắt trạng thái banner
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Lấy token xác thực từ header
  const token = req.headers.authorization;
  
  if (!token) {
    return res.status(401).json({ message: 'Không tìm thấy token xác thực' });
  }

  // Lấy ID banner từ query params
  const { id } = req.query;
  
  if (!id || Array.isArray(id)) {
    return res.status(400).json({ message: 'ID banner không hợp lệ' });
  }

  // Chỉ cho phép phương thức PATCH
  if (req.method !== 'PATCH') {
    return res.status(405).json({ message: 'Phương thức không được hỗ trợ' });
  }

  try {
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/admin/banners/${id}/toggle-status`;
    
    console.log(`Gửi request PATCH đến ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token
      }
    });
    
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error: any) {
    console.error('Lỗi khi thay đổi trạng thái banner:', error);
    return res.status(500).json({ 
      message: 'Lỗi máy chủ khi thay đổi trạng thái banner', 
      error: error.message 
    });
  }
} 