import { Message } from '../types/message.tsx';
import ChatMessage from './ChatMessages.tsx';
import React from 'react';

const ChatWindow = ({ message }: { message: Message[] }) => {
    return (
        <div className="space-y-4 p-4">
            {message.map((message, index) => (
                <ChatMessage key={index} message={message} />
            ))}
        </div>
    );
}

export default ChatWindow