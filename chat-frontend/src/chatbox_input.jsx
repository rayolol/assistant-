import {useState, useEffect} from 'react'



export default function Chatbox() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');


const setMessage = () => {
    setMessages([...messages, input]);
    setInput('');
}

return (
    
    <div className = "chatbox-container">
        <div className = "chatbox-input">
            <input type = "text" onChange = {(e) => setInput(e.target.value)} placeholder = "Enter your message"></input>
            <button onClick = {setMessage}>Send</button>
        </div>
    </div>
)
}