import {useState, useEffect} from 'react'



export default function Chatbox() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');


const setMessage = () => {
    setMessages([...messages, input]);
    setInput('');
}
const chatbubble = (messages) => {
    return (
        <div className = "chatbubble">
            {messages}
        </div>
    )
}

return (
    
    <div className = "chatbox-container">
        <div className = "messages">
            {messages.map((message, index) => (
                <div key = {index}>{messages.role === "assistant" ? messages.message : chatbubble(messages.message)}</div>
            ))}
        </div>
        <div className = "chatbox-input">
            <input type = "text" onChange = {(e) => setInput(e.target.value)} placeholder = "Enter your message"></input>
            <button onClick = {setMessage}>Send</button>
        </div>
    </div>
)
}