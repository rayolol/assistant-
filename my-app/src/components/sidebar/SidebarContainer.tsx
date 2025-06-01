"use client";

import { Conversation } from '@/app/types/schemas';
import useSidebarData from '@/app/hooks/useSidebarData';
import {SidebarConversations} from './SidebarContent';
import { ErrorCard } from '@/components/utils/ErrorCard';
import { Sidebar, SidebarContent, SidebarTrigger, SidebarHeader, SidebarFooter } from '../ui/sidebar';
import { PanelRightOpen } from 'lucide-react';


export const SidebarContainer = () => {
    const { conversations, isLoading, error,currentConversationId, setCurrentConversationId, startNewConversation } = useSidebarData();

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
            <SidebarHeader>
                <div className="flex justify-between items-center border-border">
                    <h1>Memory Chat</h1>
                    <SidebarTrigger>
                        <PanelRightOpen  />
                    </SidebarTrigger>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarConversations 
                    conversations={conversations} 
                    onNewConversationClick={onNewConversationClick} 
                    onConversationClick={onConversationClick} 
                    currentConversationId={currentConversationId} 
                />
            </SidebarContent>
            <SidebarFooter>

            </SidebarFooter>
        </Sidebar>
    )
}