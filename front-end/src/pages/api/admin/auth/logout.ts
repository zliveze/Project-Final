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
    // Lấy token từ header Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: 'Token không được cung cấp' });
    }

    // Gửi request đến API backend
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/auth/logout`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    // Trả về response từ backend
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Lỗi đăng xuất admin:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
  }
} 