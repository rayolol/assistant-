import React from 'react';
import { Message } from '../types/message.tsx';
import MessageItem from './MessageItem.tsx';
import TypingIndicator from './TypingIndicator.tsx';

interface MessageListProps {
  messages: Message[];
  isTyping: boolean;
}

const MessageList: React.FC<MessageListProps> = ({ messages, isTyping }) => {
  return (
    <div className="space-y-4">
      {messages.map((message, index) => (
        <MessageItem 
          key={`${message.timestamp}-${index}`} 
          message={message} 
          showAvatar={index === 0 || messages[index - 1]?.role !== message.role}
        />
      ))}
      
      {isTyping && (
        <div className="flex items-start">
          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center mr-2">
            <span className="text-white text-xs font-bold">AI</span>
          </div>
          <div className="bg-gray-200 dark:bg-gray-700 rounded-lg p-3 max-w-md">
            <TypingIndicator />
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageList;
