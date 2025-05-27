"use client";

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {Conversation} from '../../types/conversation';

interface ConversationStore {
    conversations: Conversation[];
    setConversations: (conversations: Conversation[]) => void;
}

export const useConversationStore = create<ConversationStore>()((set) => ({
    conversations: [],
    setConversations: (conversations) => set({ conversations }),
})
);
