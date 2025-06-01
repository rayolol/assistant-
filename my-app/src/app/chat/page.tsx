"use client";
import { useTheme } from 'next-themes';
import { ChatWindow } from '@/components/chat/chatWindow';
import { ContentContainer } from '@/components/layout/container';
import { SidebarContainer } from '@/components/sidebar/SidebarContainer';
import ChatInput from './component/ChatInput';
import SettingDialog from '@/components/functional/SettingDialog';
import { useEffect, useState } from 'react';
import { useUserStore } from '../hooks/StoreHooks/UserStore';
import { AuthRedirect } from '@/components/utils/AuthRedirectCard';
import { SidebarTrigger } from '@/components/ui/sidebar';

const ChatPage = () => {
  const { isAuthenticated, } = useUserStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  },[])

  if (! isAuthenticated) return <AuthRedirect/>

  if (!mounted) return null;

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-y-hidden">

      <SidebarContainer/>
      <ContentContainer fluid={true} className='flex flex-col min-w-0 items-center'>
        {/* Header */}
        <header className="w-full bg-white dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-500 py-4 px-6 flex items-center justify-between">
          <SidebarTrigger/>
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
       <aside className="pt-2 w-20 flex flex-col items-center border-1 border-sidebar-border bg-sidebar">
          <SettingDialog/>
       </aside>
    </div>
  );
}

export default ChatPage;
