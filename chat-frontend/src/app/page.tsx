import React, { useState } from 'react'
import ChatWindow from '../components/ChatWindow.tsx'
import InputBox from '../components/InputBox.tsx'
import { Message } from '../types/message.tsx'
import { sendMessage } from '../api/api.ts'

export default function Page() {
    const [isTyping, setIsTyping] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);

    const handleSendMessage = async (message: string) => {
        const userMsg: Message = {
            user_id: 'user',
            session_id: '1234567890',
            ui_metadata: {},
            role: 'user',
            content: message,
            timestamp: new Date().toISOString(),
            conversation_id: '1234567890',
            flags: {}
        };
        setMessages(prevMessages => [...prevMessages, userMsg]);
        setIsTyping(true);
        try {
            const reply = await sendMessage(message);
            const botMsg: Message = {
                user_id: 'user',
                session_id: '1234567890',
                ui_metadata: {},
                role: 'bot',
                content: reply,
                timestamp: new Date().toISOString(),                
                conversation_id: '1234567890',                
                flags: {}                
            };
            setMessages(prevMessages => [...prevMessages, botMsg]);
        } catch(err) {
            console.error(err);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <main className = "h-screen flex flex-col items-center justify-between bg-gray-900 text-white">
            <div className = 'max-w-3xl w-full flex-1 p-4 overflow-y-auto'>
                <ChatWindow message={messages}/>
                {isTyping && <div className='mt-2 text-gray-400'> Typing...</div>}
            </div>
            <InputBox onSendMessage={handleSendMessage} />
        </main>

    );
}