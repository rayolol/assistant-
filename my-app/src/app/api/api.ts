"use client";
//import { UserPreferencesSchema } from '../types/zodTypes/userPreferences';
import axios from 'axios';
import { ConversationSchema, Message,MessageSchema, Conversation, User, UserSchema, Promptsettings, PromptSettingsSchema, FileAttachmentSchema, FileAttachment } from '../types/schemas';  
import { z } from "zod";

export const baseURL = 'http://localhost:8001'

export const instance = axios.create({
    baseURL: baseURL
});

export const fetchPromptSettings = async (user_id: string): Promise<Promptsettings> => {
    try {
        const response = await instance.get(`/users/get-prompt-settings/${user_id}`);
        console.log("Raw API response:", response.data);
        return PromptSettingsSchema.parse(response.data);
    } catch (error) {
        console.error("Error fetching prompt settings:", error);
        throw error;
    }
}


export const updatePromptSettings = async (promptSettings: Promptsettings): Promise<Promptsettings> => {
    try {
        const response = await instance.put(`/users/update-prompt-settings/${promptSettings.user_id}`, promptSettings);
        console.log("Raw API response:", response.data);
        return PromptSettingsSchema.parse(response.data);
    } catch (error) {
        console.error("Error updating prompt settings:", error);
        throw error;
    }
}

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
        console.log("Raw messages history response:", response.data);
        const clean =  z.array(MessageSchema).parse(response.data);
        console.log("parsed response: ", clean);
        return clean;

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

export const uploadFile = async (file: File, user_id: string, conversation_id: string): Promise<string> => {
    const formData = new FormData();

    formData.append('file', file);
    formData.append('user_id', user_id);
    formData.append('conversation_id', conversation_id);

    try {
        const response = await instance.post('/files/upload-file', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    } catch (error) {
        console.error("Error uploading file:", error);
        throw error;
    }

}

export const getFile = async (fileId: string): Promise<FileAttachment> => {
    try {
        const response = await instance.get(`/file/metadata/${fileId}`);
        return FileAttachmentSchema.parse(response.data);
    } catch (error) {
        console.error("Error getting file:", error);
        throw error;
    }
}