import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { ChatbotService } from '@/services/chatbotService';
import ChatbotStorageService from '@/services/chatbotStorageService';

// Interface cho error response
interface ApiError {
  response?: {
    status?: number;
    data?: {
      message?: string;
    };
  };
  message?: string;
  [key: string]: unknown;
}

// Types - Updated to match backend schemas
export type MessageType = 'TEXT' | 'PRODUCT_RECOMMENDATION' | 'SEARCH_RESULT' | 'CATEGORY_INFO' | 'BRAND_INFO' | 'EVENT_INFO' | 'ERROR';

export interface ChatMessage {
  messageId: string;
  role: 'user' | 'assistant';
  content: string;
  type: MessageType;
  recommendedProducts?: RecommendedProduct[];
  relatedCategories?: RelatedCategory[];
  relatedBrands?: RelatedBrand[];
  relatedEvents?: RelatedEvent[];
  relatedCampaigns?: Array<{
    id: string;
    title: string;
    description: string;
    type?: string;
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
  isHelpful?: boolean;
  feedback?: string;
  createdAt: Date;
}

export interface RecommendedProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  currentPrice?: number;
  brand: string;
  imageUrl?: string;
  reason: string;
}

export interface RelatedCategory {
  id: string;
  name: string;
  description: string;
  level: number;
}

export interface RelatedBrand {
  id: string;
  name: string;
  description: string;
  origin: string;
}

export interface RelatedEvent {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  discountInfo: string;
}

export interface ChatSession {
  sessionId: string;
  messages: ChatMessage[];
  isLoading: boolean;
  isTyping: boolean;
  error: string | null;
}

export interface UserPreferences {
  skinType?: string;
  concerns?: string[];
  budget?: number;
  preferredBrands?: string[];
}

interface ChatbotState {
  isOpen: boolean;
  currentSession: ChatSession | null;
  sessions: ChatSession[];
  userPreferences: UserPreferences;
  isInitialized: boolean;
}

// Actions
type ChatbotAction =
  | { type: 'TOGGLE_CHAT' }
  | { type: 'OPEN_CHAT' }
  | { type: 'CLOSE_CHAT' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_TYPING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'ADD_MESSAGE'; payload: ChatMessage }
  | { type: 'SET_MESSAGES'; payload: ChatMessage[] }
  | { type: 'CREATE_SESSION'; payload: string }
  | { type: 'SET_CURRENT_SESSION'; payload: ChatSession }
  | { type: 'UPDATE_USER_PREFERENCES'; payload: Partial<UserPreferences> }
  | { type: 'SET_INITIALIZED'; payload: boolean }
  | { type: 'CLEAR_ERROR' }
  | { type: 'LOAD_FROM_STORAGE'; payload: { currentSession: ChatSession | null; sessions: ChatSession[]; userPreferences: UserPreferences } }
  | { type: 'CLEAR_ALL_DATA' };

// Initial state
const initialState: ChatbotState = {
  isOpen: false,
  currentSession: null,
  sessions: [],
  userPreferences: {},
  isInitialized: false,
};

// Reducer
function chatbotReducer(state: ChatbotState, action: ChatbotAction): ChatbotState {
  switch (action.type) {
    case 'TOGGLE_CHAT':
      return { ...state, isOpen: !state.isOpen };
    
    case 'OPEN_CHAT':
      return { ...state, isOpen: true };
    
    case 'CLOSE_CHAT':
      return { ...state, isOpen: false };
    
    case 'SET_LOADING':
      return {
        ...state,
        currentSession: state.currentSession
          ? { ...state.currentSession, isLoading: action.payload }
          : null,
      };
    
    case 'SET_TYPING':
      return {
        ...state,
        currentSession: state.currentSession
          ? { ...state.currentSession, isTyping: action.payload }
          : null,
      };
    
    case 'SET_ERROR':
      // Nếu không có session hiện tại, tạo một session tạm thời để hiển thị lỗi
      if (!state.currentSession) {
        const errorSession: ChatSession = {
          sessionId: `temp_session_${Date.now()}`,
          messages: [],
          isLoading: false,
          isTyping: false,
          error: action.payload,
        };
        return {
          ...state,
          currentSession: errorSession,
        };
      }
      
      return {
        ...state,
        currentSession: {
          ...state.currentSession,
          error: action.payload
        },
      };
    
    case 'ADD_MESSAGE':
      if (!state.currentSession) return state;
      
      const updatedMessages = [...state.currentSession.messages, action.payload];
      const updatedSession = {
        ...state.currentSession,
        messages: updatedMessages,
        isLoading: false,
        isTyping: false,
        error: null,
      };
      
      return {
        ...state,
        currentSession: updatedSession,
        sessions: state.sessions.map(session =>
          session.sessionId === updatedSession.sessionId ? updatedSession : session
        ),
      };
    
    case 'SET_MESSAGES':
      if (!state.currentSession) return state;
      
      const sessionWithMessages = {
        ...state.currentSession,
        messages: action.payload,
      };
      
      return {
        ...state,
        currentSession: sessionWithMessages,
        sessions: state.sessions.map(session =>
          session.sessionId === sessionWithMessages.sessionId ? sessionWithMessages : session
        ),
      };
    
    case 'CREATE_SESSION':
      const newSession: ChatSession = {
        sessionId: action.payload,
        messages: [],
        isLoading: false,
        isTyping: false,
        error: null,
      };
      
      return {
        ...state,
        currentSession: newSession,
        sessions: [...state.sessions, newSession],
      };
    
    case 'SET_CURRENT_SESSION':
      return {
        ...state,
        currentSession: action.payload,
      };
    
    case 'UPDATE_USER_PREFERENCES':
      return {
        ...state,
        userPreferences: { ...state.userPreferences, ...action.payload },
      };
    
    case 'SET_INITIALIZED':
      return {
        ...state,
        isInitialized: action.payload,
      };
    
    case 'CLEAR_ERROR':
      return {
        ...state,
        currentSession: state.currentSession
          ? { ...state.currentSession, error: null }
          : null,
      };

    case 'LOAD_FROM_STORAGE':
      return {
        ...state,
        currentSession: action.payload.currentSession,
        sessions: action.payload.sessions,
        userPreferences: action.payload.userPreferences,
        isInitialized: true,
      };

    case 'CLEAR_ALL_DATA':
      return {
        ...initialState,
        isInitialized: true,
      };

    default:
      return state;
  }
}

// Context
interface ChatbotContextType {
  state: ChatbotState;
  dispatch: React.Dispatch<ChatbotAction>;
  // Helper functions
  toggleChat: () => void;
  openChat: () => void;
  closeChat: () => void;
  sendMessage: (message: string) => Promise<void>;
  loadChatHistory: () => Promise<void>;
  createNewSession: () => void;
  updateUserPreferences: (preferences: Partial<UserPreferences>) => void;
  provideFeedback: (messageId: string, isHelpful: boolean, feedback?: string) => Promise<void>;
  clearError: () => void;
  // Storage functions
  loadFromStorage: () => void;
  clearAllData: () => void;
}

const ChatbotContext = createContext<ChatbotContextType | undefined>(undefined);

// Provider
interface ChatbotProviderProps {
  children: ReactNode;
}

export function ChatbotProvider({ children }: ChatbotProviderProps) {
  const [state, dispatch] = useReducer(chatbotReducer, initialState);

  // Helper functions
  const toggleChat = () => dispatch({ type: 'TOGGLE_CHAT' });
  const openChat = () => {
    dispatch({ type: 'OPEN_CHAT' });
    // Nếu chưa có session và đã đăng nhập, tạo session mới
    if (!state.currentSession) {
      const userString = localStorage.getItem('user') || sessionStorage.getItem('user');
      if (userString) {
        createNewSession();
      }
    }
  };
  const closeChat = () => dispatch({ type: 'CLOSE_CHAT' });
  const clearError = () => {
    if (state.currentSession?.error) {
      dispatch({ type: 'CLEAR_ERROR' });
    }
  };

  const createNewSession = () => {
    // Kiểm tra xem user đã đăng nhập chưa
    const userString = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (!userString) {
      dispatch({ type: 'SET_ERROR', payload: 'Bạn cần đăng nhập để sử dụng chatbot' });
      return;
    }
    
    const sessionId = ChatbotService.generateSessionId();
    dispatch({ type: 'CREATE_SESSION', payload: sessionId });
  };

  const updateUserPreferences = (preferences: Partial<UserPreferences>) => {
    dispatch({ type: 'UPDATE_USER_PREFERENCES', payload: preferences });
  };

  // Storage functions
  const loadFromStorage = () => {
    try {
      if (!ChatbotStorageService.isStorageAvailable()) {
        console.log('localStorage not available');
        return;
      }

      const storedData = ChatbotStorageService.loadChatbotData();
      if (storedData) {
        dispatch({ type: 'LOAD_FROM_STORAGE', payload: storedData });
        console.log('Chatbot data loaded from localStorage');
      }
    } catch (error) {
      console.error('Error loading chatbot data from storage:', error);
    }
  };

  const clearAllData = () => {
    try {
      ChatbotStorageService.clearChatbotData();
      dispatch({ type: 'CLEAR_ALL_DATA' });
      console.log('All chatbot data cleared');
    } catch (error) {
      console.error('Error clearing chatbot data:', error);
    }
  };

  // Auto-save to localStorage when state changes
  useEffect(() => {
    if (state.isInitialized && ChatbotStorageService.isStorageAvailable()) {
      ChatbotStorageService.saveChatbotData(
        state.currentSession,
        state.sessions,
        state.userPreferences
      );
    }
  }, [state.currentSession, state.sessions, state.userPreferences, state.isInitialized]);

  // Load data from localStorage on mount
  useEffect(() => {
    if (!state.isInitialized) {
      loadFromStorage();
      // If no data was loaded, mark as initialized
      if (!state.currentSession && !state.sessions.length) {
        dispatch({ type: 'SET_INITIALIZED', payload: true });
      }
    }
  }, [state.currentSession, state.isInitialized, state.sessions.length]); // Added missing dependencies

  // Initialize chatbot when first opened - Fixed to prevent multiple session creation
  useEffect(() => {
    if (state.isOpen && state.isInitialized && !state.currentSession) {
      // Kiểm tra xem user đã đăng nhập chưa
      const userString = localStorage.getItem('user') || sessionStorage.getItem('user');
      if (userString) {
        createNewSession();
      } else {
        // Nếu chưa đăng nhập, hiển thị lỗi
        dispatch({ type: 'SET_ERROR', payload: 'Bạn cần đăng nhập để sử dụng chatbot' });
      }
    }
  }, [state.isOpen, state.isInitialized, state.currentSession]); // Added state.currentSession dependency

  // Send message implementation
  const sendMessage = async (message: string): Promise<void> => {
    // Kiểm tra xem user đã đăng nhập chưa (kiểm tra trước khi làm bất kỳ thao tác nào)
    const userString = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (!userString) {
      const errorMessage = 'Bạn cần đăng nhập để sử dụng chatbot';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      return;
    }

    // Validate message
    if (!ChatbotService.validateMessage(message)) {
      dispatch({ type: 'SET_ERROR', payload: 'Tin nhắn không hợp lệ. Vui lòng nhập từ 1-1000 ký tự.' });
      return;
    }

    // Nếu chưa có session, tạo session mới
    if (!state.currentSession) {
      createNewSession();
      // Wait for next tick to ensure session is created
      await new Promise(resolve => setTimeout(resolve, 0));
      if (!state.currentSession) {
        dispatch({ type: 'SET_ERROR', payload: 'Không thể tạo phiên chat. Vui lòng thử lại.' });
        return;
      }
    }

    try {
      // Clear any existing errors
      dispatch({ type: 'CLEAR_ERROR' });

      // Add user message to chat
      const userMessage = ChatbotService.createUserMessage(message);
      dispatch({ type: 'ADD_MESSAGE', payload: userMessage });

      // Set loading and typing states
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_TYPING', payload: true });

      // Send message to API
      const response = await ChatbotService.sendMessage(
        message,
        state.currentSession.sessionId,
        state.userPreferences
      );

      // Convert response to ChatMessage and add to chat
      const botMessage = ChatbotService.convertToChatMessage(response);
      dispatch({ type: 'ADD_MESSAGE', payload: botMessage });

    } catch (error: unknown) {
      console.error('Error sending message:', error);
      const errorMessage = ChatbotService.formatErrorMessage(error as ApiError);
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
      dispatch({ type: 'SET_TYPING', payload: false });
    }
  };

  // Load chat history implementation - Added debounce to prevent multiple calls
  const loadChatHistory = async (): Promise<void> => {
    if (!state.currentSession) return;

    // Prevent multiple simultaneous calls
    if (state.currentSession.isLoading) return;

    // Kiểm tra xem user đã đăng nhập chưa
    const userString = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (!userString) {
      dispatch({ type: 'SET_ERROR', payload: 'Bạn cần đăng nhập để xem lịch sử chat' });
      return;
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      // Check if backend is available first
      const isBackendAvailable = await ChatbotService.checkApiStatus();
      if (!isBackendAvailable) {
        console.log('Backend API không khả dụng, sử dụng phiên chat offline');
        // Không cần throw error, chỉ tạo phiên chat mới và tiếp tục
        dispatch({ type: 'SET_MESSAGES', payload: [] });
        return;
      }

      const historyResponse = await ChatbotService.getChatHistory(
        state.currentSession.sessionId,
        1,
        50 // Load more messages for history
      );

      // Convert history messages to ChatMessage format - Fixed mapping
      const messages: ChatMessage[] = historyResponse.messages.map(msg => ({
        messageId: msg.messageId,
        role: msg.role,
        content: msg.content,
        type: msg.type as MessageType,
        recommendedProducts: msg.attachedProducts?.map((product: Record<string, unknown>) => ({
          id: (product.productId || product.id) as string,
          name: product.name as string,
          slug: (product.slug || '') as string,
          price: product.price as number,
          currentPrice: product.currentPrice as number | undefined,
          brand: product.brand as string,
          imageUrl: product.imageUrl as string | undefined,
          reason: (product.reason || '') as string,
        })),
        relatedCategories: msg.attachedCategories?.map((category: Record<string, unknown>) => ({
          id: (category.categoryId || category.id) as string,
          name: category.name as string,
          description: category.description as string,
          level: category.level as number,
        })),
        relatedBrands: msg.attachedBrands?.map((brand: Record<string, unknown>) => ({
          id: (brand.brandId || brand.id) as string,
          name: brand.name as string,
          description: brand.description as string,
          origin: brand.origin as string,
        })),
        relatedEvents: msg.attachedEvents?.map((event: Record<string, unknown>) => ({
          id: (event.eventId || event.id) as string,
          title: event.title as string,
          description: event.description as string,
          startDate: new Date(event.startDate as string),
          endDate: new Date(event.endDate as string),
          discountInfo: (event.description || '') as string,
          products: (event.products as Record<string, unknown>[])?.map((product: Record<string, unknown>) => ({
            productId: (product.productId || product.id) as string,
            productName: (product.name || product.productName) as string,
            adjustedPrice: product.adjustedPrice as number,
            originalPrice: product.originalPrice as number,
            image: (product.image || product.imageUrl || '') as string,
          })),
        })),
        relatedCampaigns: msg.attachedCampaigns?.map((campaign: Record<string, unknown>) => ({
          id: (campaign.campaignId || campaign.id) as string,
          title: campaign.title as string,
          description: campaign.description as string,
          type: campaign.type as string | undefined,
          startDate: new Date(campaign.startDate as string),
          endDate: new Date(campaign.endDate as string),
          products: (campaign.products as Record<string, unknown>[])?.map((product: Record<string, unknown>) => ({
            productId: (product.productId || product.id) as string,
            productName: (product.name || product.productName) as string,
            adjustedPrice: product.adjustedPrice as number,
            originalPrice: product.originalPrice as number,
            image: (product.image || product.imageUrl || '') as string,
          })),
        })),
        metadata: msg.metadata,
        isHelpful: msg.isHelpful,
        feedback: msg.feedback,
        createdAt: new Date(msg.createdAt),
      }));

      dispatch({ type: 'SET_MESSAGES', payload: messages });

    } catch (error: unknown) {
      console.error('Error loading chat history:', error);
      // Chỉ hiển thị lỗi nếu không phải lỗi 404 (session mới chưa có lịch sử) hoặc network error
      const errorObj = error as { response?: { status?: number }; code?: string; message?: string };
      if (errorObj.response?.status !== 404 &&
          errorObj.code !== 'ERR_NETWORK' &&
          !errorObj.message?.includes('Backend không khả dụng')) {
        const errorMessage = ChatbotService.formatErrorMessage(error as ApiError);
        dispatch({ type: 'SET_ERROR', payload: errorMessage });
      } else {
        // Nếu là lỗi network, backend không khả dụng hoặc phiên mới, chỉ tạo phiên chat trống
        dispatch({ type: 'SET_MESSAGES', payload: [] });
      }
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Provide feedback implementation
  const provideFeedback = async (
    messageId: string,
    isHelpful: boolean,
    feedback?: string
  ): Promise<void> => {
    try {
      await ChatbotService.provideFeedback(messageId, isHelpful, feedback);

      // Update the message in current session
      if (state.currentSession) {
        const updatedMessages = state.currentSession.messages.map(msg =>
          msg.messageId === messageId
            ? { ...msg, isHelpful, feedback }
            : msg
        );
        dispatch({ type: 'SET_MESSAGES', payload: updatedMessages });
      }

    } catch (error: unknown) {
      console.error('Error providing feedback:', error);
      const errorMessage = ChatbotService.formatErrorMessage(error as ApiError);
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }
  };

  const value: ChatbotContextType = {
    state,
    dispatch,
    toggleChat,
    openChat,
    closeChat,
    sendMessage,
    loadChatHistory,
    createNewSession,
    updateUserPreferences,
    provideFeedback,
    clearError,
    loadFromStorage,
    clearAllData,
  };

  return (
    <ChatbotContext.Provider value={value}>
      {children}
    </ChatbotContext.Provider>
  );
}

// Hook
export function useChatbot() {
  const context = useContext(ChatbotContext);
  if (context === undefined) {
    throw new Error('useChatbot must be used within a ChatbotProvider');
  }
  return context;
} 