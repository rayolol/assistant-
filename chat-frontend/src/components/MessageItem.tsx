import React from 'react';
import { Message } from '../types/message.tsx';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

interface MessageItemProps {
  message: Message;
  showAvatar: boolean;
}

const MessageItem: React.FC<MessageItemProps> = ({ message, showAvatar }) => {
  const isUser = message.role === 'user';
  const hasError = message.flags?.error;
  
  // Format timestamp
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      {/* Avatar for bot/assistant */}
      {!isUser && showAvatar && (
        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center mr-2">
          <span className="text-white text-xs font-bold">AI</span>
        </div>
      )}
      
      {/* Message content */}
      <div 
        className={`
          rounded-lg p-3 max-w-md
          ${isUser 
            ? 'bg-blue-600 text-white' 
            : hasError 
              ? 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200' 
              : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
          }
          ${isUser ? 'rounded-tr-none' : 'rounded-tl-none'}
        `}
      >
        {/* Message timestamp */}
        <div className={`text-xs ${isUser ? 'text-blue-200' : 'text-gray-500 dark:text-gray-400'} mb-1`}>
          {formatTime(message.timestamp)}
        </div>
        
        {/* Message content with markdown support */}
        <div className="prose dark:prose-invert max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeKatex]}
            components={{
              code({ node, inline, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '');
                return !inline && match ? (
                  <SyntaxHighlighter
                    style={atomDark}
                    language={match[1]}
                    PreTag="div"
                    {...props}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                ) : (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              }
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
      </div>
      
      {/* Avatar for user */}
      {isUser && showAvatar && (
        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ml-2">
          <span className="text-white text-xs font-bold">U</span>
        </div>
      )}
    </div>
  );
};

export default MessageItem;
