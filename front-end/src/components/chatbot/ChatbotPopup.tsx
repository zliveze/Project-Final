import React, { useState, useRef, useEffect } from 'react';
import { useChatbot } from '@/contexts/chatbot/ChatbotContext';
import { UserPreferences } from '@/contexts/chatbot/ChatbotContext';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import ProductRecommendation from './ProductRecommendation';
import TypingIndicator from './TypingIndicator';
import ChatStatus from './ChatStatus';
import {
  MessageCircle,
  X,
  Minimize2,
  Settings,
  AlertCircle,
  Sparkles,
  Trash2,
  Save,
  Plus,
  RotateCcw
} from 'lucide-react';

interface ChatbotPopupProps {
  className?: string;
}

export default function ChatbotPopup({ className = '' }: ChatbotPopupProps) {
  const { state, toggleChat, closeChat, sendMessage, loadChatHistory, clearError, clearAllData, updateUserPreferences, createNewSession } = useChatbot();
  const [isMinimized, setIsMinimized] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // State cho settings form
  const [settingsForm, setSettingsForm] = useState<UserPreferences>({
    skinType: '',
    concerns: [],
    budget: undefined,
    preferredBrands: []
  });
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  // Load user preferences vào form khi mở settings
  useEffect(() => {
    if (showSettings) {
      setSettingsForm({
        skinType: state.userPreferences.skinType || '',
        concerns: state.userPreferences.concerns || [],
        budget: state.userPreferences.budget || undefined,
        preferredBrands: state.userPreferences.preferredBrands || []
      });
    }
  }, [showSettings, state.userPreferences]);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [state.currentSession?.messages]);

  // Load chat history when chat opens
  useEffect(() => {
    if (state.isOpen && state.currentSession && state.currentSession.messages.length === 0) {
      loadChatHistory();
    }
  }, [state.isOpen, state.currentSession, loadChatHistory]);
  
  // Hiển thị lỗi ngay cả khi không có session
  const chatError = state.currentSession?.error || null;

  // Handle animation when opening/closing
  useEffect(() => {
    if (state.isOpen) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timer);
    }
  }, [state.isOpen]);

  // Đảm bảo có session khi mở chatbot
  useEffect(() => {
    if (state.isOpen && state.isInitialized && !state.currentSession) {
      // Kiểm tra xem user đã đăng nhập chưa
      const userString = localStorage.getItem('user') || sessionStorage.getItem('user');
      if (userString) {
        createNewSession();
      }
    }
  }, [state.isOpen, state.isInitialized, state.currentSession, createNewSession]);

  const handleSendMessage = async (message: string) => {
    await sendMessage(message);
  };

  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const handleClearHistory = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử chat? Hành động này không thể hoàn tác.')) {
      clearAllData();
      setShowSettings(false);
    }
  };

  const handleNewChat = () => {
    if (state.currentSession?.messages && state.currentSession.messages.length > 0) {
      if (window.confirm('Bạn có muốn tạo đoạn chat mới? Đoạn chat hiện tại sẽ được lưu lại.')) {
        createNewSession();
      }
    } else {
      createNewSession();
    }
  };

  const handleClearCurrentSession = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa lịch sử đoạn chat hiện tại? Hành động này không thể hoàn tác.')) {
      if (state.currentSession) {
        // Tạo session mới để thay thế session hiện tại
        createNewSession();
      }
    }
  };

  // Handlers cho settings form
  const handleSkinTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSettingsForm(prev => ({
      ...prev,
      skinType: event.target.value
    }));
  };

  const handleBudgetChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSettingsForm(prev => ({
      ...prev,
      budget: value ? parseInt(value) : undefined
    }));
  };

  const handleSaveSettings = () => {
    // Lưu settings vào context
    updateUserPreferences(settingsForm);

    // Hiển thị thông báo thành công
    setShowSaveSuccess(true);
    setTimeout(() => {
      setShowSaveSuccess(false);
      setShowSettings(false);
    }, 1500);

    console.log('Cài đặt đã được lưu:', settingsForm);
  };

  const renderWelcomeMessage = () => (
    <div className="flex flex-col items-center justify-center p-4 text-center animate-fade-in">
      <div className="w-14 h-14 bg-pink-500 rounded-full flex items-center justify-center mb-3 animate-bounce-gentle">
        <Sparkles className="w-7 h-7 text-white animate-pulse" />
      </div>
      <h3 className="text-base font-semibold text-gray-800 mb-2 animate-slide-up">
        Chào mừng đến với Yumin AI Assistant!
      </h3>
      <p className="text-sm text-gray-600 mb-4 animate-slide-up leading-relaxed" style={{ animationDelay: '0.1s' }}>
        Tôi có thể giúp bạn tìm kiếm sản phẩm mỹ phẩm phù hợp, tư vấn về chăm sóc da và trả lời các câu hỏi về sản phẩm.
      </p>
      <div className="grid grid-cols-1 gap-2 w-full max-w-xs animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <button
          onClick={() => handleSendMessage('Tôi có da dầu, bạn có thể gợi ý sản phẩm nào?')}
          className="text-xs bg-gray-50 hover:bg-gray-100 text-gray-700 px-3 py-2 rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-md border border-gray-200"
        >
          💧 Tư vấn cho da dầu
        </button>
        <button
          onClick={() => handleSendMessage('Sản phẩm nào tốt cho da khô?')}
          className="text-xs bg-gray-50 hover:bg-gray-100 text-gray-700 px-3 py-2 rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-md border border-gray-200"
        >
          🌸 Chăm sóc da khô
        </button>
        <button
          onClick={() => handleSendMessage('Gợi ý serum vitamin C tốt nhất')}
          className="text-xs bg-gray-50 hover:bg-gray-100 text-gray-700 px-3 py-2 rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-md border border-gray-200"
        >
          ✨ Serum Vitamin C
        </button>
      </div>
    </div>
  );

  const renderError = () => (
    <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg m-3 animate-shake">
      <div className="flex items-center flex-1">
        <AlertCircle className="w-4 h-4 text-red-500 mr-2 animate-pulse flex-shrink-0" />
        <span className="text-sm text-red-700 break-words">{state.currentSession?.error || chatError}</span>
      </div>
      <button
        onClick={clearError}
        className="text-red-500 hover:text-red-700 transition-colors hover:scale-110 ml-2 flex-shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );

  if (!state.isOpen) {
    return (
      <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
        <button
          onClick={toggleChat}
          className="w-14 h-14 bg-pink-500 hover:bg-pink-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group animate-float"
          aria-label="Mở chat AI"
        >
          <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform duration-200" />
          <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
        </button>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 ${className}`}>
      <div className={`bg-white rounded-2xl shadow-2xl border border-gray-200 transition-all duration-300 ${
        isMinimized
          ? 'w-72 md:w-80 h-16'
          : 'w-[90vw] max-w-sm md:w-96 h-[85vh] max-h-[600px] md:h-[600px]'
      } ${isAnimating ? 'animate-scale-in' : ''}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-pink-500 text-white rounded-t-2xl">
          <div className="flex items-center">
            <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center mr-2 animate-pulse-gentle">
              <Sparkles className="w-3 h-3" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Yumin AI Assistant</h3>
              <p className="text-xs opacity-90">
                {state.currentSession?.isTyping ? (
                  <span className="animate-pulse">Đang trả lời...</span>
                ) : (
                  'Sẵn sàng hỗ trợ'
                )}
              </p>
            </div>
          </div>

          {/* Chat Controls - Đưa ra ngoài header */}
          <div className="flex items-center space-x-1">
            {/* New Chat Button */}
            <button
              onClick={handleNewChat}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-all duration-200 hover:scale-110"
              title="Tạo đoạn chat mới"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>

            {/* Clear Current Chat Button */}
            <button
              onClick={handleClearCurrentSession}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-all duration-200 hover:scale-110"
              title="Xóa đoạn chat hiện tại"
              disabled={!state.currentSession?.messages.length}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Settings Button */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-all duration-200 hover:scale-110"
              title="Cài đặt"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>

            {/* Minimize Button */}
            <button
              onClick={handleMinimize}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-all duration-200 hover:scale-110"
              title={isMinimized ? 'Mở rộng' : 'Thu nhỏ'}
            >
              <Minimize2 className="w-3.5 h-3.5" />
            </button>

            {/* Close Button */}
            <button
              onClick={closeChat}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-all duration-200 hover:scale-110"
              title="Đóng"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages Container */}
            <div
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50"
              style={{ height: 'calc(100% - 140px)' }}
            >
              {(state.currentSession?.error || chatError) && renderError()}

              {/* Hiển thị thông báo đăng nhập nếu chưa đăng nhập */}
              {!localStorage.getItem('user') && !sessionStorage.getItem('user') && (
                <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg m-3">
                  <div className="flex items-center flex-1">
                    <AlertCircle className="w-4 h-4 text-yellow-500 mr-2 flex-shrink-0" />
                    <span className="text-sm text-yellow-700 break-words">
                      Bạn cần đăng nhập để sử dụng chatbot
                    </span>
                  </div>
                </div>
              )}

              {/* Chat Status Indicator */}
              {state.currentSession && state.currentSession.messages.length > 0 && (
                <ChatStatus
                  messageCount={state.currentSession.messages.length}
                  isTyping={state.currentSession.isTyping}
                  lastMessageTime={state.currentSession.messages[state.currentSession.messages.length - 1]?.createdAt}
                  className="mb-2"
                />
              )}

              {state.currentSession?.messages.length === 0 && !state.currentSession?.isLoading ? (
                renderWelcomeMessage()
              ) : (
                <>
                  {state.currentSession?.messages.map((message, index) => (
                    <div
                      key={message.messageId}
                      className="animate-slide-in-message"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <ChatMessage message={message} />
                      {message.recommendedProducts && message.recommendedProducts.length > 0 && (
                        <div className="animate-slide-in-products" style={{ animationDelay: `${(index * 0.1) + 0.2}s` }}>
                          <ProductRecommendation products={message.recommendedProducts} />
                        </div>
                      )}
                    </div>
                  ))}

                  {state.currentSession?.isTyping && (
                    <div className="animate-fade-in">
                      <TypingIndicator />
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input Container */}
            <div 
              className="border-t border-gray-200 p-3 bg-white rounded-b-2xl"
              onClick={() => {
                // Focus vào input khi click vào container
                const inputElement = document.querySelector('.chatbot-textarea');
                if (inputElement instanceof HTMLTextAreaElement) {
                  inputElement.focus();
                }
              }}
            >
              <ChatInput
                onSendMessage={handleSendMessage}
                disabled={state.currentSession?.isLoading || state.currentSession?.isTyping}
                placeholder="Nhập câu hỏi về mỹ phẩm..."
              />
            </div>
          </>
        )}
      </div>

      {/* Settings Panel - Đơn giản hóa */}
      {showSettings && !isMinimized && (
        <div className="absolute bottom-full right-0 mb-2 w-72 md:w-80 bg-white rounded-lg shadow-lg border border-gray-200 animate-slide-down max-h-96 overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-gray-100 sticky top-0 bg-white rounded-t-lg">
            <h4 className="font-semibold text-gray-800 flex items-center text-sm">
              <Settings className="w-4 h-4 mr-2" />
              Cài đặt tùy chọn
            </h4>
            <button
              onClick={() => setShowSettings(false)}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            {/* Hiển thị cài đặt hiện tại */}
            {(state.userPreferences.skinType || state.userPreferences.budget) && (
              <div className="bg-pink-50 border border-pink-200 rounded-lg p-3">
                <p className="text-pink-700 font-medium text-sm mb-2">Cài đặt hiện tại:</p>
                {state.userPreferences.skinType && (
                  <p className="text-pink-600 text-xs">• Loại da: {state.userPreferences.skinType}</p>
                )}
                {state.userPreferences.budget && (
                  <p className="text-pink-600 text-xs">• Ngân sách: {state.userPreferences.budget.toLocaleString('vi-VN')} VNĐ</p>
                )}
              </div>
            )}

            {/* Form cài đặt */}
            <div className="space-y-3">
              <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Loại da
                </label>
                <select
                  value={settingsForm.skinType || ''}
                  onChange={handleSkinTypeChange}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm transition-all duration-200 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  <option value="">Chọn loại da</option>
                  <option value="da-dau">Da dầu</option>
                  <option value="da-kho">Da khô</option>
                  <option value="da-hon-hop">Da hỗn hợp</option>
                  <option value="da-nhay-cam">Da nhạy cảm</option>
                  <option value="da-thuong">Da thường</option>
                </select>
              </div>

              <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ngân sách (VNĐ)
                </label>
                <input
                  type="number"
                  value={settingsForm.budget || ''}
                  onChange={handleBudgetChange}
                  placeholder="Ví dụ: 500000"
                  min="0"
                  step="10000"
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm transition-all duration-200 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Để trống nếu không có giới hạn ngân sách
                </p>
              </div>
            </div>

            {/* Thông báo thành công */}
            {showSaveSuccess && (
              <div className="animate-slide-up bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center mr-2">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <span className="text-sm text-green-700 font-medium">
                    Cài đặt đã được lưu thành công!
                  </span>
                </div>
              </div>
            )}

            {/* Nút hành động */}
            <div className="border-t border-gray-200 pt-3 mt-4">
              <div className="grid grid-cols-3 gap-2 animate-slide-up" style={{ animationDelay: '0.3s' }}>
                <button
                  onClick={handleSaveSettings}
                  disabled={showSaveSuccess}
                  className={`col-span-2 py-2 px-3 rounded-lg text-xs transition-all duration-200 hover:scale-105 hover:shadow-md flex items-center justify-center ${
                    showSaveSuccess
                      ? 'bg-green-500 text-white cursor-not-allowed'
                      : 'bg-pink-500 hover:bg-pink-600 text-white'
                  }`}
                >
                  <Save className="w-3 h-3 mr-1" />
                  {showSaveSuccess ? 'Đã lưu!' : 'Lưu cài đặt'}
                </button>
                <button
                  onClick={handleClearHistory}
                  className="py-2 px-3 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs transition-all duration-200 hover:scale-105 hover:shadow-md flex items-center justify-center"
                  title="Xóa toàn bộ lịch sử chat"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        
        @keyframes scale-in {
          0% { transform: scale(0.8); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        
        @keyframes fade-in {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        
        @keyframes slide-up {
          0% { transform: translateY(20px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        
        @keyframes slide-down {
          0% { transform: translateY(-20px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        
        @keyframes slide-in-message {
          0% { transform: translateX(-20px); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slide-in-products {
          0% { transform: translateY(20px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        
        @keyframes bounce-gentle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes pulse-gentle {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
        
        .animate-slide-up {
          animation: slide-up 0.5s ease-out;
        }
        
        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
        
        .animate-slide-in-message {
          animation: slide-in-message 0.4s ease-out;
        }
        
        .animate-slide-in-products {
          animation: slide-in-products 0.4s ease-out;
        }
        
        .animate-bounce-gentle {
          animation: bounce-gentle 2s ease-in-out infinite;
        }
        
        .animate-pulse-gentle {
          animation: pulse-gentle 2s ease-in-out infinite;
        }
        
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}
