"use client";

import { useUserStore } from "./StoreHooks/UserStore";
import { useGetUserId } from "./hooks";

export function useAuth() {
    const { username, email, isAuthenticated, setIsAuthenticated, setUserId, setUsername, setEmail } = useUserStore();
    const { mutateAsync: getUserId } = useGetUserId(username, email);

    const login = async (username: string, email: string) => {
        try {
            // First set the username and email so they're available for the API call
            setUsername(username);
            setEmail(email);
            
            // Then get the user ID
            const response = await getUserId();
            const userId = response?.userId;
            
            // Set the user ID and authentication state
            setUserId(userId);
            setIsAuthenticated(true);
        } catch (error) {
            console.error("Error logging in:", error);
            throw error;
        }
    };

    const logout = () => {
        setUserId(null);
        setUsername(null);
        setEmail(null);
        setIsAuthenticated(false);
    };

    return { username, email, isAuthenticated, login, logout };
}
