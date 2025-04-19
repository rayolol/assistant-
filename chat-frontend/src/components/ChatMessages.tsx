import React from 'react'
import { Message } from '../types/message.tsx'

// Import CSS for styling
import './ChatMessages.css'

const ChatMessages = ({ message }: { message: Message }) => {
  const isUser = message.role === 'user';
  // Handle both 'assistant' and 'bot' roles as non-user messages

  // Function to convert markdown-like syntax to HTML
  const formatMessage = (content: string) => {
    // Replace code blocks
    let formattedContent = content.replace(/```([\s\S]*?)```/g, '<pre class="code-block"><code>$1</code></pre>');

    // Replace inline code
    formattedContent = formattedContent.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

    // Replace bold text
    formattedContent = formattedContent.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // Replace italic text
    formattedContent = formattedContent.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    // Replace headers
    formattedContent = formattedContent.replace(/^### (.*)$/gm, '<h3>$1</h3>');
    formattedContent = formattedContent.replace(/^## (.*)$/gm, '<h2>$1</h2>');
    formattedContent = formattedContent.replace(/^# (.*)$/gm, '<h1>$1</h1>');

    // Replace unordered lists
    formattedContent = formattedContent.replace(/^- (.*)$/gm, '<li>$1</li>');

    // Replace ordered lists
    formattedContent = formattedContent.replace(/^\d+\. (.*)$/gm, '<li>$1</li>');

    // Replace paragraphs (simple approach)
    formattedContent = formattedContent.replace(/\n\n/g, '</p><p>');

    // Wrap in paragraph if not already wrapped
    if (!formattedContent.startsWith('<')) {
      formattedContent = '<p>' + formattedContent + '</p>';
    }

    return formattedContent;
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      {/* Avatar for bot messages */}
      {!isUser && (
        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center mr-2">
          <span className="text-white text-xs font-bold">AI</span>
        </div>
      )}

      <div
        className={`
          flex flex-col max-w-[80%] md:max-w-[70%] lg:max-w-[60%]
          ${isUser ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100'}
          rounded-2xl px-4 py-3 shadow-sm
          ${isUser ? 'rounded-tr-none' : 'rounded-tl-none'}
        `}
      >
        {/* Message timestamp - optional */}
        <div className={`text-xs ${isUser ? 'text-blue-200' : 'text-gray-500 dark:text-gray-400'} mb-1`}>
          {message.timestamp ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
        </div>

        {/* Message content with basic formatting */}
        <div
          className="markdown-content"
          dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }}
        />
      </div>

      {/* Avatar for user messages */}
      {isUser && (
        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-800 flex items-center justify-center ml-2">
          <span className="text-white text-xs font-bold">You</span>
        </div>
      )}
    </div>
  )
}

export default ChatMessages