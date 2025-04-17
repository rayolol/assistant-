import React, { useState, useEffect } from 'react'
import ChatWindow from '../components/ChatWindow.tsx'
import InputBox from '../components/InputBox.tsx'
import { Message } from '../types/message.tsx'
import { sendMessage, fetchMessagesHistory } from '../api/api.ts'
import { useUserStore } from '../types/UserStore.tsx'

export default function Page() {
    const [isTyping, setIsTyping] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const {user, setUser, conversation_id, setConversationId} = useUserStore();

    useEffect(() => {
        if (user && conversation_id) {
            fetchMessagesHistory(conversation_id, user).then(data => {
                if (data && Array.isArray(data)) {
                    setMessages(prev_data => [...data, ...prev_data]);
                } 
            })
        }

    }, [conversation_id, user])
    

    const handleSendMessage = async (message: string) => {
        const userMsg: Message = {
            user_id: user, 
            session_id: '1234567890',
            ui_metadata: {},
            role: 'user',
            content: message,
            timestamp: new Date().toISOString(),
            conversation_id: conversation_id,
            flags: {}
        };
        setMessages(prevMessages => [...prevMessages, userMsg]);
        setIsTyping(true);
        try {

            const reply = await sendMessage(message, conversation_id, user);
            if (reply.status === 'success') {

                if (!user && reply.ChatSession.user_id)
                    setUser(reply.ChatSession.user_id);

                if (!conversation_id && reply.ChatSession.conversation_id)
                    setConversationId(reply.ChatSession.conversation_id);
            } else {
                console.error(reply.error);
            }
            const botMsg: Message = {
                user_id: user,
                session_id: '1234567890',
                ui_metadata: {},
                role: 'bot',
                content: reply.response,
                timestamp: new Date().toISOString(),                
                conversation_id: conversation_id,                
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