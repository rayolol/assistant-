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
import { useMessageHandling } from '../hooks/useMessageHandling';
import { useMessageStore } from '../hooks/StoreHooks/useMessageStore';

const ChatPage = () => {
  const { isAuthenticated, userId, sessionId } = useUserStore();
  const { currentConversationId } = useMessageStore();
  const [mounted, setMounted] = useState(false);
  const { state } = useSidebar();
  const { messages, response, sendMessage, isStreaming, error, awaitingEvent, sendUserFeedback } = useMessageHandling();


  useEffect(() => {
    setMounted(true);
  }, []);

  const pageContent = useMemo(() => {
    if (!isAuthenticated) return <AuthRedirect />;
    if (!userId || !sessionId) return <>loading</>;
    if (!mounted) return null;


    return (
      <div className="flex h-screen w-full bg-background flex-1 text-foreground overflow-hidden">
        <SidebarContainer/>
        <ContentContainer fluid={true} className='flex flex-col min-w-0 overflow-hidden'>
          {/* Header */}
          <header className="w-full bg-background border-border border-b-2 py-4 h-15 px-6 flex items-center justify-between">
            {state === "collapsed" ? <SidebarTrigger /> : <div></div>}
            <h1 className="text-lg font-bold text-gray-800 dark:text-white">Memory Chat</h1>
          </header>

          {/* Main content */}
          <main className="flex flex-col h-full overflow-y-auto">
             <ChatWindow messages ={messages} isStreaming = {isStreaming} response={response}  error= {error}/>
          </main>

         {/* Message input area */}
         <footer className="w-full px-2 sm:px-4 sm:pb-4 pt-2">
            <ChatInput currentConversationId={currentConversationId} isStreaming={isStreaming} sendMessage={sendMessage} response={response} awaitingEvent={awaitingEvent} sendUserFeedback = {sendUserFeedback}/>
          </footer>
        </ContentContainer>

        {/* right Sidebar */}
        <aside className="p-4 w-20 flex flex-col items-center border-1 border-sidebar-border bg-sidebar">
          <SettingDialog/>
        </aside>
      </div>
    );
  }, [currentConversationId, error, isAuthenticated, isStreaming, messages, mounted, response, sendMessage, state]);

  if (!isAuthenticated) return <AuthRedirect />;
  if (!userId || !sessionId) return <>loading</>;
  if (!mounted) return null;

  return pageContent;
}

export default ChatPage;
