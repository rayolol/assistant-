"use client";

import { create } from 'zustand';
import { persist } from 'zustand/middleware';


interface UserStore {


    // User data
    username: string | null;
    userId: string | null;
    email: string | null;
    isAuthenticated: boolean;


    // Active sesstion data
    conversation_id: string | null | undefined;
    sessionId: string | null;

    // Setter functions
    setUserId: (userId: string | null) => void;
    setUsername: (username: string | null) => void;
    setEmail: (email: string | null) => void;
    setIsAuthenticated: (isAuthenticated: boolean) => void;
    setConversationId: (conversation_id: string | null | undefined) => void;
    setSessionId: (sessionId: string | null) => void;

    login: (username: string, email: string) => void;
    logout: () => void;
}

export const useUserStore = create<UserStore>()(
    persist((set) => ({
    userId: null,
    email: null,
    username: null,
    isAuthenticated: false,
    conversation_id: null,
    sessionId: "123456790",

    setUserId: (userId) => set({ userId }),
    setUsername: (username) => set({ username }),
    setEmail: (email) => set({ email }),
    setIsAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
    setConversationId: (conversation_id) => set({ conversation_id }),
    setSessionId: (sessionId) => set({ sessionId }),

    login: (username, email) => {
        set({ username: username, email: email, isAuthenticated: true });

    },

    logout: () => {
        set({
            userId: null,
            email: null,
            isAuthenticated: false,
            conversation_id: null,
            username: null
        });
    }


}), {
    name: 'user-store',
    partialize: (state) => ({
        userId: state.userId,
        conversation_id: state.conversation_id,
        sessionId: state.sessionId,

        username: state.username,
        email: state.email,

        isAuthenticated: state.isAuthenticated,
    })


}));


