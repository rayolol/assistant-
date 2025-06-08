"use client";

import { Conversation } from '@/app/types/schemas';
import useSidebarData from '@/app/hooks/useSidebarData';
import {SidebarConversations} from './SidebarContent';
import { ErrorCard } from '@/components/utils/ErrorCard';
import { Sidebar, SidebarContent, SidebarTrigger, SidebarHeader, SidebarFooter } from '../ui/sidebar';
import { PanelRightOpen } from 'lucide-react';
import { useMessageHandling } from '@/app/hooks/useMessageHandling';


export const SidebarContainer = () => {
    const { conversations, isLoading, error,currentConversationId, setCurrentConversationId, startNewConversation } = useSidebarData();
    const { isStreaming } = useMessageHandling();

    const onNewConversationClick = () => {
        startNewConversation();
    };

    const onConversationClick = (conversation: Conversation) => {
        setCurrentConversationId(conversation.id);
    };

    if(error) return <ErrorCard error={error} />
    if(isLoading) return <div>Loading...</div>;


    return (
        <Sidebar>
            <SidebarHeader className='h-15 flex flex-row items-center justify-between'>
                <div className="flex justify-between m-0 items-center border-border">
                    <h1>Memory Chat</h1>
                </div>
                <SidebarTrigger>
                    <PanelRightOpen  />
                </SidebarTrigger>
            </SidebarHeader>
            <SidebarContent>
                <SidebarConversations 
                    conversations={conversations} 
                    onNewConversationClick={onNewConversationClick} 
                    onConversationClick={onConversationClick} 
                    currentConversationId={currentConversationId}
                    isStreaming={isStreaming} 
                />
            </SidebarContent>
            <SidebarFooter>

            </SidebarFooter>
        </Sidebar>
    )
}