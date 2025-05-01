"use client";

import { create } from 'zustand';
import { Message } from '../../../../types/message';

interface ChatStore {
    currentConversationId: string | null;
    setCurrentConversationId: (conversationId: string | null) => void;

    messages: Message[] | null;
    setMessages: (messages: Message[] | null | ((prev: Message[] | null) => Message[])) => void;
}

export const useMessageStore = create<ChatStore>()((set) => ({
    currentConversationId: null,
    setCurrentConversationId: (conversationId) => set({ currentConversationId: conversationId }),

    messages: [], // Initialize as empty array instead of null
    setMessages: (messages) => set((state) => ({
        messages: typeof messages === 'function' ? messages(state.messages || []) : messages
    })),
}));
