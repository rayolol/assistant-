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
        // Skip if we don't have both user and conversation_id
        if (!user || !conversation_id) {
            return;
        }
        
        // Add a flag to track if we've already loaded history
        let isHistoryLoaded = false;
        
        const loadHistory = async () => {
            // Skip if we've already loaded history
            if (isHistoryLoaded) {
                return;
            }
            
            try {
                console.log(`Loading history for conversation: ${conversation_id}, user: ${user}`);
                isHistoryLoaded = true; // Set flag before the async call
                
                const data = await fetchMessagesHistory(conversation_id, user);
                if (data && Array.isArray(data)) {
                    // Use a function to update state to avoid race conditions
                    setMessages(prevMessages => {
                        // Check if we already have these messages to avoid duplicates
                        const existingIds = new Set(prevMessages.map(msg => 
                            msg.timestamp + msg.role + msg.content));
                        
                        // Filter out messages we already have
                        const newMessages = data.filter(msg => 
                            !existingIds.has(msg.timestamp + msg.role + msg.content));
                        
                        // Only update if we have new messages
                        if (newMessages.length === 0) {
                            return prevMessages;
                        }
                        
                        console.log(`Adding ${newMessages.length} new messages to history`);
                        return [...newMessages, ...prevMessages];
                    });
                } else {
                    console.warn('Received non-array data from history API:', data);
                }
            } catch (error) {
                console.error('Failed to load message history:', error);
                isHistoryLoaded = false; // Reset flag on error to allow retry
            }
        };
        
        loadHistory();
        
        // Cleanup function to handle component unmount
        return () => {
            isHistoryLoaded = true; // Prevent any pending async operations
        };
    }, [user, conversation_id]); // Only re-run when user or conversation_id changes
    

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
