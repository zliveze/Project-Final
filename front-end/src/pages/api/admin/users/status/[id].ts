import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Chỉ cho phép phương thức PATCH
  if (req.method !== 'PATCH') {
    return res.status(405).json({ message: 'Phương thức không được hỗ trợ' });
  }

  // Lấy token xác thực từ header
  const token = req.headers.authorization;
    
  if (!token) {
    return res.status(401).json({ message: 'Không tìm thấy token xác thực' });
  }

  // Lấy ID từ URL
  const { id } = req.query;
  
  try {
    // URL của API backend
    const url = `${process.env.NEXT_PUBLIC_API_URL}/admin/users/status/${id}`;
    console.log('Proxying status update request to:', url);
    
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token
      },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Lỗi khi cập nhật trạng thái người dùng:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
  }
} 