import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserStore {
    user: string | null;
    setUser: (user: string | null) => void;

    conversation_id: string | null;
    setConversationId: (conversation_id: string | null) => void;
}

export const useUserStore = create<UserStore>()(
    persist((set) => ({
    user: null,
    setUser: (user) => set({ user }),

    conversation_id: null,
    setConversationId: (conversation_id) => set({ conversation_id })
}), {
    name: 'user-store',
    partialize: (state) => ({ user: state.user, conversation_id: state.conversation_id })


}));

