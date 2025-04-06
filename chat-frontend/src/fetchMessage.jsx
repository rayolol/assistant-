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
            const response = await api.post('chat', {message}); //change to /chat
            setResponse(response.data.response); //change to response.data.response
        } catch (error) {
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