import { NextApiRequest, NextApiResponse } from 'next';

// Với cấu hình rewrites trong next.config.ts, request POST đến /api/admin/users/create 
// sẽ được chuyển tiếp trực tiếp đến backend endpoint http://localhost:3001/admin/users/create
// Tuy nhiên, chúng ta vẫn giữ file này để xử lý các trường hợp đặc biệt hoặc log nếu cần

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Chỉ cho phép phương thức POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Phương thức không được hỗ trợ' });
  }

  try {
    const token = req.headers.authorization;
    
    if (!token) {
      console.error('Không tìm thấy token xác thực');
      return res.status(401).json({ message: 'Không tìm thấy token xác thực' });
    }

    // Lấy dữ liệu từ body request
    const userData = req.body;
    console.log('Đang xử lý yêu cầu tạo người dùng mới:', userData);
    
    // Gửi request đến API backend
    const url = `${process.env.NEXT_PUBLIC_API_URL}/admin/users/create`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token
      },
      body: JSON.stringify(userData)
    });
    
    // Kiểm tra nếu response không ok
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Lỗi từ API backend:', errorData);
      return res.status(response.status).json(errorData);
    }
    
    // Parse dữ liệu từ response
    const data = await response.json();
    console.log('Tạo người dùng thành công:', data);
    
    // Trả về response từ backend
    return res.status(response.status).json(data);
  } catch (error: unknown) {
    console.error('Lỗi tạo người dùng mới:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ message: 'Lỗi máy chủ nội bộ', error: errorMessage });
  }
} 