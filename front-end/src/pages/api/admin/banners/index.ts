import { NextApiRequest, NextApiResponse } from 'next';

/**
 * API endpoint cho banner - xử lý cả GET và POST request
 * GET: Lấy danh sách banner (có phân trang)
 * POST: Tạo banner mới
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Lấy token xác thực từ header
  const token = req.headers.authorization;
  
  if (!token) {
    return res.status(401).json({ message: 'Không tìm thấy token xác thực' });
  }

  // Xử lý GET request - lấy danh sách banner
  if (req.method === 'GET') {
    try {
      // Lấy các tham số truy vấn từ request
      const { 
        page = 1, 
        limit = 10, 
        search, 
        campaignId, 
        active,
        sortBy = 'order', 
        sortOrder = 'asc',
        startDate,
        endDate 
      } = req.query;
      
      // Tạo URL với tham số truy vấn
      const queryParams = new URLSearchParams();
      if (page) queryParams.append('page', page.toString());
      if (limit) queryParams.append('limit', limit.toString());
      if (search) queryParams.append('search', search.toString());
      if (campaignId) queryParams.append('campaignId', campaignId.toString());
      if (active !== undefined) queryParams.append('active', active.toString());
      if (sortBy) queryParams.append('sortBy', sortBy.toString());
      if (sortOrder) queryParams.append('sortOrder', sortOrder.toString());
      if (startDate) queryParams.append('startDate', startDate.toString());
      if (endDate) queryParams.append('endDate', endDate.toString());
      
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/admin/banners?${queryParams.toString()}`;
      
      console.log('Gửi request đến backend:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
      });
      
      const data = await response.json();
      return res.status(response.status).json(data);
    } catch (error: any) {
      console.error('Lỗi khi lấy danh sách banner:', error);
      return res.status(500).json({ 
        message: 'Lỗi máy chủ khi lấy danh sách banner', 
        error: error.message 
      });
    }
  }
  
  // Xử lý POST request - tạo banner mới
  if (req.method === 'POST') {
    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/admin/banners`;
      
      console.log('Gửi request tạo banner đến backend:', apiUrl);
      console.log('Dữ liệu gửi đi:', JSON.stringify(req.body).substring(0, 200) + '...');
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify(req.body),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Lỗi từ backend:', errorData);
        return res.status(response.status).json(errorData);
      }
      
      const data = await response.json();
      return res.status(response.status).json(data);
    } catch (error: any) {
      console.error('Lỗi khi tạo banner mới:', error);
      return res.status(500).json({ 
        message: 'Lỗi máy chủ khi tạo banner mới', 
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