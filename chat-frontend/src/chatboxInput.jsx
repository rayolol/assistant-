import "./ChatBox.css"

export default function ChatboxInput( CallBackChange, CallBackSend ) {

    const handleChange = (e) => {
        CallBackChange(e.target.value);
    };
    const handleSend = () => {
        CallBackSend();
    };

    return( 
        <div className = "chatbox-container">
            <div className = "chatbox-input">
                <input type = "text" onChange={handleChange} placeholder = "Enter your message"></input>
                <button onClick = {handleSend}>Send</button>
            </div>
            <div className = "chatbox-tools">
                <button>Tool 1</button>
            </div>
        </div>
    )
}