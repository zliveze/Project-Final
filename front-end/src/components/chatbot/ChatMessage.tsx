import React, { useState } from 'react';
import { ChatMessage as ChatMessageType } from '@/contexts/chatbot/ChatbotContext';
import { useChatbot } from '@/contexts/chatbot/ChatbotContext';
import { User, Bot, ThumbsUp, ThumbsDown, Copy, Check, MoreHorizontal } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import ProductRecommendation from './ProductRecommendation';
import EventInfo from './EventInfo';
import ReactMarkdown from 'react-markdown';

interface ChatMessageProps {
  message: ChatMessageType;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const { provideFeedback } = useChatbot();
  const [copied, setCopied] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState(!!message.isHelpful);
  const [isHelpful, setIsHelpful] = useState(message.isHelpful);
  const [showOptions, setShowOptions] = useState(false);
  const [feedbackText, setFeedbackText] = useState(message.feedback || '');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  const isUser = message.role === 'user';
  const isBot = message.role === 'assistant';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  const handleFeedback = async (helpful: boolean) => {
    try {
      setIsSubmittingFeedback(true);
      await provideFeedback(message.messageId, helpful, feedbackText);
      setFeedbackGiven(true);
      setIsHelpful(helpful);
      setShowOptions(false);
    } catch (error) {
      console.error('Error providing feedback:', error);
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const formatTime = (date: Date) => {
    return format(date, 'HH:mm', { locale: vi });
  };

  // Get message type indicator
  const getMessageTypeIndicator = () => {
    switch (message.type) {
      case 'PRODUCT_RECOMMENDATION':
        return '🛍️';
      case 'SEARCH_RESULT':
        return '🔍';
      case 'CATEGORY_INFO':
        return '📂';
      case 'BRAND_INFO':
        return '🏷️';
      case 'EVENT_INFO':
        return '🎉';
      case 'ERROR':
        return '⚠️';
      default:
        return '';
    }
  };

  // Kiểm tra xem có hiển thị ProductRecommendation không
  const showProductRecommendation = message.recommendedProducts && message.recommendedProducts.length > 0;
  
  // Kiểm tra xem có hiển thị EventInfo không
  const showEventInfo = 
    (message.relatedEvents && message.relatedEvents.length > 0) ||
    (message.relatedCampaigns && message.relatedCampaigns.length > 0);

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3 md:mb-4`}>
      <div className={`flex max-w-[85%] md:max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 ${isUser ? 'ml-2 md:ml-3' : 'mr-2 md:mr-3'}`}>
          <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center ${
            isUser
              ? 'bg-pink-500 text-white'
              : 'bg-purple-500 text-white'
          }`}>
            {isUser ? <User className="w-3 h-3 md:w-4 md:h-4" /> : <Bot className="w-3 h-3 md:w-4 md:h-4" />}
          </div>
        </div>

        {/* Message Content */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          {/* Message Bubble */}
          <div className={`relative px-3 py-2 md:px-4 md:py-3 rounded-2xl max-w-full ${
            isUser
              ? 'bg-pink-500 text-white rounded-br-md'
              : 'bg-white text-gray-800 border border-gray-200 rounded-bl-md shadow-sm'
          }`}>
            
            {/* Message Type Indicator for bot messages */}
            {isBot && message.type !== 'TEXT' && (
              <div className="flex items-center mb-2 text-xs text-gray-500">
                <span className="mr-1">{getMessageTypeIndicator()}</span>
                <span className="capitalize">{message.type.replace('_', ' ').toLowerCase()}</span>
              </div>
            )}

            {/* Message Text */}
            <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
              {message.role === 'assistant' ? (
                <div className="whitespace-pre-wrap markdown-content">
                  <ReactMarkdown
                    components={{
                      p: ({ node, ...props }: any) => <p className="mb-2" {...props} />,
                      ul: ({ node, ...props }: any) => <ul className="list-disc ml-5 mb-2" {...props} />,
                      ol: ({ node, ...props }: any) => <ol className="list-decimal ml-5 mb-2" {...props} />,
                      li: ({ node, ...props }: any) => <li className="mb-1" {...props} />,
                      a: ({ node, ...props }: any) => <a className="text-blue-500 underline" {...props} />,
                      strong: ({ node, ...props }: any) => <strong className="font-bold" {...props} />,
                      em: ({ node, ...props }: any) => <em className="italic" {...props} />,
                      h1: ({ node, ...props }: any) => <h1 className="text-xl font-bold mb-2" {...props} />,
                      h2: ({ node, ...props }: any) => <h2 className="text-lg font-bold mb-2" {...props} />,
                      h3: ({ node, ...props }: any) => <h3 className="text-md font-bold mb-2" {...props} />,
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
              ) : (
                message.content
              )}
            </div>

            {/* Metadata for bot messages */}
            {isBot && message.metadata && (
              <div className="mt-2 pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between text-xs text-gray-500 flex-wrap gap-1">
                  {message.metadata.confidence && (
                    <span>Độ tin cậy: {Math.round(message.metadata.confidence * 100)}%</span>
                  )}
                  {message.metadata.processingTime && (
                    <span>{message.metadata.processingTime}ms</span>
                  )}
                  {message.metadata.userIntent && (
                    <span className="bg-gray-100 px-2 py-0.5 rounded">
                      {message.metadata.userIntent}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Product Recommendations */}
          {isBot && showProductRecommendation && (
            <div className="w-full mt-2">
              <ProductRecommendation products={message.recommendedProducts!} />
            </div>
          )}
          
          {/* Events and Campaigns Info */}
          {isBot && showEventInfo && (
            <div className="w-full mt-2">
              <EventInfo 
                events={message.relatedEvents || []} 
                campaigns={message.relatedCampaigns || []}
                title="Sự kiện & Chiến dịch"
              />
            </div>
          )}

          {/* Message Actions (for bot messages) */}
          {isBot && (
            <div className="flex items-center mt-1 md:mt-2 space-x-1 md:space-x-2">
              {/* Copy Button */}
              <button
                onClick={handleCopy}
                className="p-1 md:p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
                title="Sao chép"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              </button>

              {/* Feedback Buttons */}
              {!feedbackGiven && (
                <>
                  <button
                    onClick={() => handleFeedback(true)}
                    className="p-1 md:p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors touch-manipulation"
                    title="Hữu ích"
                  >
                    <ThumbsUp className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleFeedback(false)}
                    className="p-1 md:p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors touch-manipulation"
                    title="Không hữu ích"
                  >
                    <ThumbsDown className="w-3 h-3" />
                  </button>
                </>
              )}

              {/* Feedback Status */}
              {feedbackGiven && (
                <div className="flex items-center text-xs text-gray-500">
                  {isHelpful ? (
                    <div className="flex items-center text-green-600">
                      <ThumbsUp className="w-3 h-3 mr-1" />
                      <span className="hidden sm:inline">Hữu ích</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-red-600">
                      <ThumbsDown className="w-3 h-3 mr-1" />
                      <span className="hidden sm:inline">Không hữu ích</span>
                    </div>
                  )}
                </div>
              )}

              {/* More Options */}
              <button
                onClick={() => setShowOptions(!showOptions)}
                className="p-1 md:p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
                title="Thêm phản hồi"
              >
                <MoreHorizontal className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Timestamp */}
          <div className={`text-xs text-gray-500 mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
            {formatTime(message.createdAt)}
          </div>

          {/* Feedback Text Input */}
          {showOptions && (
            <div className="mt-2 w-full">
              <textarea
                className="w-full p-2 border rounded-md text-sm"
                placeholder="Nhập phản hồi chi tiết..."
                rows={2}
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
              />
              <div className="flex justify-end mt-1 space-x-2">
                <button
                  onClick={() => setShowOptions(false)}
                  className="px-3 py-1 text-xs rounded-md bg-gray-200 hover:bg-gray-300"
                  disabled={isSubmittingFeedback}
                >
                  Hủy
                </button>
                <button
                  onClick={() => handleFeedback(true)}
                  className="px-3 py-1 text-xs text-white rounded-md bg-green-500 hover:bg-green-600"
                  disabled={isSubmittingFeedback}
                >
                  Hữu ích
                </button>
                <button
                  onClick={() => handleFeedback(false)}
                  className="px-3 py-1 text-xs text-white rounded-md bg-red-500 hover:bg-red-600"
                  disabled={isSubmittingFeedback}
                >
                  Không hữu ích
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 