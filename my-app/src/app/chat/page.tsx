"use client";
import { ChatWindow } from '@/components/chat/chatWindow';
import { ContentContainer } from '@/components/layout/container';
import { SidebarContainer } from '@/components/sidebar/SidebarContainer';
import ChatInput from './component/ChatInput';
import SettingDialog from '@/components/functional/SettingDialog';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useUserStore } from '../hooks/StoreHooks/UserStore';
import { AuthRedirect } from '@/components/utils/AuthRedirectCard';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';

const ChatPage = () => {
  const { isAuthenticated } = useUserStore();
  const [mounted, setMounted] = useState(false);
  const { state } = useSidebar();
  
  // Use useCallback for event handlers
  const handleMount = useCallback(() => {
    setMounted(true);
    
    // Clean up function to prevent memory leaks
    return () => {
      // Clean up any event listeners or subscriptions
    };
  }, []);
  
  useEffect(() => {
    handleMount();
  }, [handleMount]);

  // Use useMemo for expensive calculations
  const pageContent = useMemo(() => {
    if (!isAuthenticated) return <AuthRedirect/>;
    if (!mounted) return null;
    
    return (
      <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
        <SidebarContainer/>
        <ContentContainer fluid={true} className='flex flex-col min-w-0 items-center'>
          {/* Header */}
          <header className="w-full bg-background border-border border-b-2 py-4 h-15 px-6 flex items-center justify-between">
            {state === "collapsed" ? <SidebarTrigger /> : <div></div>}
            <h1 className="text-lg font-bold text-gray-800 dark:text-white">Memory Chat</h1>
          </header>

          {/* Main content */}
          <main className="flex flex-col flex-1 h-full overflow-y-auto">
             <ChatWindow/>
          </main>

         {/* Message input area */}
         <footer className="w-full px-2 sm:px-4 sm:pb-4 pt-2">
            <ChatInput/>
          </footer>
        </ContentContainer>

        {/* right Sidebar */}
        <aside className="p-4 w-20 flex flex-col items-center border-1 border-sidebar-border bg-sidebar">
          <SettingDialog/>
        </aside>
      </div>
    );
  }, [isAuthenticated, mounted, state]);

  return pageContent;
}

export default ChatPage;
