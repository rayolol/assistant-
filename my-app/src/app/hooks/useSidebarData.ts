"use client";

import { useQuery } from '@tanstack/react-query';
import { useMessageStore } from './StoreHooks/useMessageStore';
import { fetchConversations } from '../api/api';
import { useUserStore } from './StoreHooks/UserStore';
import { useEffect } from 'react';
import { Conversation } from '../../../types/conversation';

const useSidebarData = () => {
    const { userId } = useUserStore();
    const { currentConversationId, setCurrentConversationId } = useMessageStore();

    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['conversations', userId],
        queryFn: async () => {
            if (userId) {
                console.log("Fetching conversations for user:", userId);
                const result = await fetchConversations(userId);
                console.log("Fetched conversations result:", result);
                return result;
            }
            return { data: [] };
        },
        enabled: Boolean(userId),
        refetchOnWindowFocus: false, // Disable automatic refetch on window focus
    });

    // Extract conversations from the response
    const conversations: Conversation[] = data?.data || [];
    
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
