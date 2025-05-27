"use client";

import React, { useEffect, useRef} from 'react';
import { useUserStore } from '../../hooks/StoreHooks/UserStore';
import { Message } from '../../types/message';
import Link from 'next/link';
import TypingIndicator from './TypingIndicator';
import ChatMessage from './ChatMessage';
import { useMessageHandling } from '../../hooks/useMessageHandling';
import { useMessageStore } from '@/app/hooks/StoreHooks/useMessageStore';
import StreamingMessage from './StreamingMessage';
import ChatInput from './ChatInput';

const ChatWindow: React.FC = () => {
    const { userId, sessionId, username, isAuthenticated } = useUserStore();
    const { currentConversationId } = useMessageStore();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { response, isStreaming, sendMessage, messages, isLoading, error } = useMessageHandling();


    // Scroll to bottom when messages change or response updates
    useEffect(() => {
        if (messagesEndRef.current) {
            // Use requestAnimationFrame for smoother scrolling
            requestAnimationFrame(() => {
                messagesEndRef.current?.scrollIntoView({ 
                    behavior: isStreaming ? 'auto' : 'smooth',
                    block: 'end'
                });
            });
        }
    }, [isStreaming, messages]);

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
        <div className="flex flex-col h-full">
            <div className={`flex-1 max-w-4xl p-4 sm:p-4 space-y-4 sm:space-y-4 ${messages && messages.length === 0 ? 'flex items-center justify-center' : ''}`}>
                {/* Messages display area */}
                {messages && messages.length > 0 ? (
                    <>
                        {messages.map((msg: Message, index: number) => (
                            <ChatMessage key={`${msg.timestamp}-${index}-${msg.role}`} message={msg} />
                        ))}
                        {(isStreaming) && (
                            <div className="flex justify-start w-full">
                                <StreamingMessage streamContent={response} message={ResponseOBJ} />
                            </div>
                        )}
                        {isStreaming && (
                            <div className="flex justify-start w-full">
                                <TypingIndicator />
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center px-4 py-8 text-black dark:text-white">
                        <h1 className="font-semibold text-xl sm:text-2xl text-center mb-4">
                            Welcome, {username}!
                        </h1>
                        <p className="text-gray-800 dark:text-gray-300 max-w-md mx-auto">
                            Start a new conversation by typing a message below.
                        </p>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
           
        </div>
    );
}

export default ChatWindow;
