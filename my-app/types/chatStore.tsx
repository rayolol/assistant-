import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { fetchConversations, fetchMessagesHistory } from '@/app/api/api';
import { Conversation, Message } from './message';

interface ChatStore {
    conversations: Conversation[] | null;
    setConversations: (conversations: Conversation[] | null) => void;

    messages: Message[] | null;
    setMessages: (messages: Message[] | null) => void;
}

const useConversationsStore = create<ChatStore>()((set) => ({
    conversations: null,
    setConversations: (conversations) => set({ conversations }),

    messages: null,
    setMessages: (messages) => set({ messages }),
}));