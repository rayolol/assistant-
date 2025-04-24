"use client";

import React, { useEffect, useState, useRef, useCallback, useMemo, memo } from 'react';
import { useUserStore } from '../../../types/UserStore';
import { Message } from '../../../types/message';
import { useChathistory, useSendMessage, useCreateConversation } from '../api/hooks';
import Link from 'next/link';
import TypingIndicator from './TypingIndicator';
// Uncomment these imports after installing the packages
// import ReactMarkdown from 'react-markdown';
// import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
// import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

// Memoized message component for better performance
const ChatMessage = memo(({ message }: { message: Message }) => {
    const isUser = message.role === 'user';

    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
            <div
                className={`max-w-[80%] p-3 rounded-lg ${isUser
                    ? 'bg-blue-500 text-white rounded-tr-none'
                    : 'bg-gray-200 text-gray-800 rounded-tl-none'}`}
            >
                {message.content}
            </div>
        </div>
    );
});

// Set display name for memo component
ChatMessage.displayName = 'ChatMessage';

const ChatWindow: React.FC = () => {
    const { conversation_id, userId, sessionId, setConversationId, isAuthenticated } = useUserStore();
    const { data: fetchedMessages = [], isLoading, error } = useChathistory(conversation_id, userId, sessionId);
    const { mutate: sendMessage, isPending: isSending } = useSendMessage();
    const { mutate: createConversation } = useCreateConversation();
    const [input, setInput] = useState('');
    const [pendingMessages, setPendingMessages] = useState<Message[]>([]);
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

    // Create a new conversation if none exists


    useEffect(() => {
        console.log("EFFECT RUNNING - Conversation check:", {
            conversation_id,
            userId,
            isAuthenticated
        });

        if ((!conversation_id || conversation_id === 'None') && userId && isAuthenticated) {
            console.log("ATTEMPTING TO CREATE conversation for user:", userId);
            createConversation(
                { user_id: userId, name: "New Conversation" },
                {
                    onSuccess: (data) => {
                        console.log("SUCCESS: Created conversation:", data);
                        if (data && data.id) {
                            setConversationId(data.id);
                        }
                    },
                    onError: (error) => {
                        console.error("ERROR: Failed to create conversation:", error);
                    }
                }
            );
        } else {
            console.log("NOT CREATING conversation because:", {
                missingConversationId: !conversation_id || conversation_id === 'None',
                missingUserId: !userId,
                notAuthenticated: !isAuthenticated
            });
        }
    }, [conversation_id, userId, isAuthenticated, createConversation, setConversationId]);

    // Handle sending a message - memoized with useCallback
    const handleSendMessage = useCallback(() => {
        if (!input.trim() || isSending) return;
        if (!conversation_id || conversation_id === 'None') {
            console.error("Cannot send message without a valid conversation_id");
            return;
        }

        // Create the message object
        const userMessage: Message = {
            user_id: userId,
            session_id: !sessionId ? "1234567890" : sessionId,
            conversation_id: conversation_id,
            role: 'user',
            content: input,
            timestamp: new Date().toISOString(),
            ui_metadata: {},
            flags: {}
        };

        // Add the message to pending messages immediately
        setPendingMessages(prev => [...prev, userMessage]);

        // Send the message to the API
        sendMessage(userMessage, {
            onSuccess: () => {
                // Clear pending messages when the API call succeeds
                // The messages will be fetched from the API
                setPendingMessages([]);
            },
            onError: (error) => {
                console.error("Error sending message:", error);
                // Keep the pending message to show the user their message was sent
                // but add an error indicator if needed
            }
        });

        setInput('');
    }, [input, isSending, userId, sessionId, conversation_id, sendMessage, setPendingMessages]);

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
        <div className="flex flex-col h-full w-full max-w-4xl mx-auto">
            {/* Messages display area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages && messages.length > 0 ? (
                    messages.map((msg: Message, index: number) => (
                        <ChatMessage key={`${msg.timestamp}-${index}`} message={msg} />
                    ))
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center text-gray-500">
                            <p className="text-lg">No messages yet</p>
                            <p className="text-sm">Start a conversation!</p>
                        </div>
                    </div>
                )}
                {isSending && (
                    <div className="flex justify-start">
                        <TypingIndicator />
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Message input area */}
            <div className="border-t border-gray-200 p-4">
                <div className="flex items-center space-x-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                        placeholder="Type your message..."
                        disabled={isSending}
                        className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={!input.trim() || isSending}
                        className={`rounded-full p-2 ${!input.trim() || isSending
                            ? 'bg-gray-300 cursor-not-allowed'
                            : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
                    >
                        {isSending ? (
                            <svg className="w-6 h-6 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ChatWindow;
