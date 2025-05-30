"use client";

import { create } from 'zustand';
import { Message } from '../../types/schemas';

interface ChatStore {
    currentConversationId: string | null;
    setCurrentConversationId: (conversationId: string | null) => void;

    messages: Message[] | null;
    setMessages: (messages: Message[] | null | ((prev: Message[] | null) => Message[])) => void;

    response: string;
    setResponse: (response: string) => void;

    isStreaming: boolean;
    setIsStreaming: (isStreaming: boolean) => void;
}

export const useMessageStore = create<ChatStore>()((set) => ({
    currentConversationId: null,
    setCurrentConversationId: (conversationId) => set({ 
        currentConversationId: conversationId,
        messages: [], // Clear messages when changing conversation
        response: "", // Clear response
        isStreaming: false // Reset streaming state
    }),

    messages: [], // Initialize as empty array instead of null
    setMessages: (messages) => set((state) => ({
        messages: typeof messages === 'function' ? messages(state.messages || []) : messages
    })),

    response: "",
    setResponse: (response: string | ((prev: string) => string)) =>
    set((state) => ({
    response: typeof response === 'function' ? response(state.response) : response,
  })),

    isStreaming: false,
    setIsStreaming: (isStreaming) => set({ isStreaming }),
}));
