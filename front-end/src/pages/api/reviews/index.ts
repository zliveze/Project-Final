import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Lấy token từ request header
  const token = req.headers.authorization;

  try {
    // URL này sẽ được tự động chuyển đến backend NestJS qua cấu hình rewrites trong next.config.ts
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/reviews`;

    // Chuyển tiếp Authorization header nếu có
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = token;
    }

    if (req.method === 'GET') {
      // Lấy các tham số truy vấn từ request
      const { page, limit, status, rating, productId, userId, search, sortBy, sortOrder } = req.query;

      // Tạo URL với tham số truy vấn
      const queryParams = new URLSearchParams();
      if (page) queryParams.append('page', page.toString());
      if (limit) queryParams.append('limit', limit.toString());
      if (status) queryParams.append('status', status.toString());
      if (rating) queryParams.append('rating', rating.toString());
      if (productId) queryParams.append('productId', productId.toString());
      if (userId) queryParams.append('userId', userId.toString());
      if (search) queryParams.append('search', search.toString());
      if (sortBy) queryParams.append('sortBy', sortBy.toString());
      if (sortOrder) queryParams.append('sortOrder', sortOrder.toString());

      // Gọi API backend
      const response = await fetch(`${apiUrl}?${queryParams.toString()}`, {
        method: 'GET',
        headers
      });

      // Kiểm tra response status
      if (!response.ok) {
        const errorData = await response.json();
        return res.status(response.status).json(errorData);
      }

      // Trả về dữ liệu từ backend
      const data = await response.json();
      return res.status(200).json(data);
    } else if (req.method === 'POST') {
      // Yêu cầu token cho việc tạo đánh giá
      if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      // Xử lý FormData
      // Lưu ý: Next.js API routes không hỗ trợ FormData trực tiếp
      // Chúng ta cần chuyển tiếp request trực tiếp đến backend

      try {
        // Tạo URL đầy đủ đến backend
        const backendUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/reviews`;

        // Chuyển tiếp request đến backend
        const formData = req.body;

        // Gọi API backend với multipart/form-data
        const response = await fetch(backendUrl, {
          method: 'POST',
          headers: {
            'Authorization': token
          },
          body: formData
        });

        // Kiểm tra response status
        if (!response.ok) {
          try {
            const errorData = await response.json();
            return res.status(response.status).json(errorData);
          } catch {
            // Nếu không thể parse JSON, trả về text
            console.error('Error parsing error response JSON');
            const errorText = await response.text();
            return res.status(response.status).send(errorText);
          }
        }

        // Trả về dữ liệu từ backend
        try {
          const data = await response.json();
          return res.status(201).json(data);
        } catch {
          // Nếu không thể parse JSON, trả về text
          console.error('Error parsing success response JSON');
          const text = await response.text();
          return res.status(201).send(text);
        }
      } catch (error) {
        console.error('Error posting review:', error);
        return res.status(500).json({ message: 'Internal Server Error when posting review' });
      }
    } else {
      // Phương thức không được hỗ trợ
      return res.status(405).json({ message: 'Method Not Allowed' });
    }
  } catch (error) {
    console.error('Error handling reviews:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
