import {useState} from 'react'
import axios from 'axios'
import ChatboxInput from './chatboxInput';



function Component() {
    const [response, setResponse] = useState('');
    const [Loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const instance = axios.create({
        baseURL: 'http://localhost:8000'
    });
    

    const sendMessage = async () => {
        setLoading(true);
        try {
            const response = await instance.post('/chat', {
                user_id: "user",
                session_id: "1234567890",
                conversation_id: "1234567890",
                ui_metadata: {},
                flags: {},
                message: message
            });
            setResponse(response.data.response);
            setLoading(false);
            console.log("succes fetch: ", response.data);
        } catch (error) {
            console.error("error during fetch: ", error);
            setLoading(false);
        }
    }
    const messages = (response) => {
        return response.map((response) => {
            return response.role === "user" ? (
                <div className="user-message">
                    <p>{response.content}</p>
                </div>
            ) : (
                <div className="assistant-message">
                    <p>{response.content}</p>
                </div>
            );
        });
    }

    return (
        <div>
            <div className= "flex flex-col">
                {messages(response)}
            </div>
            <ChatboxInput CallBackSend={sendMessage} CallBackChange={setMessage}/>
        </div>
    );
}
export default Component;