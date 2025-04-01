import { NextApiRequest, NextApiResponse } from 'next';

/**
 * API endpoint để bật/tắt trạng thái thông báo
 * PATCH: Chuyển đổi trạng thái thông báo giữa active và inactive
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Chỉ cho phép phương thức PATCH
  if (req.method !== 'PATCH') {
    return res.status(405).json({ message: 'Phương thức không được hỗ trợ' });
  }

  // Lấy token xác thực từ header
  const token = req.headers.authorization;
  
  if (!token) {
    return res.status(401).json({ message: 'Không tìm thấy token xác thực' });
  }

  // Lấy ID từ URL
  const { id } = req.query;
  
  if (!id || Array.isArray(id)) {
    return res.status(400).json({ message: 'ID thông báo không hợp lệ' });
  }

  try {
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/admin/notifications/${id}/toggle-status`;
    
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
    console.error(`Lỗi khi thay đổi trạng thái thông báo ${id}:`, error);
    return res.status(500).json({ 
      message: 'Lỗi máy chủ khi thay đổi trạng thái thông báo', 
      error: error.message 
    });
  }
} 