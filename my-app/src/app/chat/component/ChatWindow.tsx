"use client";

import React, { useEffect, useRef, useMemo} from 'react';
import { useUserStore } from '../../../../types/UserStore';
import { Message } from '../../../../types/message';
import { useChathistory } from '../../hooks/hooks';
import Link from 'next/link';
import TypingIndicator from './TypingIndicator';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { useMessageHandling } from '../../hooks/useMessageHandling';

// Set display name for memo component


const ChatWindow: React.FC = () => {
    const { conversation_id, userId, sessionId,username, isAuthenticated } = useUserStore();
    const { pendingMessages, input, setInput, isStreaming, handleSendMessage } = useMessageHandling(userId, sessionId, conversation_id);
    const { data: fetchedMessages = [], isLoading, error } = useChathistory(conversation_id, userId, sessionId);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Combine fetched messages with pending messages using useMemo to avoid unnecessary re-renders
    const messages = useMemo(() => {
        return [...fetchedMessages, ...pendingMessages];
    }, [fetchedMessages, pendingMessages]);

    // Scroll to bottom when messages change
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);



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
    //TODO: clean this area

    return (
        <div className={`flex flex-col h-full w-full max-w-4xl mx-auto transition-all duration-300 ease-in-out ${messages.length === 0 && 'justify-center'}` }>
            {/* Messages display area */}

            {messages.length > 0 &&

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
                <div ref={messagesEndRef} />
            </div>}


            {/* Message input area */}
            <footer className={`flex flex-col justify-center align-center w-full `}>
                {messages.length === 0 && (
                    <>
                        <h1 className="font-semibold text-2xl text-center text-white">Welcome! {username}</h1>
                        {conversation_id === 'pending' && (
                            <p className="text-center text-gray-300 mt-2 mb-4">
                                Type a message to start a new conversation
                            </p>
                        )}
                    </>
                )}
                <ChatInput
                isStreaming={isStreaming}
                input={input}
                setInput={setInput}
                handleSendMessage={handleSendMessage}
                />
            </footer>
        </div>
    );
}

export default ChatWindow;
