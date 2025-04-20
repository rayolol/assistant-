import React, { useState, useEffect } from 'react'
import ChatWindow from '../components/ChatWindow.tsx'
import InputBox from '../components/InputBox.tsx'
import { Message } from '../types/message.tsx'
import { sendMessage, fetchMessagesHistory } from '../api/api.ts'
import { useUserStore } from '../types/UserStore.tsx'
import SideBar from '../components/sideBar.tsx'

export default function Page() {
    const [isTyping, setIsTyping] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const {user, setUser, conversation_id, setConversationId} = useUserStore();

    // Clear messages when conversation changes
    useEffect(() => {
        if (conversation_id) {
            // Clear messages when switching conversations
            setMessages([]);
            console.log("Conversation changed to:", conversation_id);
            
            // Only load history if we have both user and conversation_id
            if (user) {
                setIsLoadingHistory(true);
                fetchMessagesHistory(conversation_id, user)
                    .then(data => {
                        if (data && Array.isArray(data)) {
                            setMessages(data);
                            console.log(`Loaded ${data.length} messages for conversation ${conversation_id}`);
                        } else {
                            console.warn('Received non-array data from history API:', data);
                            setMessages([]);
                        }
                    })
                    .catch(error => {
                        console.error('Failed to load message history:', error);
                        setMessages([]);
                    })
                    .finally(() => {
                        setIsLoadingHistory(false);
                    });
            }
        }
    }, [conversation_id, user]);

    // Remove the separate useEffect for loading history to avoid duplicate loading


    const handleSendMessage = async (message: string) => {
        // Don't send empty messages
        if (!message.trim()) return;
        
        // Add user message to UI immediately
        const userMsg: Message = {
            user_id: user || 'guest', 
            session_id: '1234567890',
            ui_metadata: {},
            role: 'user',
            content: message,
            timestamp: new Date().toISOString(),
            conversation_id: conversation_id,
            flags: {}
        };
        
        // Use functional update to ensure we're working with the latest state
        setMessages(prevMessages => [...prevMessages, userMsg]);
        setIsTyping(true);
        
        try {
            const reply = await sendMessage(message, conversation_id, user);
            
            if (reply.status === 'success') {
                // Set user and conversation IDs if they're not set
                if (!user && reply.ChatSession.user_id)
                    setUser(reply.ChatSession.user_id);

                if (!conversation_id && reply.ChatSession.conversation_id)
                    setConversationId(reply.ChatSession.conversation_id);
                
                // Add only the bot's response, not the entire history
                const botMsg: Message = {
                    user_id: user || 'guest',
                    session_id: '1234567890',
                    ui_metadata: {},
                    role: 'bot',
                    content: reply.response,
                    timestamp: new Date().toISOString(),                
                    conversation_id: conversation_id || reply.ChatSession.conversation_id,                
                    flags: {}                
                };
                
                // Use functional update to ensure we're working with the latest state
                setMessages(prevMessages => [...prevMessages, botMsg]);
            } else {
                console.error(reply.error);
            }
        } catch(err) {
            console.error(err);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="flex h-screen flex-row">
            <SideBar/>
            <main className="w-full h-screen flex flex-col items-center justify-between bg-gray-900 text-white">
                <div className="max-w-3xl w-full flex-1 p-4 overflow-y-auto">
                    {isLoadingHistory ? (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-gray-400">Loading conversation history...</p>
                        </div>
                    ) : (
                        <ChatWindow message={messages} isTyping={isTyping}/>
                    )}
                </div>
                <InputBox onSendMessage={handleSendMessage} />
            </main>
        </div>
    );
}
