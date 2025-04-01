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
      
      // Log chi tiết quá trình tạo banner
      const requestData = req.body;
      console.log('API - Tạo banner mới:', {
        title: requestData.title,
        campaignId: requestData.campaignId,
        hasDesktopImage: !!requestData.desktopImage,
        hasDesktopImageData: !!(requestData.desktopImageData && requestData.desktopImageData.length > 100),
        hasMobileImage: !!requestData.mobileImage,
        hasMobileImageData: !!(requestData.mobileImageData && requestData.mobileImageData.length > 100),
        url: apiUrl
      });
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify(requestData),
      });
      
      // Nhận response dưới dạng text trước để kiểm tra lỗi
      const responseText = await response.text();
      let responseData;
      
      try {
        // Chuyển đổi text thành JSON
        responseData = JSON.parse(responseText);
      } catch (parseError: any) {
        console.error('API - Lỗi phân tích JSON response:', parseError);
        console.error('API - Response text:', responseText.substring(0, 200) + '...');
        return res.status(500).json({
          message: 'Lỗi phân tích dữ liệu phản hồi từ server',
          error: parseError.message,
          rawResponse: responseText.substring(0, 500) // Giới hạn độ dài
        });
      }
      
      if (!response.ok) {
        console.error('API - Lỗi từ backend khi tạo banner:', responseData);
        return res.status(response.status).json(responseData);
      }
      
      console.log('API - Tạo banner thành công:', responseData._id);
      return res.status(response.status).json(responseData);
    } catch (error: any) {
      console.error('API - Lỗi khi tạo banner mới:', error);
      return res.status(500).json({ 
        message: 'Lỗi máy chủ khi tạo banner mới', 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
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