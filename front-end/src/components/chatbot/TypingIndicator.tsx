import React from 'react';
import { Bot } from 'lucide-react';

export default function TypingIndicator() {
  return (
    <div className="flex justify-start mb-4">
      <div className="flex max-w-[80%]">
        {/* Avatar */}
        <div className="flex-shrink-0 mr-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-purple-500 text-white">
            <Bot className="w-4 h-4" />
          </div>
        </div>

        {/* Typing bubble */}
        <div className="flex flex-col items-start">
          <div className="bg-white text-gray-800 border border-gray-200 rounded-2xl rounded-bl-md shadow-sm px-4 py-3">
            <div className="flex items-center space-x-1">
              <span className="text-sm text-gray-600 mr-2">AI đang trả lời</span>
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
          
          {/* Timestamp placeholder */}
          <div className="text-xs text-gray-500 mt-1 text-left">
            Đang xử lý...
          </div>
        </div>
      </div>
    </div>
  );
} 