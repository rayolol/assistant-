"use client";
//import { UserPreferencesSchema } from '../types/zodTypes/userPreferences';
import axios from 'axios';
import { ConversationSchema, Message,MessageSchema, Conversation, User, UserSchema } from '../types/schemas';  
import { z } from "zod";

export const baseURL = 'http://localhost:8001'

const instance = axios.create({
    baseURL: baseURL
});
export const createUser = async (userInfo: {username: string, email: string}): Promise<User> => {
    try {
        const response = await instance.post('/users/create-user', userInfo);
        return UserSchema.parse(response.data);
    } catch (error) {
        console.error("Error creating user:", error);
        throw error;
    }
}

export const sendMessage = async (message: Message): Promise<Message> => {
    try {
        const response = await instance.post('/chat', message);
        return MessageSchema.parse(response.data);
    } catch (error) {
        console.error("Error sending message:", error);
        throw error;
    }
}

export const fetchMessagesHistory = async (conversation_id: string, user_id: string | null, session_id: string | null = "1234567890"): Promise<Message[]> => {
    try {
        console.log("Fetching messages history for:", { conversation_id, user_id, session_id });
        const response = await instance.get(`/chat/history/${conversation_id}/${user_id}/${session_id}`);

        return z.array(MessageSchema).parse(response.data);

    } catch (error) {
        console.error("Error fetching message history:", error);
        throw error;
    }
}

export const fetchConversations = async (user_id: string): Promise<Conversation[]> => {
    try {
        console.log("Fetching conversations for user:", user_id);
        const response = await instance.get(`/chat/conversations/${user_id}`);
        console.log("Raw conversations response:", response.data);

           return z.array(ConversationSchema).parse(response.data);
        
    } catch (error) {
        console.error("Error fetching conversations:", error);
        return [];
    }
}

export const createConversation = async (user_id: string, name?: string): Promise<Conversation> => {
    try {
    const response = await instance.post(`/chat/create-conversations/${user_id}`,
            name ? { name } : undefined
        );
        return ConversationSchema.parse(response.data);
    } catch (error) {
        console.error("Error creating conversation:", error);
        throw error;
    }
}

export const fetchUserId = async (userInfo: {username: string, email: string}): Promise<User> => {
    try {
        console.log("Fetching user ID for:", userInfo);
        // Change from GET to POST and send data in request body
        const response = await instance.post('/users/get-user-id', {
            username: userInfo.username,
            email: userInfo.email
        });
        console.log("Raw API response:", response.data);
        return UserSchema.parse(response.data);
    } catch (error) {
        console.error("Error fetching user info:", error);
        throw error;
    }
}

export const deleteConversation = async (conversation_id: string) => {
    try {
        const response = await instance.delete(`/chat/conversations/${conversation_id}`);
        return response.data;
    } catch (error) {
        console.error("Error deleting conversation:", error);
        throw error;
    }
}
//TODO: fix the type error
// export const updateUserInfo = async (userPreferences: z.infer<typeof UserPreferencesSchema>) => {
//     try {
//         const response = await instance.put(`/users/update-user-info/${userPreferences.user_id}`, userPreferences);
//         return response.data;
//     } catch (error) {
//         console.error("Error updating user info:", error);
//         throw error;
//     }
// }

export default instance;
