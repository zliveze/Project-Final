import { ChatMessage, ChatSession, UserPreferences } from '@/contexts/chatbot/ChatbotContext';

interface StoredChatData {
  currentSession: ChatSession | null;
  sessions: ChatSession[];
  userPreferences: UserPreferences;
  lastUpdated: number;
}

class ChatbotStorageService {
  private static readonly STORAGE_KEY = 'yumin_chatbot_data';
  private static readonly STORAGE_VERSION = '1.0';
  private static readonly MAX_SESSIONS = 5; // Giới hạn số session để tránh localStorage quá lớn
  private static readonly MAX_MESSAGES_PER_SESSION = 50; // Giới hạn số tin nhắn mỗi session
  private static readonly STORAGE_EXPIRY_DAYS = 7; // Dữ liệu hết hạn sau 7 ngày

  /**
   * Lưu dữ liệu chatbot vào localStorage
   */
  static saveChatbotData(
    currentSession: ChatSession | null,
    sessions: ChatSession[],
    userPreferences: UserPreferences
  ): void {
    try {
      // Lấy userId để tạo key riêng cho từng user
      const userId = this.getCurrentUserId();
      if (!userId) {
        console.log('No user logged in, skipping chatbot data save');
        return;
      }

      // Làm sạch dữ liệu trước khi lưu
      const cleanedSessions = this.cleanSessions(sessions);
      const cleanedCurrentSession = currentSession ? this.cleanSession(currentSession) : null;

      const dataToStore: StoredChatData = {
        currentSession: cleanedCurrentSession,
        sessions: cleanedSessions,
        userPreferences,
        lastUpdated: Date.now(),
      };

      const storageKey = `${this.STORAGE_KEY}_${userId}`;
      localStorage.setItem(storageKey, JSON.stringify(dataToStore));
      
      console.log(`Chatbot data saved for user ${userId}`);
    } catch (error) {
      console.error('Error saving chatbot data to localStorage:', error);
      // Nếu localStorage đầy, thử xóa dữ liệu cũ
      this.clearExpiredData();
    }
  }

  /**
   * Tải dữ liệu chatbot từ localStorage
   */
  static loadChatbotData(): {
    currentSession: ChatSession | null;
    sessions: ChatSession[];
    userPreferences: UserPreferences;
  } | null {
    try {
      const userId = this.getCurrentUserId();
      if (!userId) {
        console.log('No user logged in, cannot load chatbot data');
        return null;
      }

      const storageKey = `${this.STORAGE_KEY}_${userId}`;
      const storedData = localStorage.getItem(storageKey);
      
      if (!storedData) {
        console.log('No stored chatbot data found');
        return null;
      }

      const parsedData: StoredChatData = JSON.parse(storedData);
      
      // Kiểm tra xem dữ liệu có hết hạn không
      const daysSinceUpdate = (Date.now() - parsedData.lastUpdated) / (1000 * 60 * 60 * 24);
      if (daysSinceUpdate > this.STORAGE_EXPIRY_DAYS) {
        console.log('Stored chatbot data expired, clearing...');
        this.clearChatbotData();
        return null;
      }

      // Khôi phục Date objects
      const restoredData = this.restoreDateObjects(parsedData);
      
      console.log(`Chatbot data loaded for user ${userId}`);
      return {
        currentSession: restoredData.currentSession,
        sessions: restoredData.sessions,
        userPreferences: restoredData.userPreferences,
      };
    } catch (error) {
      console.error('Error loading chatbot data from localStorage:', error);
      // Nếu có lỗi parse, xóa dữ liệu lỗi
      this.clearChatbotData();
      return null;
    }
  }

  /**
   * Xóa dữ liệu chatbot của user hiện tại
   */
  static clearChatbotData(): void {
    try {
      const userId = this.getCurrentUserId();
      if (!userId) return;

      const storageKey = `${this.STORAGE_KEY}_${userId}`;
      localStorage.removeItem(storageKey);
      console.log(`Chatbot data cleared for user ${userId}`);
    } catch (error) {
      console.error('Error clearing chatbot data:', error);
    }
  }

  /**
   * Xóa dữ liệu hết hạn của tất cả users
   */
  static clearExpiredData(): void {
    try {
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.STORAGE_KEY)) {
          try {
            const data = JSON.parse(localStorage.getItem(key) || '{}');
            const daysSinceUpdate = (Date.now() - data.lastUpdated) / (1000 * 60 * 60 * 24);
            
            if (daysSinceUpdate > this.STORAGE_EXPIRY_DAYS) {
              keysToRemove.push(key);
            }
          } catch {
            // Nếu không parse được, cũng xóa luôn
            keysToRemove.push(key);
          }
        }
      }

      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      if (keysToRemove.length > 0) {
        console.log(`Cleared ${keysToRemove.length} expired chatbot data entries`);
      }
    } catch (error) {
      console.error('Error clearing expired data:', error);
    }
  }

  /**
   * Lấy userId hiện tại
   */
  private static getCurrentUserId(): string | null {
    try {
      const userString = localStorage.getItem('user') || sessionStorage.getItem('user');
      if (!userString) return null;
      
      const user = JSON.parse(userString);
      return user.id || user._id || null;
    } catch {
      return null;
    }
  }

  /**
   * Làm sạch sessions (giới hạn số lượng và tin nhắn)
   */
  private static cleanSessions(sessions: ChatSession[]): ChatSession[] {
    return sessions
      .slice(-this.MAX_SESSIONS) // Chỉ giữ lại sessions gần nhất
      .map(session => this.cleanSession(session));
  }

  /**
   * Làm sạch một session (giới hạn số tin nhắn)
   */
  private static cleanSession(session: ChatSession): ChatSession {
    return {
      ...session,
      messages: session.messages.slice(-this.MAX_MESSAGES_PER_SESSION), // Chỉ giữ lại tin nhắn gần nhất
    };
  }

  /**
   * Khôi phục Date objects từ JSON
   */
  private static restoreDateObjects(data: StoredChatData): StoredChatData {
    const restoreMessageDates = (messages: ChatMessage[]): ChatMessage[] => {
      return messages.map(msg => ({
        ...msg,
        createdAt: new Date(msg.createdAt),
        relatedEvents: msg.relatedEvents?.map(event => ({
          ...event,
          startDate: new Date(event.startDate),
          endDate: new Date(event.endDate),
        })),
        relatedCampaigns: msg.relatedCampaigns?.map(campaign => ({
          ...campaign,
          startDate: new Date(campaign.startDate),
          endDate: new Date(campaign.endDate),
        })),
      }));
    };

    return {
      ...data,
      currentSession: data.currentSession ? {
        ...data.currentSession,
        messages: restoreMessageDates(data.currentSession.messages),
      } : null,
      sessions: data.sessions.map(session => ({
        ...session,
        messages: restoreMessageDates(session.messages),
      })),
    };
  }

  /**
   * Kiểm tra localStorage có khả dụng không
   */
  static isStorageAvailable(): boolean {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Lấy kích thước dữ liệu chatbot hiện tại (KB)
   */
  static getStorageSize(): number {
    try {
      const userId = this.getCurrentUserId();
      if (!userId) return 0;

      const storageKey = `${this.STORAGE_KEY}_${userId}`;
      const data = localStorage.getItem(storageKey);
      
      return data ? new Blob([data]).size / 1024 : 0;
    } catch {
      return 0;
    }
  }
}

export default ChatbotStorageService;
