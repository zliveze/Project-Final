import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  // Xử lý đặc biệt cho endpoint stats
  if (id === 'stats') {
    if (req.method !== 'GET') {
      return res.status(405).json({ message: 'Phương thức không được hỗ trợ' });
    }

    try {
      const token = req.headers.authorization;
      
      if (!token) {
        return res.status(401).json({ message: 'Không tìm thấy token xác thực' });
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        }
      });

      const data = await response.json();
      return res.status(response.status).json(data);
    } catch (error: any) {
      console.error('Lỗi lấy dữ liệu thống kê:', error);
      return res.status(500).json({ message: 'Lỗi máy chủ nội bộ', error: error.message });
    }
  }

  // Xử lý cho các id thông thường
  if (req.method === 'GET') {
    try {
      const token = req.headers.authorization;
      
      if (!token) {
        return res.status(401).json({ message: 'Không tìm thấy token xác thực' });
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/${id}`, {
        headers: {
          'Authorization': token
        }
      });

      const data = await response.json();
      return res.status(response.status).json(data);
    } catch (error: any) {
      console.error('Lỗi lấy dữ liệu người dùng:', error);
      return res.status(500).json({ message: 'Lỗi máy chủ nội bộ', error: error.message });
    }
  } else if (req.method === 'PUT') {
    try {
      const token = req.headers.authorization;
      
      if (!token) {
        return res.status(401).json({ message: 'Không tìm thấy token xác thực' });
      }

      console.log('Đang gửi PUT request đến:', `${process.env.NEXT_PUBLIC_API_URL}/admin/users/${id}`);
      console.log('Body:', req.body);
      console.log('Token:', token);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify(req.body)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Lỗi từ backend:', errorData);
        return res.status(response.status).json(errorData);
      }

      const data = await response.json();
      return res.status(200).json(data);
    } catch (error: any) {
      console.error('Lỗi cập nhật thông tin người dùng:', error);
      return res.status(500).json({ message: 'Lỗi máy chủ nội bộ', error: error.message });
    }
  } else if (req.method === 'PATCH') {
    try {
      const token = req.headers.authorization;
      
      if (!token) {
        return res.status(401).json({ message: 'Không tìm thấy token xác thực' });
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/${id}`, {
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
      console.error('Lỗi cập nhật thông tin người dùng:', error);
      return res.status(500).json({ message: 'Lỗi máy chủ nội bộ', error: error.message });
    }
  } else {
    return res.status(405).json({ message: 'Phương thức không được hỗ trợ' });
  }
} 