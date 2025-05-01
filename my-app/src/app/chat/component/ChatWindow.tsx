"use client";

import React, { useEffect, useRef} from 'react';
import { useUserStore } from '../../hooks/StoreHooks/UserStore';
import { Message } from '../../../../types/message';
import Link from 'next/link';
import TypingIndicator from './TypingIndicator';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { useMessageHandling } from '../../hooks/useMessageHandling';
import { useMessageStore } from '@/app/hooks/StoreHooks/useMessageStore';
import StreamingMessage from './StreamingMessage';


const ChatWindow: React.FC = () => {
    const { userId, sessionId,username, isAuthenticated } = useUserStore();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { sendMessage, response, isStreaming, isLoading, error, messages } = useMessageHandling();
    const { currentConversationId } = useMessageStore();

    // Scroll to bottom when messages change
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const ResponseOBJ: Message = {
        user_id: userId,
        session_id: sessionId || "1234567890",
        conversation_id: currentConversationId,
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString(),
        ui_metadata: {},
        flags: {}
    }




    if (!isAuthenticated) {
        return (
            <div className="flex items-center justify-center h-full w-full text-red-500">
                <div className="text-center p-4 bg-red-50 rounded-lg">
                    <p className="font-semibold m-3">You must be logged in to chat</p>
                    <Link href="/login" className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                        Login
                    </Link>
                </div>
            </div>
        );
    }

    if (isLoading) return (
        <div className="flex items-center justify-center h-full w-full">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
    );

    if (error) return (
        <div className="flex items-center justify-center h-full w-full text-red-500">
            <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="font-semibold">Error loading messages</p>
                <p className="text-sm">{error.message}</p>
            </div>
        </div>
    );

    return (
        <div className={`flex flex-col h-full w-full max-w-4xl mx-auto transition-all duration-300 ease-in-out ${messages && messages.length === 0 && 'justify-center'}` }>
            {/* Messages display area */}

            {messages && messages.length > 0 &&

            <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-full">
                {messages && messages.length > 0 && (
                    messages.map((msg: Message, index: number) => (
                        <ChatMessage key={`${msg.timestamp}-${index}`} message={msg} />
                    ))
                )}
                {isStreaming && (
                    <div className="flex justify-start">
                        <TypingIndicator />
                    </div>
                )}
                {response && (
                    <div className="flex justify-start">
                        <StreamingMessage streamContent = {response} message={ResponseOBJ} />
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>}


            {/* Message input area */}
            <footer className={`flex flex-col justify-center align-center w-full `}>
                {messages &&messages.length === 0 && (
                    <>
                        <h1 className="font-semibold text-2xl text-center text-white">Welcome! {username}</h1>
                     
                    </>
                )}
                <ChatInput
                isStreaming={isStreaming}
                sendMessage={(message) => sendMessage(message)}
                />
            </footer>
        </div>
    );
}

export default ChatWindow;
