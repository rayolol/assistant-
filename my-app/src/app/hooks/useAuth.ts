"use client";

import { useUserStore } from "./StoreHooks/UserStore";
import { useCreateUser } from "@/app/api/Queries/createUser";
import { useGetUser } from "@/app/api/Queries/getUser";

export function useAuth() {
    const { username, email, isAuthenticated, setIsAuthenticated, setUserId, setUsername, setEmail } = useUserStore();
    const { data: user, error: userError } = useGetUser(username ?? 'Guest', email ?? 'Guest@example.com');
    const { mutateAsync: createUser, error: createUserError } = useCreateUser();

    const login = async (username: string, email: string, newUser?: boolean | false) => {
        try {
            setUsername(username);
            setEmail(email);
            
            if (newUser) {
                const response = await createUser({ username, email });
                const userId = response.id;
                setUserId(userId);
                setIsAuthenticated(true);
                if (createUserError) {
                    console.error("Error creating user:", createUserError);
                    throw createUserError;
                }
                return;
            } else {
                const userId = user?.id;
                setUserId(userId);
                setIsAuthenticated(true);
                if (userError) {
                    console.error("Error fetching user:", userError);
                    throw userError;
                }
                return;
            }
            
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
