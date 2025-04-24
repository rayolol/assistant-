"use client";

import React from 'react';
import ChatWindow from './ChatWindow';

const ChatPage = () => {
  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Chat</h1>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full py-6">
          <ChatWindow />
        </div>
      </main>
    </div>
  );
}

export default ChatPage;
