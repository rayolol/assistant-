"use client";

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchConversations, fetchMessagesHistory, sendMessage, createConversation } from './api';
import { Message } from '../../../types/message';
import axios from 'axios';

export const useChathistory = (conversation_id: string | null | undefined, user_id: string | null, session_id: string | null) =>
    useQuery({
        queryKey: ['messages', conversation_id],
        queryFn: async () => {
            if (conversation_id && user_id && conversation_id !== 'None' && session_id) {
                return await fetchMessagesHistory(conversation_id, user_id, session_id);
            }
            else if (!conversation_id || conversation_id === 'None') {
                return [];
            }
            else {
                return Promise.reject(new Error('Invalid conversation_id or userId'));
            }
        },
        enabled: Boolean(user_id),
        refetchOnWindowFocus: false,
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
                const result = await createConversation(payload.user_id, payload.name);
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
                return await fetchConversations(user_id);
            }
            return Promise.reject(new Error('Invalid userId'));
        },
        enabled: Boolean(user_id),
        refetchOnWindowFocus: false,
    })

export const useGetUserId = (username: string, email: string) => {
  return useMutation({
    mutationFn: async () => {
      const response = await axios.get(`/users/get-user-id`, {
        params: { username, email }  // Send as query parameters for GET request
      });
      return response.data;
    },
  });
};

