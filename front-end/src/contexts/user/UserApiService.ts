import { User, Address, WishlistItem, Order, Notification, Review } from '../../components/profile/types';

// Base API URL từ biến môi trường
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Helper function để lấy token từ localStorage
const getToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('accessToken');
  }
  return null;
};

// Helper function để xử lý lỗi response
const handleApiError = async (response: Response) => {
  let errorMessage = 'Đã xảy ra lỗi với máy chủ';
  
  try {
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      errorMessage = data.message || errorMessage;
    } else {
      const text = await response.text();
      console.error('Phản hồi không phải JSON:', text);
    }
  } catch (error) {
    console.error('Không thể phân tích phản hồi lỗi:', error);
  }
  
  // Xử lý các mã lỗi cụ thể
  if (response.status === 404) {
    errorMessage = 'Không tìm thấy tài nguyên được yêu cầu';
  } else if (response.status === 403) {
    errorMessage = 'Bạn không có quyền truy cập vào tài nguyên này';
  } else if (response.status === 401) {
    errorMessage = 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại';
    // Xóa thông tin đăng nhập cục bộ
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
  }
  
  throw new Error(errorMessage);
};

// Các API services liên quan đến User Profile
export const UserApiService = {
  // Lấy thông tin profile người dùng
  async getProfile(): Promise<User> {
    const token = getToken();
    if (!token) throw new Error('Vui lòng đăng nhập để tiếp tục');
    

    console.log('Gọi API lấy profile với URL:', `${API_URL}/users/profile`);
    console.log('Token được sử dụng:', token.substring(0, 15) + '...');
    
    try {
      const response = await fetch(`${API_URL}/users/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      console.log('Kết quả API profile:', response.status, response.statusText);
      
      // Sao chép response để tránh đọc body nhiều lần
      const responseClone = response.clone();
      
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('user');
          throw new Error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
        }
        
        try {
          const errorData = await response.json();
          throw new Error(errorData.message || `Lỗi ${response.status}: ${response.statusText}`);
        } catch (jsonError) {
          // Nếu không phải JSON, ném lỗi với mã trạng thái
          throw new Error(`Lỗi ${response.status}: ${response.statusText}`);
        }
      }
      
      try {
        const data = await responseClone.json();
        console.log('Dữ liệu profile:', data);
        return data;
      } catch (parseError) {
        console.error('Lỗi khi phân tích dữ liệu JSON:', parseError);
        throw new Error('Định dạng dữ liệu không hợp lệ');
      }
    } catch (error) {
      console.error('Lỗi khi lấy profile:', error);
      throw error;
    }
  },
  
  // Cập nhật thông tin profile
  async updateProfile(updateData: Partial<User>): Promise<User> {
    const token = getToken();
    if (!token) throw new Error('Vui lòng đăng nhập để tiếp tục');
    
    const response = await fetch(`${API_URL}/users/profile`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        throw new Error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
      }
      const errorData = await response.json().catch(() => ({ message: 'Lỗi không xác định' }));
      throw new Error(errorData.message || `Lỗi ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  },
  
  // Thêm địa chỉ mới
  async addAddress(addressData: Omit<Address, 'addressId'>): Promise<User> {
    const token = getToken();
    if (!token) throw new Error('Vui lòng đăng nhập để tiếp tục');
    
    const response = await fetch(`${API_URL}/users/profile/addresses`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(addressData),
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        throw new Error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
      }
      const errorData = await response.json().catch(() => ({ message: 'Lỗi không xác định' }));
      throw new Error(errorData.message || `Lỗi ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  },
  
  // Cập nhật địa chỉ
  async updateAddress(addressId: string, addressData: Omit<Address, 'addressId'>): Promise<User> {
    const token = getToken();
    if (!token) throw new Error('Vui lòng đăng nhập để tiếp tục');
    
    const response = await fetch(`${API_URL}/users/profile/addresses/${addressId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(addressData),
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        throw new Error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
      }
      const errorData = await response.json().catch(() => ({ message: 'Lỗi không xác định' }));
      throw new Error(errorData.message || `Lỗi ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  },
  
  // Xóa địa chỉ
  async deleteAddress(addressId: string): Promise<User> {
    const token = getToken();
    if (!token) throw new Error('Vui lòng đăng nhập để tiếp tục');
    
    const response = await fetch(`${API_URL}/users/profile/addresses/${addressId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        throw new Error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
      }
      const errorData = await response.json().catch(() => ({ message: 'Lỗi không xác định' }));
      throw new Error(errorData.message || `Lỗi ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  },
  
  // Đặt địa chỉ mặc định
  async setDefaultAddress(addressId: string): Promise<User> {
    const token = getToken();
    if (!token) throw new Error('Vui lòng đăng nhập để tiếp tục');
    
    const response = await fetch(`${API_URL}/users/profile/addresses/${addressId}/default`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        throw new Error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
      }
      const errorData = await response.json().catch(() => ({ message: 'Lỗi không xác định' }));
      throw new Error(errorData.message || `Lỗi ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  },
  
  // Lấy danh sách sản phẩm yêu thích
  async getWishlist(): Promise<WishlistItem[]> {
    const token = getToken();
    if (!token) throw new Error('Vui lòng đăng nhập để tiếp tục');
    
    // Kiểm tra xem có localStorage user không để đảm bảo có ID
    let userId: string | null = null;
    try {
      const userJson = localStorage.getItem('user');
      if (userJson) {
        const userData = JSON.parse(userJson);
        userId = userData._id;
      }
    } catch (error) {
      console.error('Lỗi khi lấy thông tin người dùng từ localStorage:', error);
    }
    
    if (!userId) {
      console.error('Không có ID người dùng khi gọi API wishlist');
      // Trả về mảng rỗng thay vì lỗi để tránh crash ứng dụng
      return [];
    }
    
    console.log('Gọi API lấy wishlist với URL:', `${API_URL}/users/profile/wishlist`);
    
    try {
      const response = await fetch(`${API_URL}/users/profile/wishlist`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      console.log('Kết quả API wishlist:', response.status, response.statusText);
      
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('user');
          throw new Error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
        }
        const errorData = await response.json().catch(() => ({ message: 'Lỗi không xác định' }));
        throw new Error(errorData.message || `Lỗi ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Lỗi khi lấy wishlist:', error);
      // Trả về mảng rỗng thay vì lỗi trong môi trường development
      if (process.env.NODE_ENV === 'development') {
        return [];
      }
      throw error;
    }
  },
  
  // Thêm sản phẩm vào danh sách yêu thích
  async addToWishlist(productId: string): Promise<User> { // Bỏ variantId khỏi tham số
    const token = getToken();
    if (!token) throw new Error('Vui lòng đăng nhập để tiếp tục');
    
    const response = await fetch(`${API_URL}/users/profile/wishlist`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      // Chỉ gửi productId theo yêu cầu của backend
      body: JSON.stringify({ productId }), 
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        throw new Error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
      }
      const errorData = await response.json().catch(() => ({ message: 'Lỗi không xác định' }));
      throw new Error(errorData.message || `Lỗi ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  },
  
  // Xóa sản phẩm khỏi danh sách yêu thích
  async removeFromWishlist(productId: string): Promise<User> { // Bỏ variantId khỏi tham số
    const token = getToken();
    if (!token) throw new Error('Vui lòng đăng nhập để tiếp tục');
    
    // Backend chỉ nhận productId trong path
    const url = `${API_URL}/users/profile/wishlist/${productId}`;
      
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        throw new Error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
      }
      const errorData = await response.json().catch(() => ({ message: 'Lỗi không xác định' }));
      throw new Error(errorData.message || `Lỗi ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  },
  
  // Lấy danh sách đơn hàng
  async getOrders(status: string = 'all', page: number = 1, limit: number = 10): Promise<{ orders: Order[], total: number }> {
    const token = getToken();
    if (!token) throw new Error('Vui lòng đăng nhập để tiếp tục');
    
    // Kiểm tra xem có localStorage user không để đảm bảo có ID
    let userId: string | null = null;
    try {
      const userJson = localStorage.getItem('user');
      if (userJson) {
        const userData = JSON.parse(userJson);
        userId = userData._id;
      }
    } catch (error) {
      console.error('Lỗi khi lấy thông tin người dùng từ localStorage:', error);
    }
    
    if (!userId) {
      console.error('Không có ID người dùng khi gọi API orders');
      // Trả về dữ liệu rỗng để tránh crash ứng dụng
      return { orders: [], total: 0 };
    }
    
    console.log('Gọi API lấy orders với URL:', `${API_URL}/orders/user?status=${status}&page=${page}&limit=${limit}`);
    
    try {
      const response = await fetch(
        `${API_URL}/orders/user?status=${status}&page=${page}&limit=${limit}`, 
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      
      console.log('Kết quả API orders:', response.status, response.statusText);
      
      if (!response.ok) {
        // Xử lý lỗi 404 nhẹ nhàng hơn vì API chưa tồn tại
        if (response.status === 404) {
          console.warn(`API ${response.url} trả về 404 (Not Found). Trả về dữ liệu rỗng.`);
          return { orders: [], total: 0 }; 
        }
        
        if (response.status === 401) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('user');
          throw new Error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
        }
        
        // Ném lỗi cho các trường hợp khác (500, 403, etc.)
        const errorData = await response.json().catch(() => ({ message: 'Lỗi không xác định' }));
        throw new Error(errorData.message || `Lỗi ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Lỗi khi lấy orders:', error);
      // Trả về dữ liệu rỗng thay vì lỗi trong môi trường development
      if (process.env.NODE_ENV === 'development') {
        return { orders: [], total: 0 };
      }
      throw error;
    }
  },
  
  // Lấy chi tiết đơn hàng
  async getOrderDetail(orderId: string): Promise<Order> {
    const token = getToken();
    if (!token) throw new Error('Vui lòng đăng nhập để tiếp tục');
    
    const response = await fetch(`${API_URL}/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        throw new Error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
      }
      const errorData = await response.json().catch(() => ({ message: 'Lỗi không xác định' }));
      throw new Error(errorData.message || `Lỗi ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  },
  
  // Huỷ đơn hàng
  async cancelOrder(orderId: string, reason: string): Promise<Order> {
    const token = getToken();
    if (!token) throw new Error('Vui lòng đăng nhập để tiếp tục');
    
    const response = await fetch(`${API_URL}/orders/${orderId}/cancel`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason }),
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        throw new Error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
      }
      const errorData = await response.json().catch(() => ({ message: 'Lỗi không xác định' }));
      throw new Error(errorData.message || `Lỗi ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  },
  
  // Yêu cầu trả hàng
  async requestReturnOrder(orderId: string, reason: string): Promise<Order> {
    const token = getToken();
    if (!token) throw new Error('Vui lòng đăng nhập để tiếp tục');
    
    const response = await fetch(`${API_URL}/orders/${orderId}/return`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason }),
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        throw new Error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
      }
      const errorData = await response.json().catch(() => ({ message: 'Lỗi không xác định' }));
      throw new Error(errorData.message || `Lỗi ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  },
  
  // Tải hóa đơn
  async downloadInvoice(orderId: string): Promise<Blob> {
    const token = getToken();
    if (!token) throw new Error('Vui lòng đăng nhập để tiếp tục');
    
    const response = await fetch(`${API_URL}/orders/${orderId}/invoice`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        throw new Error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
      }
      const errorData = await response.json().catch(() => ({ message: 'Lỗi không xác định' }));
      throw new Error(errorData.message || `Lỗi ${response.status}: ${response.statusText}`);
    }
    
    return await response.blob();
  },
  
  // Mua lại sản phẩm từ đơn hàng
  async buyAgain(orderId: string): Promise<{ success: boolean, message: string }> {
    const token = getToken();
    if (!token) throw new Error('Vui lòng đăng nhập để tiếp tục');
    
    const response = await fetch(`${API_URL}/orders/${orderId}/buy-again`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        throw new Error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
      }
      const errorData = await response.json().catch(() => ({ message: 'Lỗi không xác định' }));
      throw new Error(errorData.message || `Lỗi ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  },
  
  // Lấy danh sách thông báo
  async getNotifications(page: number = 1, limit: number = 10): Promise<{ notifications: Notification[], total: number }> {
    const token = getToken();
    if (!token) throw new Error('Vui lòng đăng nhập để tiếp tục');
    
    // Kiểm tra xem có localStorage user không để đảm bảo có ID
    let userId: string | null = null;
    try {
      const userJson = localStorage.getItem('user');
      if (userJson) {
        const userData = JSON.parse(userJson);
        userId = userData._id;
      }
    } catch (error) {
      console.error('Lỗi khi lấy thông tin người dùng từ localStorage:', error);
    }
    
    if (!userId) {
      console.error('Không có ID người dùng khi gọi API notifications');
      // Trả về dữ liệu rỗng để tránh crash ứng dụng
      return { notifications: [], total: 0 };
    }
    
    console.log('Gọi API lấy notifications với URL:', `${API_URL}/notifications?page=${page}&limit=${limit}`);
    
    try {
      const response = await fetch(
        `${API_URL}/notifications?page=${page}&limit=${limit}`, 
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      
      console.log('Kết quả API notifications:', response.status, response.statusText);
      
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('user');
          throw new Error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
        }
        const errorData = await response.json().catch(() => ({ message: 'Lỗi không xác định' }));
        throw new Error(errorData.message || `Lỗi ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Lỗi khi lấy notifications:', error);
      // Trả về dữ liệu rỗng thay vì lỗi trong môi trường development
      if (process.env.NODE_ENV === 'development') {
        return { notifications: [], total: 0 };
      }
      throw error;
    }
  },
  
  // Đánh dấu thông báo đã đọc
  async markNotificationAsRead(notificationId: string): Promise<Notification> {
    const token = getToken();
    if (!token) throw new Error('Vui lòng đăng nhập để tiếp tục');
    
    const response = await fetch(`${API_URL}/notifications/${notificationId}/read`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        throw new Error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
      }
      const errorData = await response.json().catch(() => ({ message: 'Lỗi không xác định' }));
      throw new Error(errorData.message || `Lỗi ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  },
  
  // Đánh dấu tất cả thông báo đã đọc
  async markAllNotificationsAsRead(): Promise<{ success: boolean }> {
    const token = getToken();
    if (!token) throw new Error('Vui lòng đăng nhập để tiếp tục');
    
    const response = await fetch(`${API_URL}/notifications/read-all`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        throw new Error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
      }
      const errorData = await response.json().catch(() => ({ message: 'Lỗi không xác định' }));
      throw new Error(errorData.message || `Lỗi ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  },
  
  // Xóa thông báo
  async deleteNotification(notificationId: string): Promise<{ success: boolean }> {
    const token = getToken();
    if (!token) throw new Error('Vui lòng đăng nhập để tiếp tục');
    
    const response = await fetch(`${API_URL}/notifications/${notificationId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        throw new Error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
      }
      const errorData = await response.json().catch(() => ({ message: 'Lỗi không xác định' }));
      throw new Error(errorData.message || `Lỗi ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  },
  
  // Lấy danh sách đánh giá
  async getReviews(page: number = 1, limit: number = 10): Promise<{ reviews: Review[], total: number }> {
    const token = getToken();
    if (!token) throw new Error('Vui lòng đăng nhập để tiếp tục');
    
    // Kiểm tra xem có localStorage user không để đảm bảo có ID
    let userId: string | null = null;
    try {
      const userJson = localStorage.getItem('user');
      if (userJson) {
        const userData = JSON.parse(userJson);
        userId = userData._id;
      }
    } catch (error) {
      console.error('Lỗi khi lấy thông tin người dùng từ localStorage:', error);
    }
    
    if (!userId) {
      console.error('Không có ID người dùng khi gọi API reviews');
      // Trả về dữ liệu rỗng để tránh crash ứng dụng
      return { reviews: [], total: 0 };
    }
    
    // Sửa URL để gọi đúng endpoint /reviews/user/me
    const url = `${API_URL}/reviews/user/me?page=${page}&limit=${limit}`;
    console.log('Gọi API lấy reviews với URL:', url);
    
    try {
      const response = await fetch(
        url, 
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      
      console.log('Kết quả API reviews:', response.status, response.statusText);
      
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('user');
          throw new Error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
        }
        const errorData = await response.json().catch(() => ({ message: 'Lỗi không xác định' }));
        throw new Error(errorData.message || `Lỗi ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Lỗi khi lấy reviews:', error);
      // Trả về dữ liệu rỗng thay vì lỗi trong môi trường development
      if (process.env.NODE_ENV === 'development') {
        return { reviews: [], total: 0 };
      }
      throw error;
    }
  },
  
  // Cập nhật đánh giá
  async updateReview(reviewId: string, updateData: Partial<Review>): Promise<Review> {
    const token = getToken();
    if (!token) throw new Error('Vui lòng đăng nhập để tiếp tục');
    
    const response = await fetch(`${API_URL}/reviews/${reviewId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        throw new Error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
      }
      const errorData = await response.json().catch(() => ({ message: 'Lỗi không xác định' }));
      throw new Error(errorData.message || `Lỗi ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  },
  
  // Xóa đánh giá
  async deleteReview(reviewId: string): Promise<{ success: boolean }> {
    const token = getToken();
    if (!token) throw new Error('Vui lòng đăng nhập để tiếp tục');
    
    const response = await fetch(`${API_URL}/reviews/${reviewId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        throw new Error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
      }
      const errorData = await response.json().catch(() => ({ message: 'Lỗi không xác định' }));
      throw new Error(errorData.message || `Lỗi ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  },
};
