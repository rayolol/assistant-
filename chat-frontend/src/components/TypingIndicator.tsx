import React from 'react';

const TypingIndicator = () => {
  return (
    <div className="flex space-x-2 p-3 bg-gray-200 dark:bg-gray-700 rounded-2xl rounded-tl-none max-w-[80%] md:max-w-[70%] lg:max-w-[60%]">
      <div className="w-2 h-2 rounded-full bg-gray-500 animate-pulse" style={{ animationDelay: '0ms' }}></div>
      <div className="w-2 h-2 rounded-full bg-gray-500 animate-pulse" style={{ animationDelay: '200ms' }}></div>
      <div className="w-2 h-2 rounded-full bg-gray-500 animate-pulse" style={{ animationDelay: '400ms' }}></div>
    </div>
  );
};

export default TypingIndicator;