import axios from 'axios';

const instance = axios.create({
    baseURL: 'http://localhost:8000'
});

export const sendMessage = async (message: string) => {
    const response = await instance.post('/chat', {
        user_id: "user",
        session_id: "1234567890",
        conversation_id: "1234567890",
        message: message,
        ui_metadata: {},
        flags: {}
    });

    return response.data.response;
}

export default instance;
