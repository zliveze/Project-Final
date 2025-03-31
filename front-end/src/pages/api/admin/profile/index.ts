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
  console.log('API được gọi với phương thức:', req.method);
  console.log('API Request body:', req.body);
  console.log('API Request path:', req.url);
  
  // Kiểm tra phương thức
  if (req.method === 'GET') {
    return handleGetProfile(req, res);
  } else if (req.method === 'PUT') {
    console.log('Xử lý PUT request');
    return handleUpdateProfile(req, res);
  }
  
  res.setHeader('Allow', ['GET', 'PUT']);
  return res.status(405).json({ success: false, message: `Method ${req.method} Not Allowed` });
}

// Lấy thông tin profile admin
async function handleGetProfile(req: NextApiRequest, res: NextApiResponse) {
  try {
    const token = getToken(req);
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/admin/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    console.log('API response from backend profile:', response.data);
    
    return res.status(200).json(response.data);
  } catch (error: any) {
    console.error('Lỗi khi lấy thông tin admin:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    return res.status(500).json({ 
      success: false, 
      message: 'Đã xảy ra lỗi khi lấy thông tin admin'
    });
  }
}

// Cập nhật thông tin profile admin
async function handleUpdateProfile(req: NextApiRequest, res: NextApiResponse) {
  try {
    const token = getToken(req);
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    const { name, email, phone } = req.body;
    
    if (!name || !email || !phone) {
      return res.status(400).json({ 
        success: false, 
        message: 'Vui lòng cung cấp đầy đủ thông tin' 
      });
    }
    
    // Lấy thông tin user ID từ API profile trước
    const profileRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/admin/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    const userId = profileRes.data._id;
    
    if (!userId) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin người dùng'
      });
    }
    
    // Gọi API cập nhật profile
    const response = await axios.put(
      `${process.env.NEXT_PUBLIC_API_URL}/admin/profile`,
      { name, email, phone },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    
    console.log('API response after update profile:', response.data);
    
    return res.status(200).json({ 
      success: true, 
      message: 'Cập nhật thông tin thành công',
      user: response.data
    });
  } catch (error: any) {
    console.error('Lỗi khi cập nhật thông tin admin:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    if (error.response?.status === 400) {
      return res.status(400).json({
        success: false,
        message: error.response.data.message || 'Dữ liệu không hợp lệ'
      });
    }
    
    return res.status(500).json({ 
      success: false, 
      message: 'Đã xảy ra lỗi khi cập nhật thông tin admin'
    });
  }
} 