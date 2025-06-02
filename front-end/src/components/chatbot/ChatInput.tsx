import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
}

export default function ChatInput({ 
  onSendMessage, 
  disabled = false, 
  placeholder = "Nhập tin nhắn...",
  maxLength = 1000
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleVoiceRecord = () => {
    if (!isRecording) {
      // Start recording
      setIsRecording(true);
      // TODO: Implement voice recording functionality
      console.log('Starting voice recording...');
    } else {
      // Stop recording
      setIsRecording(false);
      // TODO: Process voice recording
      console.log('Stopping voice recording...');
    }
  };

  const remainingChars = maxLength - message.length;
  const isNearLimit = remainingChars <= 50;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col space-y-2">
      {/* Character count indicator */}
      {isNearLimit && (
        <div className="text-xs text-gray-500 text-right">
          {remainingChars} ký tự còn lại
        </div>
      )}

      <div className="flex items-end space-x-2">
        {/* Text input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            maxLength={maxLength}
            rows={1}
            className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            style={{ minHeight: '44px', maxHeight: '120px' }}
          />

          {/* Voice recording button - Đơn giản hóa */}
          <button
            type="button"
            onClick={handleVoiceRecord}
            disabled={disabled}
            className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              isRecording
                ? 'text-red-500 bg-red-50 hover:bg-red-100'
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            }`}
            title={isRecording ? 'Dừng ghi âm' : 'Ghi âm'}
          >
            {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Send button */}
        <button
          type="submit"
          disabled={disabled || !message.trim()}
          className="flex-shrink-0 p-3 bg-pink-500 hover:bg-pink-600 disabled:bg-gray-300 text-white rounded-2xl transition-colors disabled:cursor-not-allowed"
          title="Gửi tin nhắn"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

      {/* Quick suggestions - Đơn giản */}
      {message === '' && !disabled && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          <button
            type="button"
            onClick={() => setMessage('Tôi muốn tìm sản phẩm chăm sóc da')}
            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-1 rounded-full transition-colors border border-gray-300"
          >
            🧴 Chăm sóc da
          </button>
          <button
            type="button"
            onClick={() => setMessage('Gợi ý son môi phù hợp')}
            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-1 rounded-full transition-colors border border-gray-300"
          >
            💄 Son môi
          </button>
          <button
            type="button"
            onClick={() => setMessage('Sản phẩm nào đang khuyến mãi?')}
            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-1 rounded-full transition-colors border border-gray-300"
          >
            🎉 Khuyến mãi
          </button>
        </div>
      )}
    </form>
  );
} 