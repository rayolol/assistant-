"use client";

import axios from 'axios';
import { Message } from '../../../types/message';

const instance = axios.create({
    baseURL: 'http://localhost:8000'
});

export const sendMessage = async (message: Message) => {
    try {
        const response = await instance.post('/chat', message);

        return response.data;
    } catch (error) {
        console.error("Error sending message:", error);
        throw error;
    }
}

export const fetchMessagesHistory = async (conversation_id: string, user_id: string | null, session_id: string | null) => {
    try {
        console.log("Fetching messages history for:", { conversation_id, user_id });
        const response = await instance.get(`/chat/${conversation_id}/${user_id}/${session_id}`);
        console.log("Raw API response:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error fetching message history:", error);
        throw error;
    }
}

export const fetchConversations = async (user_id: string) => {
    try {
        const response = await instance.get(`/chat/conversations/${user_id}`);
        // The backend already returns { data: [...] }, so we don't need to wrap it again
        return response.data;
    } catch (error) {
        console.error("Error fetching conversations:", error);
        return { data: [] };
    }
}

export const createConversation = async (user_id: string, name?: string) => {
    try {
        const response = await instance.post(`/chat/conversations/${user_id}`,
            name ? { name } : undefined
        );
        return response.data; // This will return { id: conversation_id }
    } catch (error) {
        console.error("Error creating conversation:", error);
        throw error;
    }
}

export const fetchUserId = async (userInfo: {username: string, email: string}) => {
    try {
        console.log("Fetching user ID for:", userInfo);
        // Change from GET to POST and send data in request body
        const response = await instance.post('/users/get-user-id', {
            username: userInfo.username,
            email: userInfo.email
        });
        console.log("Raw API response:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error fetching user info:", error);
        throw error;
    }
}

export default instance;
