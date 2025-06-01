import axios, { AxiosResponse } from 'axios';
import { ChatMessage, RecommendedProduct, UserPreferences } from '@/contexts/chatbot/ChatbotContext';

// API Base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// API Endpoints - Fixed to match backend (baseURL chưa có /api)
const ENDPOINTS = {
  SEND_MESSAGE: '/chatbot/send-message',
  GET_HISTORY: '/chatbot/history',
  SEARCH_PRODUCTS: '/chatbot/search-products',
  FEEDBACK: '/chatbot/feedback',
  HEALTH: '/chatbot/health',
};

// Request/Response Types - Updated to match backend DTOs
interface SendMessageRequest {
  message: string;
  sessionId?: string;
  skinType?: string;
  concerns?: string[];
  budget?: number;
  preferredBrands?: string[];
  userId?: string;
}

interface SendMessageResponse {
  messageId: string;
  sessionId: string;
  response: string;
  type: 'TEXT' | 'PRODUCT_RECOMMENDATION' | 'SEARCH_RESULT';
  recommendedProducts?: Array<{
    id: string;
    name: string;
    slug: string;
    price: number;
    currentPrice?: number;
    brand: string;
    imageUrl?: string;
    reason: string;
  }>;
  relatedCategories?: Array<{
    id: string;
    name: string;
    description: string;
    level: number;
  }>;
  relatedBrands?: Array<{
    id: string;
    name: string;
    description: string;
    origin: string;
  }>;
  relatedEvents?: Array<{
    id: string;
    title: string;
    description: string;
    startDate: Date;
    endDate: Date;
    discountInfo: string;
    products?: Array<{
      productId: string;
      productName: string;
      adjustedPrice: number;
      originalPrice: number;
      image: string;
    }>;
  }>;
  relatedCampaigns?: Array<{
    id: string;
    title: string;
    description: string;
    type: string;
    startDate: Date;
    endDate: Date;
    products?: Array<{
      productId: string;
      productName: string;
      adjustedPrice: number;
      originalPrice: number;
      image: string;
    }>;
  }>;
  metadata?: {
    userIntent?: string;
    confidence?: number;
    processingTime?: number;
    contextUsed?: string[];
  };
  createdAt: Date;
}

interface GetHistoryRequest {
  sessionId?: string;
  page?: number;
  limit?: number;
  userId?: string;
}

export interface GetHistoryResponse {
  messages: Array<{
    messageId: string;
    role: 'user' | 'assistant';
    content: string;
    type: 'TEXT' | 'PRODUCT_RECOMMENDATION' | 'SEARCH_RESULT';
    attachedProducts?: any[];
    attachedCategories?: any[];
    attachedBrands?: any[];
    attachedEvents?: any[];
    attachedCampaigns?: any[];
    metadata?: any;
    isHelpful?: boolean;
    feedback?: string;
    createdAt: Date;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  sessionId: string;
}

interface SearchProductsRequest {
  query: string;
  skinType?: string;
  concerns?: string[];
  budget?: number;
  brandId?: string;
  limit?: number;
}

// Fixed feedback request to match backend - messageId is URL param, not body
interface FeedbackRequest {
  isHelpful: boolean;
  feedback?: string;
  userId?: string;
}

// Axios instance with interceptors
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // Reduced timeout to 15 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    // Sử dụng cùng key với AuthContext: 'accessToken'
    const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - sử dụng cùng key với AuthContext
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      sessionStorage.removeItem('accessToken');
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

// ChatBot Service Class
export class ChatbotService {
  /**
   * Gửi tin nhắn cho AI chatbot
   */
  static async sendMessage(
    message: string,
    sessionId?: string,
    userPreferences?: UserPreferences
  ): Promise<SendMessageResponse> {
    try {
      // Lấy userId từ localStorage hoặc sessionStorage
      const userString = localStorage.getItem('user') || sessionStorage.getItem('user');
      let userId = '';
      
      if (userString) {
        try {
          const user = JSON.parse(userString);
          userId = user.id || user._id || '';
        } catch (e) {
          console.error('Error parsing user data:', e);
        }
      }
      
      // Nếu không có userId, không thể gửi tin nhắn
      if (!userId) {
        throw new Error('Bạn cần đăng nhập để sử dụng chatbot');
      }

      const requestData: SendMessageRequest = {
        message,
        sessionId,
        userId,
        ...userPreferences,
      };

      const response: AxiosResponse<SendMessageResponse> = await apiClient.post(
        ENDPOINTS.SEND_MESSAGE,
        requestData
      );

      return response.data;
    } catch (error: any) {
      console.error('Error sending message:', error);
      throw new Error(
        error.response?.data?.message || 
        'Không thể gửi tin nhắn. Vui lòng thử lại.'
      );
    }
  }

  /**
   * Lấy lịch sử chat với retry mechanism
   */
  static async getChatHistory(
    sessionId?: string,
    page: number = 1,
    limit: number = 20
  ): Promise<GetHistoryResponse> {
    const maxRetries = 2;
    let lastError: any;

    // Lấy userId từ localStorage hoặc sessionStorage
    const userString = localStorage.getItem('user') || sessionStorage.getItem('user');
    let userId = '';
    
    if (userString) {
      try {
        const user = JSON.parse(userString);
        userId = user.id || user._id || '';
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
    
    // Nếu không có userId, không thể lấy lịch sử chat
    if (!userId) {
      throw new Error('Bạn cần đăng nhập để xem lịch sử chat');
    }

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const params: GetHistoryRequest = {
          sessionId,
          page,
          limit,
          userId,
        };

        const response: AxiosResponse<GetHistoryResponse> = await apiClient.get(
          ENDPOINTS.GET_HISTORY,
          {
            params,
            timeout: 10000 // Shorter timeout for history
          }
        );

        return response.data;
      } catch (error: any) {
        lastError = error;
        console.error(`Error getting chat history (attempt ${attempt + 1}):`, error);

        // Don't retry on certain errors
        if (error.response?.status === 404 || error.response?.status === 401) {
          break;
        }

        // Wait before retry (except on last attempt)
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      }
    }

    throw new Error(
      lastError.response?.data?.message ||
      'Không thể tải lịch sử chat. Vui lòng thử lại.'
    );
  }

  /**
   * Tìm kiếm sản phẩm thông qua chatbot
   */
  static async searchProducts(
    query: string,
    filters?: {
      skinType?: string;
      concerns?: string[];
      budget?: number;
      brandId?: string;
      limit?: number;
    }
  ): Promise<any[]> {
    try {
      const requestData: SearchProductsRequest = {
        query,
        ...filters,
      };

      const response: AxiosResponse<any[]> = await apiClient.post(
        ENDPOINTS.SEARCH_PRODUCTS,
        requestData
      );

      return response.data;
    } catch (error: any) {
      console.error('Error searching products:', error);
      throw new Error(
        error.response?.data?.message || 
        'Không thể tìm kiếm sản phẩm. Vui lòng thử lại.'
      );
    }
  }

  /**
   * Đánh giá tin nhắn chatbot - Fixed to match backend API
   */
  static async provideFeedback(
    messageId: string,
    isHelpful: boolean,
    feedback?: string
  ): Promise<{ message: string }> {
    try {
      // Lấy userId từ localStorage hoặc sessionStorage
      const userString = localStorage.getItem('user') || sessionStorage.getItem('user');
      let userId = '';
      
      if (userString) {
        try {
          const user = JSON.parse(userString);
          userId = user.id || user._id || '';
        } catch (e) {
          console.error('Error parsing user data:', e);
        }
      }
      
      // Nếu không có userId, không thể gửi phản hồi
      if (!userId) {
        throw new Error('Bạn cần đăng nhập để gửi phản hồi');
      }

      // messageId is now URL parameter, not in request body
      const requestData: FeedbackRequest = {
        isHelpful,
        feedback,
        userId,
      };

      const response: AxiosResponse<{ message: string }> = await apiClient.post(
        `${ENDPOINTS.FEEDBACK}/${messageId}`,
        requestData
      );

      return response.data;
    } catch (error: any) {
      console.error('Error providing feedback:', error);
      throw new Error(
        error.response?.data?.message || 
        'Không thể gửi phản hồi. Vui lòng thử lại.'
      );
    }
  }

  /**
   * Kiểm tra trạng thái chatbot với timeout ngắn
   */
  static async healthCheck(): Promise<{ status: string; timestamp: Date }> {
    try {
      const response: AxiosResponse<{ status: string; timestamp: Date }> =
        await apiClient.get(ENDPOINTS.HEALTH, {
          timeout: 5000 // 5 seconds timeout for health check
        });

      return response.data;
    } catch (error: any) {
      console.error('Error checking chatbot health:', error);
      throw new Error(
        error.response?.data?.message ||
        'Không thể kiểm tra trạng thái chatbot.'
      );
    }
  }

  /**
   * Chuyển đổi response từ API thành ChatMessage format
   */
  static convertToChatMessage(
    response: SendMessageResponse,
    role: 'user' | 'assistant' = 'assistant'
  ): ChatMessage {
    return {
      messageId: response.messageId,
      role,
      content: response.response,
      type: response.type,
      recommendedProducts: response.recommendedProducts?.map(product => ({
        id: product.id,
        name: product.name,
        slug: product.slug || '',
        price: product.price,
        currentPrice: product.currentPrice,
        brand: product.brand,
        imageUrl: product.imageUrl,
        reason: product.reason,
      })),
      relatedCategories: response.relatedCategories?.map(category => ({
        id: category.id,
        name: category.name,
        description: category.description,
        level: category.level,
      })),
      relatedBrands: response.relatedBrands?.map(brand => ({
        id: brand.id,
        name: brand.name,
        description: brand.description,
        origin: brand.origin,
      })),
      relatedEvents: response.relatedEvents?.map(event => ({
        id: event.id,
        title: event.title,
        description: event.description,
        startDate: new Date(event.startDate),
        endDate: new Date(event.endDate),
        discountInfo: event.discountInfo,
        products: event.products,
      })),
      relatedCampaigns: response.relatedCampaigns?.map(campaign => ({
        id: campaign.id,
        title: campaign.title,
        description: campaign.description,
        type: campaign.type,
        startDate: new Date(campaign.startDate),
        endDate: new Date(campaign.endDate),
        products: campaign.products,
      })),
      metadata: response.metadata,
      createdAt: new Date(response.createdAt),
    };
  }

  /**
   * Tạo user message
   */
  static createUserMessage(content: string): ChatMessage {
    return {
      messageId: `user_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      role: 'user',
      content,
      type: 'TEXT',
      createdAt: new Date(),
    };
  }

  /**
   * Validate user input
   */
  static validateMessage(message: string): boolean {
    return message.trim().length > 0 && message.trim().length <= 1000;
  }

  /**
   * Format error message for display
   */
  static formatErrorMessage(error: any): string {
    if (error.response?.status === 400) {
      return 'Tin nhắn không hợp lệ. Vui lòng kiểm tra lại.';
    }
    if (error.response?.status === 401) {
      return 'Bạn cần đăng nhập để sử dụng chatbot.';
    }
    if (error.response?.status === 429) {
      return 'Bạn đã gửi quá nhiều tin nhắn. Vui lòng chờ một chút.';
    }
    if (error.response?.status >= 500) {
      return 'Hệ thống đang bảo trì. Vui lòng thử lại sau.';
    }
    return error.message || 'Đã có lỗi xảy ra. Vui lòng thử lại.';
  }

  /**
   * Kiểm tra backend API có hoạt động không
   */
  static async checkApiStatus(): Promise<boolean> {
    try {
      // Thử gọi health endpoint trước
      await this.healthCheck();
      return true;
    } catch (error: any) {
      // Nếu lỗi là 404, thử gọi API khác thay thế (có thể là API public nào đó)
      if (error.response?.status === 404) {
        try {
          // Thử ping API base URL (không cần đăng nhập)
          await axios.get(API_BASE_URL, { timeout: 3000 });
          return true;
        } catch (fallbackError) {
          console.error('Fallback API check failed:', fallbackError);
          return false;
        }
      }
      
      // Nếu lỗi là 401 (unauthorized), vẫn coi như API hoạt động
      if (error.response?.status === 401) {
        return true;
      }
      
      console.error('API health check failed:', error);
      return false;
    }
  }

  /**
   * Generate session ID theo format của backend
   */
  static generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }
}

export default ChatbotService; 