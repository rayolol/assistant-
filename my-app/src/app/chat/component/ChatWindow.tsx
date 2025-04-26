"use client";

import React, { useEffect, useState, useRef, useCallback, useMemo, memo } from 'react';
import { useUserStore } from '../../../../types/UserStore';
import { Message } from '../../../../types/message';
import { useChathistory, useCreateConversation, useStreamedResponse } from '../../api/hooks';
import Link from 'next/link';
import TypingIndicator from './TypingIndicator';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

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
                <ReactMarkdown
                    components={{
                        code({ node, inline, className, children, ...props}: {
                            node?: any;
                            inline?: boolean;
                            className?: string;
                            children: React.ReactNode;
                            [key: string]: any;
                        }) {
                            const match = /language-(\w+)/.exec(className || '');
                            return !inline && match ? (
                                <SyntaxHighlighter
                                    style={atomDark}
                                    language={match[1]}
                                    PreTag="div"
                                    {...props}
                                >
                                    {String(children).replace(/\n$/, '')}
                                </SyntaxHighlighter>
                            ) : (
                                <code className={className} {...props}>
                                    {children}
                                </code>
                            );
                        }
                    }}
                >
                    {message.content}
                </ReactMarkdown>
            </div>
        </div>
    );
});

// Set display name for memo component
ChatMessage.displayName = 'ChatMessage';

const ChatWindow: React.FC = () => {
    const { conversation_id, userId, sessionId, setConversationId, isAuthenticated } = useUserStore();
    const { data: fetchedMessages = [], isLoading, error } = useChathistory(conversation_id, userId, sessionId);
    const { mutate: createConversation } = useCreateConversation();
    const { response: streamedResponse, isStreaming, startStreaming } = useStreamedResponse(); // Import the hook and its state variables
    const [input, setInput] = useState('');
    const [pendingMessages, setPendingMessages] = useState<Message[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Effect to update the pending messages with the streamed response
    useEffect(() => {
        console.log("useEffect triggered with streamedResponse:", streamedResponse);
        console.log("pendingMessages.length:", pendingMessages.length);

        if (streamedResponse && pendingMessages.length > 0) {
            console.log("Creating assistant message with response:", streamedResponse);

            // Create a new assistant message with the streamed response
            const assistantMessage: Message = {
                user_id: userId,
                session_id: !sessionId ? "1234567890" : sessionId,
                conversation_id: conversation_id || '',
                role: 'assistant',
                content: streamedResponse,
                timestamp: new Date().toISOString(),
                ui_metadata: {},
                flags: {}
            };

            // Update the pending messages with the assistant's response
            setPendingMessages(prev => {
                console.log("Current pending messages:", prev);

                // Find the last assistant message
                let assistantIndex = -1;
                for (let i = prev.length - 1; i >= 0; i--) {
                    if (prev[i].role === 'assistant') {
                        assistantIndex = i;
                        break;
                    }
                }

                if (assistantIndex !== -1) {
                    console.log("Updating existing assistant message at index:", assistantIndex);
                    // Create a new array with the updated assistant message
                    const newMessages = [...prev];
                    newMessages[assistantIndex] = assistantMessage;
                    return newMessages;
                } else {
                    console.log("No assistant message found, adding new one");
                    return [...prev, assistantMessage];
                }
            });
        }
    }, [streamedResponse, userId, sessionId, conversation_id, pendingMessages.length]);

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
        if (!input.trim() || isStreaming) return;
        if (!conversation_id || conversation_id === 'None') {
            console.error("Cannot send message without a valid conversation_id");
            return;
        }

        console.log("Sending message with conversation_id:", conversation_id);

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

        console.log("Created user message:", userMessage);

        // Add the message to pending messages immediately
        setPendingMessages(prev => {
            console.log("Adding user message to pending messages");
            return [...prev, userMessage];
        });

        // Create a placeholder for the assistant's response
        const assistantPlaceholder: Message = {
            user_id: userId,
            session_id: !sessionId ? "1234567890" : sessionId,
            conversation_id: conversation_id,
            role: 'assistant',
            content: '...',
            timestamp: new Date().toISOString(),
            ui_metadata: {},
            flags: {}
        };

        // Add the placeholder message
        setPendingMessages(prev => {
            console.log("Adding assistant placeholder to pending messages");
            return [...prev, assistantPlaceholder];
        });

        // Start streaming the response
        console.log("Starting streaming with message:", userMessage);
        startStreaming(userMessage);

        setInput('');
    }, [input, isStreaming, userId, sessionId, conversation_id, startStreaming, setPendingMessages]);

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
                {isStreaming && (
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
                        disabled={isStreaming}
                        className="flex-1 border text-white border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={!input.trim() || isStreaming}
                        className={`rounded-full p-2 ${!input.trim() || isStreaming
                            ? 'bg-gray-300 cursor-not-allowed'
                            : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
                    >
                        {isStreaming ? (
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
