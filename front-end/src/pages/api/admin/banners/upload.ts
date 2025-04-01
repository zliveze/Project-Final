import { NextApiRequest, NextApiResponse } from 'next';

/**
 * API endpoint xử lý upload ảnh banner lên Cloudinary
 * POST: Upload ảnh và trả về URL và thông tin khác
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Lấy token xác thực từ header
  const token = req.headers.authorization;
  
  if (!token) {
    console.error('Upload API: Không tìm thấy token xác thực');
    return res.status(401).json({ message: 'Không tìm thấy token xác thực' });
  }

  // Chỉ xử lý POST request
  if (req.method !== 'POST') {
    console.error('Upload API: Phương thức không được hỗ trợ:', req.method);
    return res.status(405).json({ message: 'Phương thức không được hỗ trợ' });
  }
  
  try {
    const { imageData, type, campaignId } = req.body;
    
    if (!imageData || !type) {
      console.error('Upload API: Thiếu thông tin bắt buộc');
      return res.status(400).json({ 
        message: 'Thiếu thông tin bắt buộc: imageData và type là bắt buộc'
      });
    }
    
    if (type !== 'desktop' && type !== 'mobile') {
      console.error('Upload API: Loại ảnh không hợp lệ:', type);
      return res.status(400).json({
        message: 'Loại ảnh không hợp lệ. Phải là "desktop" hoặc "mobile"'
      });
    }
    
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/admin/banners/upload/image`;
    
    console.log(`Upload API: Đang gửi ảnh ${type} sang backend API (${apiUrl})`);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token
      },
      body: JSON.stringify({
        imageData,
        type,
        campaignId
      }),
    });
    
    // Nhận response dưới dạng text trước để kiểm tra lỗi
    const responseText = await response.text();
    let responseData;
    
    try {
      // Chuyển đổi text thành JSON
      responseData = JSON.parse(responseText);
    } catch (parseError: any) {
      console.error('Upload API: Lỗi phân tích JSON response:', parseError);
      console.error('Upload API: Response text:', responseText.substring(0, 200) + '...');
      return res.status(500).json({
        message: 'Lỗi phân tích dữ liệu phản hồi từ server',
        error: parseError.message,
        rawResponse: responseText.substring(0, 500) // Giới hạn độ dài
      });
    }
    
    if (!response.ok) {
      console.error('Upload API: Lỗi từ backend:', responseData);
      return res.status(response.status).json(responseData);
    }
    
    console.log('Upload API: Upload thành công, URL:', responseData.url ? responseData.url.substring(0, 50) + '...' : 'không có');
    return res.status(200).json(responseData);
  } catch (error: any) {
    console.error('Upload API: Lỗi khi upload ảnh:', error);
    return res.status(500).json({ 
      message: 'Lỗi máy chủ khi upload ảnh', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

// Tăng giới hạn kích thước body lên 10MB
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
}; 