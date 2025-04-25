"use client";

import React, { useState } from 'react';
import ChatWindow from './component/ChatWindow';
import SideBar from './component/SideBar';

const ChatPage = () => {
  // const [sidebarOpen, setSidebarOpen] = useState(true);
  
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar - hidden on mobile by default */}
      <div className={` md:block md:w-64 lg:w-80 flex-shrink-0 border-r border-gray-200 dark:border-gray-700`}>
        <SideBar />
      </div>
      
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow z-10">
          <div className="flex items-center justify-between px-4 py-3">
            {/* Mobile menu button */}
            <button 
              className="md:hidden p-2 rounded-md text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Memory Chat</h1>
            
            {/* Theme toggle button - you can implement this later */}
            <button className="p-2 rounded-md text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            </button>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-hidden">
          <ChatWindow />
        </main>
      </div>
    </div>
  );
}

export default ChatPage;
