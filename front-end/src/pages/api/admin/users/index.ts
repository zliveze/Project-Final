import { NextApiRequest, NextApiResponse } from 'next';

// Thời gian timeout cho API call
const API_TIMEOUT = 15000; // 15 seconds

// Số lần retry tối đa
const MAX_RETRIES = 2;

// Chức năng sleep
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Thực hiện fetch với timeout và retry
async function fetchWithRetry(url: string, options: RequestInit, maxRetries: number = MAX_RETRIES): Promise<Response> {
  let lastError: Error | null = null;
  let retryCount = 0;
  
  // Thêm signal để có thể hủy request khi timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);
  
  while (retryCount <= maxRetries) {
    try {
      const fetchOptions = {
        ...options,
        signal: controller.signal
      };
      
      const response = await fetch(url, fetchOptions);
      
      // Xóa timeout nếu request thành công
      clearTimeout(timeoutId);
      
      // Kiểm tra lỗi HTTP status code
      if (response.status >= 500) {
        console.warn(`Server error ${response.status} when fetching ${url}, retry ${retryCount + 1}/${maxRetries + 1}`);
        retryCount++;
        // Chờ thời gian tăng dần trước khi retry
        await sleep(Math.min(1000 * retryCount, 3000));
        continue;
      }
      
      return response;
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      // Lưu lỗi gần nhất để throw nếu hết retry
      lastError = error;
      
      // Không retry nếu request bị hủy có chủ đích
      if (error.name === 'AbortError') {
        throw new Error('Request timeout exceeded');
      }
      
      console.warn(`Error when fetching ${url}, retry ${retryCount + 1}/${maxRetries + 1}: ${error.message}`);
      retryCount++;
      
      // Chờ thời gian tăng dần trước khi retry
      await sleep(Math.min(1000 * retryCount, 3000));
    }
  }
  
  // Nếu tất cả các retry đều thất bại
  throw lastError || new Error('Unexpected error');
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Chỉ cho phép phương thức GET
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
    
    // Chuẩn hóa tham số tìm kiếm để tránh cache trùng lặp
    const normalizedSearch = typeof search === 'string' ? search.trim() : '';
    
    console.log('API nhận được tham số tìm kiếm:', { 
      search, 
      searchType: typeof search,
      searchLength: typeof search === 'string' ? search.length : 0,
      normalizedSearch,
      normalizedLength: normalizedSearch.length,
      startDate,
      endDate
    });
    
    // Tạo URL với query parameters để gửi đến backend
    // Sử dụng cấu trúc URL trực tiếp để tránh mã hóa lặp lại
    let backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/admin/users?`;
    
    // Thêm các tham số vào URL
    const params = [];
    params.push(`page=${page || 1}`);
    params.push(`limit=${limit || 10}`);
    
    if (normalizedSearch) {
      // Mã hóa một lần duy nhất để tránh lỗi mã hóa hai lần
      params.push(`search=${encodeURIComponent(normalizedSearch)}`);
      console.log(`Tham số tìm kiếm đã được chuẩn hóa và mã hóa một lần: "${encodeURIComponent(normalizedSearch)}"`);
    }
    
    if (status) params.push(`status=${status}`);
    if (role) params.push(`role=${role}`);
    
    // Xử lý đặc biệt cho tham số ngày tháng
    if (startDate) {
      // Đảm bảo ngày bắt đầu được truyền đúng định dạng
      try {
        const startDateObj = new Date(startDate as string);
        if (!isNaN(startDateObj.getTime())) {
          // Chỉ sử dụng nếu là ngày hợp lệ, lấy định dạng ISO để đảm bảo đồng nhất
          params.push(`startDate=${startDateObj.toISOString().split('T')[0]}`);
          console.log(`Đã chuẩn hóa startDate: ${startDateObj.toISOString().split('T')[0]}`);
        } else {
          console.error(`Không thể chuyển đổi startDate: ${startDate}`);
        }
      } catch (error) {
        console.error(`Lỗi xử lý startDate: ${startDate}`, error);
      }
    }
    
    if (endDate) {
      // Đảm bảo ngày kết thúc được truyền đúng định dạng
      try {
        const endDateObj = new Date(endDate as string);
        if (!isNaN(endDateObj.getTime())) {
          // Chỉ sử dụng nếu là ngày hợp lệ, lấy định dạng ISO để đảm bảo đồng nhất
          params.push(`endDate=${endDateObj.toISOString().split('T')[0]}`);
          console.log(`Đã chuẩn hóa endDate: ${endDateObj.toISOString().split('T')[0]}`);
        } else {
          console.error(`Không thể chuyển đổi endDate: ${endDate}`);
        }
      } catch (error) {
        console.error(`Lỗi xử lý endDate: ${endDate}`, error);
      }
    }
    
    // Nối tất cả các tham số để tạo URL cuối cùng
    backendUrl += params.join('&');
    
    console.log('Gọi API users với URL:', backendUrl);
    
    // Sử dụng fetchWithRetry với URL đã được tạo đúng
    const response = await fetchWithRetry(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token
      }
    });
    
    // Parse dữ liệu từ response
    const data = await response.json();
    
    // Kiểm tra cấu trúc dữ liệu
    if (Array.isArray(data)) {
      // Khi API trả về mảng (thường là ở API /all), cần chú ý xử lý phù hợp
      console.log('API trả về dữ liệu dạng mảng, đang xử lý...');
      console.log(`API trả về ${data.length} kết quả`);

      // Lọc dữ liệu dựa trên tham số tìm kiếm trước khi phân trang
      let filteredData = data;
      
      // Chỉ áp dụng lọc nếu API trả về toàn bộ dữ liệu
      // và đang cần tìm kiếm hoặc lọc
      const needFiltering = normalizedSearch || status !== 'all' || role !== 'all' || startDate || endDate;
      
      if (needFiltering) {
        console.log('Áp dụng lọc thủ công trên dữ liệu');
        
        if (normalizedSearch) {
          const searchLower = normalizedSearch.toLowerCase();
          filteredData = data.filter((user: any) => {
            return (
              (user.name && user.name.toLowerCase().includes(searchLower)) ||
              (user.email && user.email.toLowerCase().includes(searchLower)) ||
              (user.phone && user.phone.toLowerCase().includes(searchLower))
            );
          });
          console.log(`Sau khi lọc từ khóa "${normalizedSearch}" còn ${filteredData.length} kết quả`);
        }
        
        // Áp dụng lọc theo trạng thái nếu cần
        if (status && status !== 'all') {
          filteredData = filteredData.filter((user: any) => {
            if (status === 'active') return user.isActive && !user.isBanned;
            if (status === 'inactive') return !user.isActive && !user.isBanned;
            if (status === 'blocked') return user.isBanned;
            return true;
          });
          console.log(`Sau khi lọc trạng thái "${status}" còn ${filteredData.length} kết quả`);
        }
        
        // Áp dụng lọc theo vai trò nếu cần
        if (role && role !== 'all') {
          filteredData = filteredData.filter((user: any) => user.role === role);
          console.log(`Sau khi lọc vai trò "${role}" còn ${filteredData.length} kết quả`);
        }
        
        // Áp dụng lọc theo ngày tháng
        if (startDate || endDate) {
          console.log('Áp dụng lọc theo ngày tháng');
          
          let startDateObj: Date | undefined;
          let endDateObj: Date | undefined;
          
          if (startDate) {
            startDateObj = new Date(startDate as string);
            startDateObj.setHours(0, 0, 0, 0); // Đặt thành đầu ngày (00:00:00)
            console.log(`Lọc từ ngày: ${startDateObj.toISOString()}`);
          }
          
          if (endDate) {
            endDateObj = new Date(endDate as string);
            endDateObj.setHours(23, 59, 59, 999); // Đặt thành cuối ngày (23:59:59.999)
            console.log(`Lọc đến ngày: ${endDateObj.toISOString()}`);
          }
          
          filteredData = filteredData.filter((user: any) => {
            const createdAt = new Date(user.createdAt);
            
            // Kiểm tra điều kiện startDate (lớn hơn hoặc bằng)
            if (startDateObj && createdAt < startDateObj) {
              return false;
            }
            
            // Kiểm tra điều kiện endDate (nhỏ hơn hoặc bằng)
            if (endDateObj && createdAt > endDateObj) {
              return false;
            }
            
            return true;
          });
          
          console.log(`Sau khi lọc theo ngày tháng còn ${filteredData.length} kết quả`);
        }
      }
      
      // Gọi API lấy thông tin thống kê và biểu đồ - sử dụng fetchWithRetry
      const statsResponse = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        }
      });
      
      let monthlyData = [];
      let growthStats = {
        totalGrowth: 0,
        activeGrowth: 0,
        inactiveGrowth: 0,
        blockedGrowth: 0
      };
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        monthlyData = statsData.monthlyCounts || [];
        growthStats.totalGrowth = statsData.totalGrowth || 0;
        growthStats.activeGrowth = statsData.activeGrowth || 0;
        growthStats.inactiveGrowth = statsData.inactiveGrowth || 0;
        growthStats.blockedGrowth = statsData.blockedGrowth || 0;
      }
      
      // Phân trang dữ liệu sau khi đã lọc
      const pageNum = Number(page) || 1;
      const limitNum = Number(limit || 10);
      const startIdx = (pageNum - 1) * limitNum;
      const endIdx = startIdx + limitNum;
      
      const paginatedUsers = filteredData.slice(startIdx, endIdx);
      console.log(`Trả về ${paginatedUsers.length} kết quả cho trang ${pageNum}`);
      
      const totalFilteredUsers = filteredData.length;
      
      const formattedData = {
        users: paginatedUsers.map((user: any) => ({
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone || '',
          role: user.role,
          status: user.isBanned ? 'blocked' : (user.isActive ? 'active' : 'inactive'),
          createdAt: user.createdAt
        })),
        totalUsers: totalFilteredUsers, // Chỉ đếm số lượng sau khi đã lọc
        activeUsers: filteredData.filter((u: any) => u.isActive && !u.isBanned).length,
        inactiveUsers: filteredData.filter((u: any) => !u.isActive && !u.isBanned).length,
        blockedUsers: filteredData.filter((u: any) => u.isBanned).length,
        monthlyCounts: monthlyData,
        totalGrowth: growthStats.totalGrowth,
        activeGrowth: growthStats.activeGrowth,
        inactiveGrowth: growthStats.inactiveGrowth,
        blockedGrowth: growthStats.blockedGrowth,
        currentPage: pageNum,
        totalPages: Math.ceil(totalFilteredUsers / limitNum),
        itemsPerPage: limitNum
      };
      return res.status(response.status).json(formattedData);
    } else {
      // Nếu API trả về đúng định dạng từ backend, chỉ cần chuyển tiếp
      console.log('API trả về dữ liệu đã được xử lý từ backend');
      return res.status(response.status).json(data);
    }
  } catch (error: any) {
    console.error('Lỗi lấy dữ liệu người dùng:', error);
    // Trả về thông tin lỗi chi tiết hơn
    return res.status(error.name === 'AbortError' ? 408 : 500).json({ 
      message: error.name === 'AbortError' ? 'Yêu cầu hết thời gian xử lý' : 'Lỗi máy chủ nội bộ', 
      error: error.message,
      retry: true // Gợi ý cho client rằng có thể retry request
    });
  }
} 