import React, { useState, useRef, useEffect } from 'react';
import { useChatbot } from '@/contexts/chatbot/ChatbotContext';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import ProductRecommendation from './ProductRecommendation';
import TypingIndicator from './TypingIndicator';
import { 
  MessageCircle, 
  X, 
  Minimize2, 
  RefreshCw, 
  Settings,
  AlertCircle,
  Sparkles
} from 'lucide-react';

interface ChatbotPopupProps {
  className?: string;
}

export default function ChatbotPopup({ className = '' }: ChatbotPopupProps) {
  const { state, toggleChat, closeChat, sendMessage, loadChatHistory, clearError } = useChatbot();
  const [isMinimized, setIsMinimized] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [state.currentSession?.messages]);

  // Load chat history when chat opens - Fixed dependency to prevent infinite loop
  useEffect(() => {
    if (state.isOpen && state.currentSession && state.currentSession.messages.length === 0) {
      loadChatHistory();
    }
  }, [state.isOpen, state.currentSession?.sessionId]); // Only depend on sessionId, not entire currentSession object

  // Handle animation when opening/closing
  useEffect(() => {
    if (state.isOpen) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timer);
    }
  }, [state.isOpen]);

  const handleSendMessage = async (message: string) => {
    await sendMessage(message);
  };

  const handleRefresh = () => {
    if (state.currentSession) {
      loadChatHistory();
    }
  };

  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const renderWelcomeMessage = () => (
    <div className="flex flex-col items-center justify-center p-6 text-center animate-fade-in">
      <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center mb-4 animate-bounce-gentle">
        <Sparkles className="w-8 h-8 text-white animate-pulse" />
      </div>
      <h3 className="text-lg font-semibold text-gray-800 mb-2 animate-slide-up">
        Chào mừng đến với Yumin AI Assistant! 
      </h3>
      <p className="text-sm text-gray-600 mb-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        Tôi có thể giúp bạn tìm kiếm sản phẩm mỹ phẩm phù hợp, tư vấn về chăm sóc da và trả lời các câu hỏi về sản phẩm.
      </p>
      <div className="grid grid-cols-1 gap-2 w-full max-w-xs animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <button
          onClick={() => handleSendMessage('Tôi có da dầu, bạn có thể gợi ý sản phẩm nào?')}
          className="text-xs bg-pink-50 hover:bg-pink-100 text-pink-700 px-3 py-2 rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-md"
        >
          💧 Tư vấn cho da dầu
        </button>
        <button
          onClick={() => handleSendMessage('Sản phẩm nào tốt cho da khô?')}
          className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-md"
        >
          🌸 Chăm sóc da khô
        </button>
        <button
          onClick={() => handleSendMessage('Gợi ý serum vitamin C tốt nhất')}
          className="text-xs bg-yellow-50 hover:bg-yellow-100 text-yellow-700 px-3 py-2 rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-md"
        >
          ✨ Serum Vitamin C
        </button>
      </div>
    </div>
  );

  const renderError = () => (
    <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg m-3 animate-shake">
      <div className="flex items-center">
        <AlertCircle className="w-4 h-4 text-red-500 mr-2 animate-pulse" />
        <span className="text-sm text-red-700">{state.currentSession?.error}</span>
      </div>
      <button
        onClick={clearError}
        className="text-red-500 hover:text-red-700 transition-colors hover:scale-110"
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
          className="w-14 h-14 bg-gradient-to-br from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group animate-float"
          aria-label="Mở chat AI"
        >
          <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform duration-200" />
          <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
        </button>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
      <div className={`bg-white rounded-2xl shadow-2xl border border-gray-200 transition-all duration-300 ${
        isMinimized ? 'w-80 h-16' : 'w-96 h-[600px]'
      } ${isAnimating ? 'animate-scale-in' : ''}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-t-2xl">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center mr-3 animate-pulse-gentle">
              <Sparkles className="w-4 h-4" />
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
          <div className="flex items-center space-x-2">
            <button
              onClick={handleRefresh}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-all duration-200 hover:scale-110"
              disabled={state.currentSession?.isLoading}
              title="Làm mới"
            >
              <RefreshCw className={`w-4 h-4 transition-transform duration-500 ${state.currentSession?.isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-all duration-200 hover:scale-110"
              title="Cài đặt"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={handleMinimize}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-all duration-200 hover:scale-110"
              title={isMinimized ? 'Mở rộng' : 'Thu nhỏ'}
            >
              <Minimize2 className="w-4 h-4" />
            </button>
            <button
              onClick={closeChat}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-all duration-200 hover:scale-110"
              title="Đóng"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages Container */}
            <div 
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 h-[440px] bg-gray-50"
            >
              {state.currentSession?.error && renderError()}
              
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
            <div className="border-t border-gray-200 p-4 bg-white rounded-b-2xl">
              <ChatInput
                onSendMessage={handleSendMessage}
                disabled={state.currentSession?.isLoading || state.currentSession?.isTyping}
                placeholder="Nhập câu hỏi về mỹ phẩm..."
              />
            </div>
          </>
        )}
      </div>

      {/* Settings Panel */}
      {showSettings && !isMinimized && (
        <div className="absolute bottom-full right-0 mb-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 p-4 animate-slide-down">
          <h4 className="font-semibold text-gray-800 mb-3">Cài đặt tùy chọn</h4>
          <div className="space-y-3">
            <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Loại da
              </label>
              <select className="w-full p-2 border border-gray-300 rounded-lg text-sm transition-all duration-200 focus:ring-2 focus:ring-pink-500 focus:border-transparent">
                <option value="">Chọn loại da</option>
                <option value="da-dau">Da dầu</option>
                <option value="da-kho">Da khô</option>
                <option value="da-hon-hop">Da hỗn hợp</option>
                <option value="da-nhay-cam">Da nhạy cảm</option>
              </select>
            </div>
            <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ngân sách (VNĐ)
              </label>
              <input
                type="number"
                placeholder="Ví dụ: 500000"
                className="w-full p-2 border border-gray-300 rounded-lg text-sm transition-all duration-200 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowSettings(false)}
              className="w-full bg-pink-500 hover:bg-pink-600 text-white py-2 rounded-lg text-sm transition-all duration-200 hover:scale-105 hover:shadow-md animate-slide-up"
              style={{ animationDelay: '0.3s' }}
            >
              Lưu cài đặt
            </button>
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