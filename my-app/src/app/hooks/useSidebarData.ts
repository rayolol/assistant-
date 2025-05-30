"use client";

import { useMessageStore } from './StoreHooks/useMessageStore';
import { useUserStore } from './StoreHooks/UserStore';
import { useEffect } from 'react';
import { Conversation } from '../types/schemas';
import { useConversation } from '@/app/api/Queries/getConversation';

const useSidebarData = () => {
    const { userId } = useUserStore();
    const { currentConversationId, setCurrentConversationId } = useMessageStore();

    const { data, isLoading, error, refetch } =useConversation(userId);

    // Extract conversations from the response
    const conversations: Conversation[] = data || [];
    
    // Function to start a new conversation (lazy initialization)
    const startNewConversation = () => {
        // Set the current conversation ID to pending
        setCurrentConversationId("pending");
        console.log("Started new pending conversation");
    };

    // Debug logging
    useEffect(() => {
        console.log("useSidebarData - Raw data:", data);
        console.log("useSidebarData - Processed conversations:", conversations);
    }, [data, conversations]);

    // Set the first conversation as current if none is selected
    useEffect(() => {
        if (conversations.length > 0 && !currentConversationId) {
            console.log("Setting initial conversation ID:", conversations[0].id);
            setCurrentConversationId(conversations[0].id);
        }
    }, [conversations, currentConversationId, setCurrentConversationId]);

    return {
        conversations,
        isLoading,
        error,
        refetch,
        currentConversationId,
        setCurrentConversationId,
        startNewConversation
    };
};

export default useSidebarData;
