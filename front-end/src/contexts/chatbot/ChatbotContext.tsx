import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { ChatbotService } from '@/services/chatbotService';
import type { GetHistoryResponse } from '@/services/chatbotService';
import ChatbotStorageService from '@/services/chatbotStorageService';

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
      return {
        ...state,
        currentSession: state.currentSession
          ? { ...state.currentSession, error: action.payload }
          : null,
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
  const openChat = () => dispatch({ type: 'OPEN_CHAT' });
  const closeChat = () => dispatch({ type: 'CLOSE_CHAT' });
  const clearError = () => dispatch({ type: 'CLEAR_ERROR' });

  const createNewSession = () => {
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
  }, []); // Run only once on mount

  // Initialize chatbot when first opened - Fixed to prevent multiple session creation
  useEffect(() => {
    if (state.isOpen && state.isInitialized && !state.currentSession) {
      createNewSession();
    }
  }, [state.isOpen, state.isInitialized]); // Removed state.currentSession dependency

  // Send message implementation
  const sendMessage = async (message: string): Promise<void> => {
    if (!state.currentSession) {
      createNewSession();
      // Wait for next tick to ensure session is created
      await new Promise(resolve => setTimeout(resolve, 0));
      if (!state.currentSession) {
        throw new Error('Không thể tạo phiên chat. Vui lòng thử lại.');
      }
    }

    try {
      // Validate message
      if (!ChatbotService.validateMessage(message)) {
        throw new Error('Tin nhắn không hợp lệ. Vui lòng nhập từ 1-1000 ký tự.');
      }

      // Kiểm tra xem user đã đăng nhập chưa
      const userString = localStorage.getItem('user') || sessionStorage.getItem('user');
      if (!userString) {
        const errorMessage = 'Bạn cần đăng nhập để sử dụng chatbot';
        dispatch({ type: 'SET_ERROR', payload: errorMessage });
        return;
      }

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

    } catch (error: any) {
      console.error('Error sending message:', error);
      const errorMessage = ChatbotService.formatErrorMessage(error);
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
        recommendedProducts: msg.attachedProducts?.map((product: any) => ({
          id: product.productId || product.id,
          name: product.name,
          slug: product.slug || '',
          price: product.price,
          currentPrice: product.currentPrice,
          brand: product.brand,
          imageUrl: product.imageUrl,
          reason: product.reason || '',
        })),
        relatedCategories: msg.attachedCategories?.map((category: any) => ({
          id: category.categoryId || category.id,
          name: category.name,
          description: category.description,
          level: category.level,
        })),
        relatedBrands: msg.attachedBrands?.map((brand: any) => ({
          id: brand.brandId || brand.id,
          name: brand.name,
          description: brand.description,
          origin: brand.origin,
        })),
        relatedEvents: msg.attachedEvents?.map((event: any) => ({
          id: event.eventId || event.id,
          title: event.title,
          description: event.description,
          startDate: new Date(event.startDate),
          endDate: new Date(event.endDate),
          discountInfo: event.description || '',
          products: event.products?.map((product: any) => ({
            productId: product.productId || product.id,
            productName: product.name || product.productName,
            adjustedPrice: product.adjustedPrice,
            originalPrice: product.originalPrice,
            image: product.image || product.imageUrl || '',
          })),
        })),
        relatedCampaigns: msg.attachedCampaigns?.map((campaign: any) => ({
          id: campaign.campaignId || campaign.id,
          title: campaign.title,
          description: campaign.description,
          type: campaign.type,
          startDate: new Date(campaign.startDate),
          endDate: new Date(campaign.endDate),
          products: campaign.products?.map((product: any) => ({
            productId: product.productId || product.id,
            productName: product.name || product.productName,
            adjustedPrice: product.adjustedPrice,
            originalPrice: product.originalPrice,
            image: product.image || product.imageUrl || '',
          })),
        })),
        metadata: msg.metadata,
        isHelpful: msg.isHelpful,
        feedback: msg.feedback,
        createdAt: new Date(msg.createdAt),
      }));

      dispatch({ type: 'SET_MESSAGES', payload: messages });

    } catch (error: any) {
      console.error('Error loading chat history:', error);
      // Chỉ hiển thị lỗi nếu không phải lỗi 404 (session mới chưa có lịch sử) hoặc network error
      if (error.response?.status !== 404 &&
          error.code !== 'ERR_NETWORK' &&
          !error.message.includes('Backend không khả dụng')) {
        const errorMessage = ChatbotService.formatErrorMessage(error);
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

    } catch (error: any) {
      console.error('Error providing feedback:', error);
      const errorMessage = ChatbotService.formatErrorMessage(error);
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