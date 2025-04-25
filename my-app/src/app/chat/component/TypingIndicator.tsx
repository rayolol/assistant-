"use client";

import React from 'react';

const TypingIndicator: React.FC = () => {
    return (
        <div className="flex items-center space-x-1 p-3 bg-gray-200 text-gray-800 rounded-lg rounded-tl-none max-w-[80%]">
            <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
    );
};

export default TypingIndicator;
