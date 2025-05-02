"use client";
import { useEffect } from 'react';
import { Message } from '../../../types/message';
import { useStreamedResponse } from './useStreamingResponse';
import { useUserStore } from './StoreHooks/UserStore';
import { useMessageStore } from './StoreHooks/useMessageStore';
import { useChathistory, useCreateConversation } from './hooks';

export function useMessageHandling() {
  const { userId, sessionId } = useUserStore();
  const { currentConversationId, setMessages, messages, setCurrentConversationId } = useMessageStore();

  const { response, isStreaming, startStreaming, resetStreaming } = useStreamedResponse();
  const { data: fetchedMessages = [], isLoading, error, refetch } = useChathistory(currentConversationId, userId, sessionId);
  const { mutate: createConversation } = useCreateConversation();

  // Clear messages when conversation changes
  useEffect(() => {
    console.log("Conversation changed to:", currentConversationId);
    // First clear the messages
    setMessages([]);
    
    // Then refetch messages for the new conversation
    if (currentConversationId && userId && sessionId) {
      refetch();
    }
  }, [currentConversationId, userId, sessionId, refetch, setMessages]);

  // Set fetched messages once they're loaded
  useEffect(() => {
    console.log("Fetched messages changed:", fetchedMessages);
    if (fetchedMessages.length > 0) {
      setMessages(fetchedMessages);
    }
  }, [fetchedMessages, setMessages]);
  
  const sendMessage = async (message: string) => {
      if (!userId || !sessionId) {
        throw new Error('User not authenticated');
      }

      resetStreaming();
      
      // If the conversation is pending, create a new one first
      let actualConversationId = currentConversationId;
      
      if (currentConversationId === "pending") {
        try {
          // Create a new conversation and wait for the result
          const result = await new Promise((resolve, reject) => {
            createConversation(
              { user_id: userId, name: "New Conversation" },
              {
                onSuccess: (data) => resolve(data),
                onError: (error) => reject(error)
              }
            );
          });
          
          // Update the conversation ID with the newly created one
          actualConversationId = (result as { id: string }).id;
          setCurrentConversationId(actualConversationId);
          console.log("Created new conversation with ID:", actualConversationId);
        } catch (error) {
          console.error("Failed to create conversation:", error);
          throw new Error('Failed to create conversation');
        }
      }
      
      // Now send the message with the actual conversation ID
      const payload: Message = {
        user_id: userId,
        session_id: sessionId,
        conversation_id: actualConversationId,
        role: 'user',
        content: message,
        timestamp: new Date().toISOString(),
        ui_metadata: {},
        flags: {}
      };
      
      setMessages((prev) => [...(prev || []), payload]);
      try {
        await startStreaming(payload);
      } catch (error) {
        console.error("Error sending message:", error);
      }	
  }

  useEffect(() => {
    console.log("Response changed:", response);
    if (response && !isStreaming ) {
      const aiMessage: Message = {
        user_id: userId,
        session_id: sessionId || "1234567890",
        conversation_id: currentConversationId,
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString(),
        ui_metadata: {},
        flags: {}
      };
      setMessages((prev) => [...(prev || []), aiMessage]);
      resetStreaming();
    }
  }, [response, isStreaming, currentConversationId, userId, sessionId, setMessages, resetStreaming]);

  return {
    sendMessage,
    response,
    isStreaming,
    messages,
    resetStreaming,
    isLoading,
    error,
    refetch  // Include refetch in the return value
  };
}






