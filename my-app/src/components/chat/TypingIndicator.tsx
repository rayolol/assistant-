"use client";

import React from 'react';

const TypingIndicator: React.FC = () => {
    return (
        <div className="flex max-w-fit items-center space-x-1 p-3 bg-gray-200 text-gray-800 rounded-lg rounded-tl-none">
            <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
    );
};

export const DotIndicator: React.FC = () => {
      console.log("DotIndicator rendered");
    return (
        <span className='h-5 w-5 rounded-full bg-white pulse z-10'/>
    )


}

export default TypingIndicator;