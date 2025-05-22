import { NextApiRequest, NextApiResponse } from 'next';

/**
 * API endpoint to fetch branches
 * This endpoint will proxy requests to the backend NestJS API
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    // Get query parameters, tăng limit mặc định
    const { page = 1, limit = 1000, search } = req.query; 
    
    // Create query string
    const queryParams = new URLSearchParams();
    if (page) queryParams.append('page', page.toString());
    if (limit) queryParams.append('limit', limit.toString());
    if (search) queryParams.append('search', search.toString());
    
    // URL to the backend NestJS API - Sửa thành endpoint admin
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/admin/branches?${queryParams.toString()}`;
    
    // Lấy token admin từ cookie của request đến API route này (nếu có)
    // Hoặc cần một cơ chế khác để xác thực nếu API route này được gọi từ client mà không có context admin
    // Hiện tại, giả sử API /admin/branches ở backend không yêu cầu xác thực nghiêm ngặt khi gọi từ server-side proxy này
    // HOẶC, hook useBranches cần truyền token nếu gọi trực tiếp API này từ client.
    // Vì hook useBranches gọi /api/branches (là API route này), nên request này từ server Next.js đến backend NestJS.
    // Cần đảm bảo request này có thể được xác thực bởi backend NestJS nếu cần.
    // Tuy nhiên, để đơn giản, trước mắt chỉ sửa URL và limit.

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Lấy adminToken từ cookie của request đến API route này
    const adminToken = req.cookies.adminToken;

    if (adminToken) {
      headers['Authorization'] = `Bearer ${adminToken}`;
    } else {
      // Nếu không có token, không thể xác thực với backend, trả về lỗi
      console.warn('Không tìm thấy adminToken trong cookie khi gọi /api/branches');
      // Có thể trả về lỗi 401 ở đây, nhưng để hook useBranches xử lý lỗi từ fetch,
      // chúng ta vẫn có thể thử gọi API và để backend từ chối.
      // Hoặc, trả về lỗi ngay:
      // return res.status(401).json({ message: 'Unauthorized: Missing admin token for backend request' });
    }

    // Forward request to backend
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: headers, // Sử dụng headers đã có token (nếu có)
    });

    if (!response.ok) {
      console.error(`Error fetching branches: ${response.status} ${response.statusText}`);
      return res.status(response.status).json({ 
        message: `Error fetching branches: ${response.statusText}` 
      });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error in branches API route:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
