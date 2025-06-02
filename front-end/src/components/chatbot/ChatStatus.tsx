import React from 'react';
import { MessageSquare, Clock, CheckCircle } from 'lucide-react';

interface ChatStatusProps {
  messageCount: number;
  isTyping?: boolean;
  lastMessageTime?: Date;
  className?: string;
}

export default function ChatStatus({ 
  messageCount, 
  isTyping = false, 
  lastMessageTime,
  className = '' 
}: ChatStatusProps) {
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Vừa xong';
    if (minutes < 60) return `${minutes} phút trước`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} giờ trước`;
    
    const days = Math.floor(hours / 24);
    return `${days} ngày trước`;
  };

  return (
    <div className={`flex items-center justify-center space-x-2 ${className}`}>
      <div className="flex items-center space-x-1 text-xs text-gray-500 bg-white px-3 py-1 rounded-full shadow-sm border border-gray-200">
        <MessageSquare className="w-3 h-3" />
        <span>{messageCount} tin nhắn</span>
        
        {isTyping && (
          <>
            <span>•</span>
            <div className="flex items-center space-x-1">
              <div className="w-1 h-1 bg-pink-500 rounded-full animate-pulse"></div>
              <div className="w-1 h-1 bg-pink-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-1 h-1 bg-pink-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              <span className="text-pink-600">Đang trả lời</span>
            </div>
          </>
        )}
        
        {!isTyping && lastMessageTime && (
          <>
            <span>•</span>
            <div className="flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>{formatTime(lastMessageTime)}</span>
            </div>
          </>
        )}
        
        {!isTyping && messageCount > 0 && (
          <>
            <span>•</span>
            <CheckCircle className="w-3 h-3 text-green-500" />
          </>
        )}
      </div>
    </div>
  );
}
