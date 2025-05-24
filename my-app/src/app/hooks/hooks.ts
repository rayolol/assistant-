"use client";

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchConversations, fetchMessagesHistory, sendMessage, createConversation, fetchUserId } from '../api/api';
import { baseURL } from '../api/api';
import { useState, useCallback } from 'react';
import { Message } from '../../../types/message';
import axios from 'axios';

export const useChathistory = (conversation_id: string | null | undefined, user_id: string | null, session_id: string | null) =>
    useQuery({
        queryKey: ['messages', conversation_id],
        queryFn: async () => {
            if (conversation_id && user_id && conversation_id !== 'None' && conversation_id !== 'pending' && session_id) {
                return await fetchMessagesHistory(conversation_id, user_id, session_id);
            }
            else if (!conversation_id || conversation_id === 'None' || conversation_id === 'pending') {
                // Return empty array for pending or invalid conversation IDs
                return [];
            }
            else {
                return Promise.reject(new Error('Invalid conversation_id or userId'));
            }
        },
        enabled: Boolean(user_id) && conversation_id !== 'pending',
        refetchOnWindowFocus: false,
        staleTime: 30000, // Consider data fresh for 30 seconds
        gcTime: 5 * 60 * 1000, // Keep data in cache for 5 minutes
        refetchOnMount: false, // Don't refetch on mount if we have cached data
        refetchOnReconnect: false // Don't refetch on reconnect
    })

export const useSendMessage = () => {
   const qc = useQueryClient()
   return useMutation({
    mutationFn: async (payload: Message) => {
        return await sendMessage(payload);
    },
    onSuccess: () => {
        // Invalidate and refetch messages after a successful mutation
        qc.invalidateQueries({ queryKey: ['messages'] })
    }
   })
}
export const useCreateConversation = () => {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async (payload: { user_id: string, name?: string }) => {
            console.log("Creating conversation with payload:", payload);
            try {
                const result: { id: string } = await createConversation(payload.user_id, payload.name);
                console.log("Create conversation API result:", result);
                return result;
            } catch (error) {
                console.error("API error creating conversation:", error);
                throw error;
            }
        },
        onSuccess: (data) => {
            console.log("Conversation created successfully:", data);
            // Invalidate and refetch conversations after a successful mutation
            qc.invalidateQueries({ queryKey: ['conversations'] });
        },
        onError: (error) => {
            console.error("Mutation error creating conversation:", error);
        }
    })
}

export const useConversations = (user_id: string | null) =>
    useQuery({
        queryKey: ['conversations', user_id],
        queryFn: async () => {
            if (user_id) {
                console.log("useConversations hook fetching for user:", user_id);
                const result = await fetchConversations(user_id);
                console.log("useConversations hook received:", result);
                return result;
            }
            console.log("useConversations hook: no user_id, returning error");
            return Promise.reject(new Error('Invalid userId'));
        },
        enabled: Boolean(user_id),
        refetchOnWindowFocus: false,
        select: (data) => {
            console.log("useConversations select function received:", data);
            // Ensure we always return the data array from the response
            if (data && data.data && Array.isArray(data.data)) {
                return data.data;
            }
            console.warn("useConversations: unexpected data format", data);
            return [];
        }
    })

export const useGetUserId = (username: string, email: string) => {
  return useMutation({
    mutationFn: async () => {
      return await fetchUserId({ username, email });
    },
  });
};

