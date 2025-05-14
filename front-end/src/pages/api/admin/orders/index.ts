import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Chỉ cho phép phương thức GET
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    // Lấy token xác thực từ header
    const token = req.headers.authorization;

    if (!token) {
      return res.status(401).json({ message: 'Không tìm thấy token xác thực' });
    }

    // Xây dựng query string từ req.query
    const queryParams = new URLSearchParams();
    
    // Thêm tất cả các tham số từ req.query vào queryParams
    Object.entries(req.query).forEach(([key, value]) => {
      if (value !== undefined) {
        if (Array.isArray(value)) {
          value.forEach(v => queryParams.append(key, v));
        } else {
          queryParams.append(key, value as string);
        }
      }
    });

    // Gọi API backend
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/admin/orders?${queryParams.toString()}`;
    console.log(`Calling backend API: ${apiUrl}`);

    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': token
      }
    });

    // Kiểm tra nếu response không thành công
    if (!response.ok) {
      const errorData = await response.json();
      return res.status(response.status).json(errorData);
    }

    // Trả về dữ liệu từ backend
    const data = await response.json();
    return res.status(200).json(data);
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    return res.status(500).json({ 
      message: 'Lỗi máy chủ nội bộ', 
      error: error.message 
    });
  }
}
