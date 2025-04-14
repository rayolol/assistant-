import React, {useState} from 'react'

const InputBox = ({onSendMessage}: {onSendMessage: (message: string) => void}) => {
    const [message, setMessage] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (message.trim()) {
            onSendMessage(message);
            setMessage('')
        }
    };

    return (
        <form onSubmit={handleSubmit} className="w-full max-w-3xl p-4 flex gap-2 bg-gray-800">
            <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 p-2 rounded bg-gray-700 text-white outline-none"
            />
            <button type="submit" className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700">
                Send
            </button>
        </form>
    )
}

export default InputBox