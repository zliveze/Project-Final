import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Chỉ cho phép phương thức POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Phương thức không được hỗ trợ' });
  }

  try {
    const { refreshToken } = req.body;
    
    // Kiểm tra xem refreshToken có được cung cấp không
    if (!refreshToken) {
      return res.status(400).json({ message: 'refreshToken là bắt buộc' });
    }

    // Gửi request đến API backend
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    const data = await response.json();

    // Trả về response từ backend
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Lỗi làm mới token admin:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
  }
} 