import axios from 'axios';
import { Conversation } from '../types/message.tsx';

const instance = axios.create({
    baseURL: 'http://localhost:8000'
});

export const sendMessage = async (message: string, conversation_id: string, user_id: string, session_id: string) => {
    const response = await instance.post('/chat', {
        user_id: user_id,
        session_id: session_id,
        conversation_id: conversation_id,
        message: message,
        ui_metadata: {},
        flags: {}
    });

    return response.data.response;
}
// returns the array of conversations of the user
export const fetchConversations = async (user_id: string): Promise<Conversation[]> => {
    const response = await instance.get(`/conversations/${user_id}`);
    return response.data;
}

export const deleteConversation = async (conversation_id: string) => {
    const response = await instance.delete(`/conversations/${conversation_id}`);
    return response.data;
}
// creates a new conversation and returns the conversation object
export const createConversation = async (conversation_id: string): Promise<Conversation> => {
    const response = await instance.post('/conversations', {
        conversation_id: conversation_id
    }
);
    return response.data;
}


export default instance;
