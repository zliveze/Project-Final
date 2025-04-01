import { NextApiRequest, NextApiResponse } from 'next';

/**
 * API endpoint cho banner theo ID - xử lý GET, PATCH, DELETE
 * GET: Lấy thông tin chi tiết banner
 * PATCH: Cập nhật thông tin banner
 * DELETE: Xóa banner
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

  const apiBaseUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/admin/banners/${id}`;

  // Xử lý GET request - lấy chi tiết banner
  if (req.method === 'GET') {
    try {
      console.log(`Gửi request GET đến ${apiBaseUrl}`);
      
      const response = await fetch(apiBaseUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        }
      });
      
      const data = await response.json();
      return res.status(response.status).json(data);
    } catch (error: any) {
      console.error('Lỗi khi lấy thông tin banner:', error);
      return res.status(500).json({ 
        message: 'Lỗi máy chủ khi lấy thông tin banner', 
        error: error.message 
      });
    }
  }
  
  // Xử lý PATCH request - cập nhật banner
  if (req.method === 'PATCH') {
    try {
      console.log(`Gửi request PATCH đến ${apiBaseUrl}`);
      console.log('Dữ liệu cập nhật:', JSON.stringify(req.body).substring(0, 200) + '...');
      
      const response = await fetch(apiBaseUrl, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify(req.body)
      });
      
      const data = await response.json();
      return res.status(response.status).json(data);
    } catch (error: any) {
      console.error('Lỗi khi cập nhật banner:', error);
      return res.status(500).json({ 
        message: 'Lỗi máy chủ khi cập nhật banner', 
        error: error.message 
      });
    }
  }
  
  // Xử lý DELETE request - xóa banner
  if (req.method === 'DELETE') {
    try {
      console.log(`Gửi request DELETE đến ${apiBaseUrl}`);
      
      const response = await fetch(apiBaseUrl, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        }
      });
      
      const data = await response.json();
      return res.status(response.status).json(data);
    } catch (error: any) {
      console.error('Lỗi khi xóa banner:', error);
      return res.status(500).json({ 
        message: 'Lỗi máy chủ khi xóa banner', 
        error: error.message 
      });
    }
  }
  
  // Trả về lỗi nếu phương thức không được hỗ trợ
  return res.status(405).json({ message: 'Phương thức không được hỗ trợ' });
}

// Tăng giới hạn kích thước body lên 10MB
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
}; 