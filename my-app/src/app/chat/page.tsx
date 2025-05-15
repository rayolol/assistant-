"use client";

import ChatWindow from './component/ChatWindow';
import SideBar from './component/SideBar';
import { CollapsibleSideBar } from '@/components/ui/container';
import { ContentContainer, SideBarContainer } from '@/components/ui/container';
import { useState } from 'react';

const ChatPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-neutral-800">

      <SideBarContainer isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)}>
        <SideBar />
      </SideBarContainer>

      {/* Sidebar - hidden on mobile by default */}
      <CollapsibleSideBar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)}>
        <SideBar />
      </CollapsibleSideBar>
      
      <ContentContainer fluid={true} className='min-w-0 flex-1'>
        <button 
            className="mr-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
            onClick={() => setSidebarOpen(true)}
          >
            <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
        </button>
        {/* Header */}
        <header className="w-full bg-white dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-500 py-4 px-6 flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-800 dark:text-white">Memory Chat</h1>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-hidden">
          <ChatWindow />
        </main>


        
      </ContentContainer>
    </div>
  );
}

export default ChatPage;
