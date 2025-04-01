import { NextApiRequest, NextApiResponse } from 'next';

/**
 * API endpoint để thao tác với một thông báo cụ thể
 * GET: Lấy chi tiết thông báo theo ID
 * PUT/PATCH: Cập nhật thông báo
 * DELETE: Xóa thông báo
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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

  // Xây dựng URL API backend
  const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/admin/notifications/${id}`;

  try {
    let response;
    
    // Xử lý GET request - lấy chi tiết thông báo
    if (req.method === 'GET') {
      response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        }
      });
    }
    
    // Xử lý PUT/PATCH request - cập nhật thông báo
    else if (req.method === 'PUT' || req.method === 'PATCH') {
      response = await fetch(apiUrl, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify(req.body)
      });
    }
    
    // Xử lý DELETE request - xóa thông báo
    else if (req.method === 'DELETE') {
      response = await fetch(apiUrl, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        }
      });
    }
    
    // Phương thức không được hỗ trợ
    else {
      return res.status(405).json({ message: 'Phương thức không được hỗ trợ' });
    }
    
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error: any) {
    console.error(`Lỗi khi thao tác với thông báo ${id}:`, error);
    return res.status(500).json({ 
      message: 'Lỗi máy chủ khi thao tác với thông báo', 
      error: error.message 
    });
  }
} 