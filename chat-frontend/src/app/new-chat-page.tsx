import React, { useState, useEffect, useRef } from 'react';
import { Message } from '../types/message';
import { sendMessage, fetchMessagesHistory, createConversation } from '../api/api';
import { useUserStore } from '../types/UserStore';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

// Components
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import MessageList from '../components/MessageList';
import ChatInput from '../components/ChatInput';
import LoadingSpinner from '../components/LoadingSpinner';

export default function ChatPage() {
  // State management
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, setUser, conversation_id, setConversationId } = useUserStore();
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Load conversation history when conversation changes
  useEffect(() => {
    if (conversation_id && user) {
      setIsLoadingHistory(true);
      setMessages([]);
      
      fetchMessagesHistory(conversation_id, user)
        .then(data => {
          if (data && Array.isArray(data)) {
            setMessages(data);
          } else {
            console.warn('Received invalid data from history API:', data);
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
  }, [conversation_id, user]);
  
  // Create a new conversation if needed
  const handleNewConversation = async () => {
    try {
      if (!user) {
        console.warn('Cannot create conversation: No user ID');
        return;
      }
      
      const result = await createConversation(user);
      if (result && result.id) {
        setConversationId(result.id);
      }
    } catch (error) {
      console.error('Failed to create new conversation:', error);
    }
  };
  
  // Handle sending a message
  const handleSendMessage = async (messageText: string) => {
    if (!messageText.trim()) return;
    
    // Create a new conversation if none exists
    if (!conversation_id && user) {
      await handleNewConversation();
    }
    
    // Add user message to UI immediately
    const userMsg: Message = {
      user_id: user || 'guest',
      session_id: '1234567890',
      ui_metadata: {},
      role: 'user',
      content: messageText,
      timestamp: new Date().toISOString(),
      conversation_id: conversation_id,
      flags: {}
    };
    
    setMessages(prevMessages => [...prevMessages, userMsg]);
    setIsTyping(true);
    
    try {
      const reply = await sendMessage(messageText, conversation_id, user);
      
      if (reply.status === 'success') {
        // Set user and conversation IDs if they're not set
        if (!user && reply.ChatSession.user_id) {
          setUser(reply.ChatSession.user_id);
        }
        
        if (!conversation_id && reply.ChatSession.conversation_id) {
          setConversationId(reply.ChatSession.conversation_id);
        }
        
        // Add bot response to messages
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
        
        setMessages(prevMessages => [...prevMessages, botMsg]);
      } else {
        console.error(reply.error);
        // Add error message
        const errorMsg: Message = {
          user_id: user || 'guest',
          session_id: '1234567890',
          ui_metadata: {},
          role: 'bot',
          content: 'Sorry, there was an error processing your request.',
          timestamp: new Date().toISOString(),
          conversation_id: conversation_id,
          flags: { error: true }
        };
        
        setMessages(prevMessages => [...prevMessages, errorMsg]);
      }
    } catch (err) {
      console.error(err);
      // Add error message
      const errorMsg: Message = {
        user_id: user || 'guest',
        session_id: '1234567890',
        ui_metadata: {},
        role: 'bot',
        content: 'Sorry, there was an error connecting to the server.',
        timestamp: new Date().toISOString(),
        conversation_id: conversation_id,
        flags: { error: true }
      };
      
      setMessages(prevMessages => [...prevMessages, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };
  
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Sidebar for conversation management */}
      <div 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:relative md:translate-x-0`}
      >
        <Sidebar 
          onNewConversation={handleNewConversation}
          onClose={() => setIsSidebarOpen(false)}
        />
      </div>
      
      {/* Main chat area */}
      <div className="flex flex-col flex-1 h-full overflow-hidden">
        {/* Header */}
        <Header 
          onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} 
        />
        
        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900">
          {isLoadingHistory ? (
            <div className="flex items-center justify-center h-full">
              <LoadingSpinner />
              <p className="ml-2 text-gray-500 dark:text-gray-400">Loading conversation...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <h2 className="text-2xl font-bold mb-2">Welcome to Memory Chat</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Start a conversation by typing a message below.
              </p>
            </div>
          ) : (
            <MessageList 
              messages={messages} 
              isTyping={isTyping} 
            />
          )}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Input area */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
          <ChatInput 
            onSendMessage={handleSendMessage} 
            disabled={isTyping || isLoadingHistory}
          />
        </div>
      </div>
    </div>
  );
}
