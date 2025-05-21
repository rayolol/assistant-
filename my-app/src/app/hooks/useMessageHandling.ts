"use client";
import { useEffect, useState } from 'react';
import { Message } from '../../../types/message';
import { useUserStore } from './StoreHooks/UserStore';
import { useMessageStore } from './StoreHooks/useMessageStore';
import { useChathistory, useCreateConversation } from './hooks';

export function useMessageHandling() {
  const { userId, sessionId } = useUserStore();
  const { 
    currentConversationId, 
    setMessages, 
    messages, 
    setCurrentConversationId, 
    response, 
    setResponse, 
    isStreaming, 
    setIsStreaming 
  } = useMessageStore();

  const { data: fetchedMessages = [], isLoading, error, refetch } = useChathistory(currentConversationId, userId, sessionId);
  const { mutate: createConversation } = useCreateConversation();
  const [streamingConversationId, setStreamingConversationId] = useState<string | null>(null);
  // Set fetched messages once they're loaded
  useEffect(() => {
    if (fetchedMessages.length > 0 && currentConversationId && !isStreaming) {
      setMessages(fetchedMessages);
    }
  }, [fetchedMessages, currentConversationId, isStreaming, setMessages]);

  const sendMessage = async (message: string) => {
    if (!userId || !sessionId) {
      throw new Error('User not authenticated');
    }

    let actualConversationId = currentConversationId;
    
    if (currentConversationId === "pending") {
      try {
        const result = await new Promise((resolve, reject) => {
          createConversation(
            { user_id: userId, name: "New Conversation" },
            {
              onSuccess: (data) => resolve(data),
              onError: (error) => reject(error)
            }
          );
        });
        
        actualConversationId = (result as { id: string }).id;
        setCurrentConversationId(actualConversationId);
      } catch (error) {
        console.error("Failed to create conversation:", error);
        throw new Error('Failed to create conversation');
      }
    }
    
    const payload: Message = {
      user_id: userId,
      session_id: sessionId,
      conversation_id: actualConversationId,
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
      ui_metadata: {},
      flags: {},
    };
    
    setMessages((prev) => [...(prev || []), payload]);

    try {
      console.log("Sending message to server: ", message);
      const encodedMessage = encodeURIComponent(message);
      const url = `http://localhost:8001/chat/${userId}/${sessionId}/${actualConversationId}?message=${encodedMessage}`;
      console.log("Connecting to SSE endpoint:", url);
      
      const eventSource = new EventSource(url);
      
      // Set streaming state to true when starting
      setIsStreaming(true);
      setStreamingConversationId(actualConversationId);
      
      eventSource.onopen = (event) => {
        console.log("SSE connection opened:", event);
      };
      let responseText = '';
      let updateTimeout: NodeJS.Timeout | null = null;
      
      eventSource.onmessage = (event) => {
        console.log("Received SSE message:", event.data);
        responseText += event.data;
        
        // Clear any pending update
        if (updateTimeout) {
          clearTimeout(updateTimeout);
        }
        
        // Batch updates using setTimeout
        updateTimeout = setTimeout(() => {
          setResponse(responseText);
        }, 25); // Small delay to batch multiple rapid updates
      };

      eventSource.onerror = (error) => {
        console.error('EventSource error:', {
          readyState: eventSource.readyState,
          url: eventSource.url,
          error
        });
        
        // Clear any pending update
        if (updateTimeout) {
          clearTimeout(updateTimeout);
        }
        
        // Close the connection
        eventSource.close();
        
        // Get the final response before clearing
        const finalResponse = responseText;
        
        // Update streaming state
        setIsStreaming(false);
        setStreamingConversationId(null);
        
        // Add the complete response as a message
        if (finalResponse) {
          const assistantMessage: Message = {
            user_id: userId,
            session_id: sessionId,
            conversation_id: actualConversationId,
            role: 'assistant',
            content: finalResponse,
            timestamp: new Date().toISOString(),
            ui_metadata: {},
            flags: {},
          };
          
          setMessages((prev) => [...(prev || []), assistantMessage]);
          setResponse('');
        }
      };

      // Add close event handler
      eventSource.addEventListener('close', () => {
        // Clear any pending update
        if (updateTimeout) {
          clearTimeout(updateTimeout);
        }
        
        // Get the final response
        const finalResponse = responseText;
        
        // Update streaming state
        setIsStreaming(false);
        setStreamingConversationId(null);
        
        // Add the complete response as a message
        if (finalResponse) {
          const assistantMessage: Message = {
            user_id: userId,
            session_id: sessionId,
            conversation_id: actualConversationId,
            role: 'assistant',
            content: finalResponse,
            timestamp: new Date().toISOString(),
            ui_metadata: {},
            flags: {},
          };
          
          setMessages((prev) => [...(prev || []), assistantMessage]);
          setResponse('');
        }
      });
      
      return () => {
        // Clear any pending update
        if (updateTimeout) {
          clearTimeout(updateTimeout);
        }
        
        if (eventSource.readyState !== EventSource.CLOSED) {
          eventSource.close();
        }
        
        // Set streaming state to false on cleanup
        setIsStreaming(false);
        setStreamingConversationId(null);
      };
    
    } catch (error) {
      console.error("Error sending message:", error);
      setIsStreaming(false);
    }
  };

  return {
    sendMessage,
    messages,
    isLoading,
    error,
    refetch,
    response,
    isStreaming,
    streamingConversationId
  };
}






