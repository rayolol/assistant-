import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserStore {
    user: string | null;
    setUser: (user: string | null) => void;

    conversation_id: string | null;
    setConversationId: (conversation_id: string | null) => void;

    session_id: string | null;
    setSessionId: (session_id: string | null) => void;
}

export const useUserStore = create<UserStore>()(
    persist((set) => ({
    user: null,
    setUser: (user) => set({ user }),

    conversation_id: null,
    setConversationId: (conversation_id) => set({ conversation_id }),

    session_id: null,
    setSessionId: (session_id) => set({ session_id }),
}), {
    name: 'user-store',
    partialize: (state) => ({ user: state.user, conversation_id: state.conversation_id, session_id: state.session_id })


}));

