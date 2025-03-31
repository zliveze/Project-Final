import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

// Lấy token admin từ request
const getToken = (req: NextApiRequest): string | null => {
  // Ưu tiên lấy từ header Authorization
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Nếu không có header, lấy từ cookie
  if (req.cookies.adminToken) {
    return req.cookies.adminToken;
  }
  
  return null;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Chỉ cho phép phương thức PUT
  if (req.method !== 'PUT') {
    res.setHeader('Allow', ['PUT']);
    return res.status(405).json({ success: false, message: `Method ${req.method} Not Allowed` });
  }

  try {
    const token = getToken(req);
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Vui lòng cung cấp mật khẩu hiện tại và mật khẩu mới' 
      });
    }
    
    // Kiểm tra độ dài mật khẩu mới
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu mới phải có ít nhất 6 ký tự'
      });
    }
    
    // Gọi API backend để cập nhật mật khẩu
    const response = await axios.put(
      `${process.env.NEXT_PUBLIC_API_URL}/admin/profile/change-password`,
      { currentPassword, newPassword },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    
    // Trả về kết quả từ backend
    return res.status(200).json(response.data);
  } catch (error: any) {
    console.error('Lỗi khi đổi mật khẩu admin:', error.response?.data || error.message);
    
    // Trả về lỗi chính xác từ backend
    if (error.response) {
      return res.status(error.response.status).json({
        success: false,
        message: error.response.data.message || 'Đã xảy ra lỗi khi cập nhật mật khẩu'
      });
    }
    
    return res.status(500).json({ 
      success: false, 
      message: 'Đã xảy ra lỗi khi cập nhật mật khẩu'
    });
  }
} 