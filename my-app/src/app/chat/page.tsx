"use client";

import ChatWindow from './component/ChatWindow';
import SideBar from './component/SideBar';
import { ContentContainer } from '@/components/ui/container';
import { Sidebar, SidebarContent, SidebarTrigger } from '@/components/ui/sidebar';
import ChatInput from './component/ChatInput';
import { useMessageHandling } from '../hooks/useMessageHandling';

const ChatPage = () => {
  const { isStreaming, sendMessage } = useMessageHandling();
  
  return (
    <div className="flex h-screen w-full bg-gray-50 dark:bg-neutral-800">

        <Sidebar>
          <SidebarContent>
            <SidebarTrigger />
            <SideBar />
          </SidebarContent>
        </Sidebar>

      <ContentContainer fluid={true} className='flex flex-col min-w-0 items-center'>
        {/* Header */}
        <header className="w-full bg-white dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-500 py-4 px-6 flex items-center justify-between">
          <SidebarTrigger/>
          <h1 className="text-lg font-bold text-gray-800 dark:text-white">Memory Chat</h1>
        </header>

        {/* Main content */}
        <main className="flex flex-col flex-1 h-full overflow-y-auto">
           <ChatWindow />
        </main>

      {/* Message input area */}
        <footer className="w-full mt-[-60px] px-2 sm:px-4 sm:pb-4 pt-2">
            <ChatInput isStreaming={isStreaming} sendMessage={(message) => sendMessage(message)}/>
        </footer>

        
      </ContentContainer>


       {/* right Sidebar */}
       <aside className="w-20 bg-white border-1 border-gray-200">

       </aside>
    </div>
  );
}

export default ChatPage;
