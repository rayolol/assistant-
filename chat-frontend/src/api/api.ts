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

export default instance;
