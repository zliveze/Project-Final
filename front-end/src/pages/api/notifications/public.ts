import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  
  try {
    console.log('Gọi API lấy thông báo public từ:', `${backendUrl}/notifications`);
    
    const response = await fetch(`${backendUrl}/notifications`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Lỗi khi lấy thông báo public:', response.status, response.statusText);
      throw new Error('Failed to fetch notifications');
    }

    const data = await response.json();
    console.log('Dữ liệu thông báo public nhận được:', data);
    
    return res.status(200).json(data);
  } catch (error: any) {
    console.error('Error fetching public notifications:', error);
    return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
} 