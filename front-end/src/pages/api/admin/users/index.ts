import { NextApiRequest, NextApiResponse } from 'next';

// Thời gian timeout cho API call
const API_TIMEOUT = 30000; // 30 seconds

// Số lần retry tối đa
const MAX_RETRIES = 2;

// Chức năng sleep
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Thực hiện fetch với timeout và retry
async function fetchWithRetry(url: string, options: RequestInit, maxRetries: number = MAX_RETRIES): Promise<Response> {
  let lastError: Error | null = null;
  let retryCount = 0;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);
  
  while (retryCount <= maxRetries) {
    try {
      const fetchOptions = {
        ...options,
        signal: controller.signal
      };
      
      const response = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);
      
      if (response.status >= 500) {
        console.warn(`Server error ${response.status} when fetching ${url}, retry ${retryCount + 1}/${maxRetries + 1}`);
        retryCount++;
        await sleep(Math.min(1000 * retryCount, 3000));
        continue;
      }
      
      return response;
    } catch (error: unknown) {
      clearTimeout(timeoutId);
      lastError = error instanceof Error ? error : new Error('Unknown error');

      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout exceeded');
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.warn(`Error when fetching ${url}, retry ${retryCount + 1}/${maxRetries + 1}: ${errorMessage}`);
      retryCount++;
      await sleep(Math.min(1000 * retryCount, 3000));
    }
  }
  
  throw lastError || new Error('Unexpected error');
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Phương thức không được hỗ trợ' });
  }

  try {
    const token = req.headers.authorization;
    
    if (!token) {
      console.error('Không tìm thấy token xác thực');
      return res.status(401).json({ message: 'Không tìm thấy token xác thực' });
    }

    // Lấy query parameters từ request
    const { page, limit, search, status, role, startDate, endDate } = req.query;
    
    // Tạo URL với query parameters để gửi đến backend
    const params = new URLSearchParams();
    
    if (page) params.append('page', page as string);
    if (limit) params.append('limit', limit as string);
    if (search) params.append('search', search as string);
    if (status) params.append('status', status as string);
    if (role) params.append('role', role as string);
    if (startDate) params.append('startDate', startDate as string);
    if (endDate) params.append('endDate', endDate as string);

    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/admin/users?${params.toString()}`;
    
    console.log('Chuyển tiếp yêu cầu tới backend với URL:', backendUrl);
    
    // Sử dụng fetchWithRetry để gọi backend
    const response = await fetchWithRetry(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token
      }
    });
    
    // Backend đã xử lý việc lọc và phân trang.
    // API route này chỉ cần chuyển tiếp request và response.
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `Lỗi từ backend: ${response.status}` }));
      throw new Error(errorData.message || `Lỗi từ backend: ${response.status}`);
    }

    const data = await response.json();
    
    // Chỉ cần chuyển tiếp dữ liệu đã được xử lý từ backend
    console.log('Chuyển tiếp dữ liệu đã được xử lý từ backend.');
    return res.status(response.status).json(data);

  } catch (error: unknown) {
    console.error('Lỗi trong API route /api/admin/users:', error);
    const isAbortError = error instanceof Error && error.name === 'AbortError';
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return res.status(isAbortError ? 408 : 500).json({
      message: isAbortError ? 'Yêu cầu hết thời gian xử lý' : 'Lỗi máy chủ nội bộ',
      error: errorMessage,
    });
  }
}
