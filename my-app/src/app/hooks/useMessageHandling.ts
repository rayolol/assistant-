"use client";

import { useState, useCallback, useEffect} from 'react';
import { Message } from '../../../types/message';
import { useStreamedResponse, useCreateConversation } from './hooks';
import { useUserStore } from '../../../types/UserStore';

export function useMessageHandling(userId: string, sessionId: string, conversation_id: string | null | undefined) {
  const [pendingMessages, setPendingMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const { setConversationId } = useUserStore();
  const { mutate: createConversation } = useCreateConversation();

  const { response: streamedResponse, isStreaming, startStreaming, resetStreaming } = useStreamedResponse();

  useEffect(() => {
    // Clear all chat-related state when conversation changes
    setPendingMessages([]);
    setInput('');

    // Reset the streamed response
    resetStreaming();

  }, [conversation_id, resetStreaming])

  // Update assistant message when streaming
  useEffect(() => {
    if (streamedResponse && conversation_id) {
      const assistantMessage: Message = {
        user_id: userId,
        session_id: !sessionId ? "1234567890" : sessionId,
        conversation_id: conversation_id,
        role: 'assistant',
        content: streamedResponse,
        timestamp: new Date().toISOString(),
        ui_metadata: {},
        flags: {}
      };

      setPendingMessages(prev => {
        let assistantIndex = -1;
        for (let i = prev.length - 1; i >= 0; i--) {
          if (prev[i].role === 'assistant') {
            assistantIndex = i;
            break;
          }
        }

        if (assistantIndex !== -1) {
          const newMessages = [...prev];
          newMessages[assistantIndex] = assistantMessage;
          return newMessages;
        } else {
          return [...prev, assistantMessage];
        }
      });
    }
  }, [streamedResponse, userId, sessionId, conversation_id]);

  // Send a message with a valid conversation ID
  const sendMessage = useCallback((convId: string) => {
    const userMessage: Message = {
      user_id: userId,
      session_id: !sessionId ? "1234567890" : sessionId,
      conversation_id: convId,
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
      ui_metadata: {},
      flags: {}
    };

    setPendingMessages(prev => [...prev, userMessage]);

    const assistantPlaceholder: Message = {
      user_id: userId,
      session_id: !sessionId ? "1234567890" : sessionId,
      conversation_id: convId,
      role: 'assistant',
      content: '...',
      timestamp: new Date().toISOString(),
      ui_metadata: {},
      flags: {}
    };

    setPendingMessages(prev => [...prev, assistantPlaceholder]);
    startStreaming(userMessage);
    setInput('');
  }, [input, userId, sessionId, setPendingMessages, startStreaming, setInput]);

  // Handle sending a message
  const handleSendMessage = useCallback(() => {
    if (!input.trim() || isStreaming) return;

    // If we don't have a valid conversation ID, create one first
    if (!conversation_id || conversation_id === 'None' || conversation_id === 'pending') {
      if (userId) {
        console.log("Creating new conversation before sending message");

        createConversation({ user_id: userId, name: "New Conversation" }, {
          onSuccess: (data) => {
            console.log("Conversation created successfully:", data);
            if (data.id) {
              // Update the conversation ID in the store
              setConversationId(data.id);

              // Send the message with the new conversation ID
              sendMessage(data.id);
            }
          },
          onError: (error) => {
            console.error("Error creating conversation:", error);
          }
        });
      } else {
        console.error("Cannot create conversation: userId is missing");
      }
    } else {
      // We have a valid conversation ID, send the message
      sendMessage(conversation_id);
    }
  }, [input, isStreaming, userId, conversation_id, createConversation, setConversationId, sendMessage]);

  return {
    pendingMessages,
    setPendingMessages,
    input,
    setInput,
    isStreaming,
    handleSendMessage
  };
}