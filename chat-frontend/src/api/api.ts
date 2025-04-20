import axios from 'axios';

const instance = axios.create({
    baseURL: 'http://localhost:8000'
});

export const sendMessage = async (message: string, conversation_id: string | null, user_id: string | null) => {
    const response = await instance.post('/chat', {
        user_id: user_id,
        session_id: "1234567890",
        conversation_id: conversation_id,
        message: message,
        ui_metadata: {},
        flags: {}
    });

    return response.data;
}

export const fetchMessagesHistory = async (conversation_id: string, user_id: string) => {
    const response = await instance.get(`/chat/${conversation_id}/${user_id}`);
    return response.data;
}

export const fetchConversations = async (user_id: string) => {
    try {
        const response = await instance.get(`/chat/conversations/${user_id}`);
        return { data: response.data }; // Wrap in data property to match expected format
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

export default instance;
