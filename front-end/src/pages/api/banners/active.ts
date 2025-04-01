import { NextApiRequest, NextApiResponse } from 'next';

/**
 * API endpoint công khai để lấy danh sách banner đang hoạt động (active)
 * Sử dụng cho trang chủ và các trang public, không yêu cầu xác thực
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Chỉ chấp nhận phương thức GET
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Phương thức không được hỗ trợ' });
  }

  try {
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/banners/active`;
    
    console.log('API - Đang lấy danh sách banner active từ:', apiUrl);
    
    const response = await fetch(apiUrl);
    
    // Xử lý response
    if (!response.ok) {
      // Đọc lỗi dưới dạng text trước
      const errorText = await response.text();
      console.error('API - Lỗi khi lấy danh sách banner:', errorText);
      
      try {
        // Thử phân tích lỗi sang JSON
        const errorData = JSON.parse(errorText);
        return res.status(response.status).json(errorData);
      } catch (parseError) {
        // Nếu không thể phân tích, trả về lỗi nguyên văn
        return res.status(response.status).json({ 
          message: 'Lỗi khi lấy danh sách banner', 
          rawError: errorText.substring(0, 500) 
        });
      }
    }
    
    const data = await response.json();
    console.log(`API - Đã lấy ${data.length || 0} banner thành công`);
    
    return res.status(200).json(data);
  } catch (error: any) {
    console.error('API - Lỗi server khi lấy danh sách banner:', error);
    return res.status(500).json({
      message: 'Lỗi máy chủ khi lấy danh sách banner',
      error: error.message
    });
  }
} 