import { Message } from '../types/message.tsx';
import ChatMessage from './ChatMessages.tsx';
import TypingIndicator from './TypingIndicator.tsx';
import React from 'react';

const ChatWindow = ({ message, isTyping }: { message: Message[], isTyping?: boolean }) => {
    return (
        <div className="space-y-4 p-4">
            {message.map((message, index) => (
                <ChatMessage key={index} message={message} />
            ))}
            {isTyping && (
                <div className="flex justify-start mb-4">
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center mr-2">
                        <span className="text-white text-xs font-bold">AI</span>
                    </div>
                    <TypingIndicator />
                </div>
            )}
        </div>
    );
}

export default ChatWindow
