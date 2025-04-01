import { NextApiRequest, NextApiResponse } from 'next';

/**
 * API endpoint cho thông báo - xử lý cả GET và POST request
 * GET: Lấy danh sách thông báo (có phân trang)
 * POST: Tạo thông báo mới
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Lấy token xác thực từ header
  const token = req.headers.authorization;
  
  if (!token) {
    return res.status(401).json({ message: 'Không tìm thấy token xác thực' });
  }

  // Xử lý GET request - lấy danh sách thông báo
  if (req.method === 'GET') {
    try {
      // Lấy các tham số truy vấn từ request
      const { 
        page = 1, 
        limit = 10, 
        search, 
        type, 
        isActive,
        sortBy = 'priority', 
        sortOrder = 'desc',
        startDate,
        endDate 
      } = req.query;
      
      // Tạo URL với tham số truy vấn
      const queryParams = new URLSearchParams();
      if (page) queryParams.append('page', page.toString());
      if (limit) queryParams.append('limit', limit.toString());
      if (search) queryParams.append('search', search.toString());
      if (type) queryParams.append('type', type.toString());
      if (isActive !== undefined) queryParams.append('isActive', isActive.toString());
      if (sortBy) queryParams.append('sortBy', sortBy.toString());
      if (sortOrder) queryParams.append('sortOrder', sortOrder.toString());
      if (startDate) queryParams.append('startDate', startDate.toString());
      if (endDate) queryParams.append('endDate', endDate.toString());
      
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/admin/notifications?${queryParams.toString()}`;
      
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
      console.error('Lỗi khi lấy danh sách thông báo:', error);
      return res.status(500).json({ 
        message: 'Lỗi máy chủ khi lấy danh sách thông báo', 
        error: error.message 
      });
    }
  }
  
  // Xử lý POST request - tạo thông báo mới
  if (req.method === 'POST') {
    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/admin/notifications`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify(req.body),
      });
      
      const data = await response.json();
      return res.status(response.status).json(data);
    } catch (error: any) {
      console.error('Lỗi khi tạo thông báo mới:', error);
      return res.status(500).json({ 
        message: 'Lỗi máy chủ khi tạo thông báo mới', 
        error: error.message 
      });
    }
  }
  
  // Trả về lỗi nếu phương thức không được hỗ trợ
  return res.status(405).json({ message: 'Phương thức không được hỗ trợ' });
} 