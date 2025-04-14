import axios from 'axios'
import {useState} from 'react'


export default function Message() {

    const [responses, setResponse] = useState([]);
    const [message, setMessage] = useState('');

    const submit = () => {
        fetchmessage(message);
    };

    
    const api = axios.create({
        baseURL: 'http://localhost:8000'
    });

    const fetchmessage = async (message) => {
        try {
            const response = await api.post('chat', {
                user_id: "user",
                session_id: "1234567890",
                conversation_id: "1234567890",
                ui_metadata: {},
                flags: {},
                message: message
            }); //change to /chat, change to response.data.response
            console.log(response.data);
            setResponse(response.data.response);
            if (response.data.status === "error") {
                throw new Error(response.data.error);
            }
        } catch (error) {
            setResponse(error.message);
            console.error(error)
        }
    };

    return (
        <div>
            <input type = "text" onChange = {(e) => setMessage(e.target.value)} placeholder = "Enter your message"></input>
            <button onClick = {submit}>Send</button>
            {responses}
        </div>
    )
}