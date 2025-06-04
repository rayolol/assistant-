"use client";
import { useEffect, useState } from 'react';
import eventEmitter from '@/lib/EventEmitter';
import { Message } from '../types/schemas';
import { useUserStore } from './StoreHooks/UserStore';
import { useMessageStore } from './StoreHooks/useMessageStore';
import { useCreateConversation } from '@/app/api/Queries/createConversation';
import { useChathistory } from '@/app/api/Queries/chatHistory';
import { set } from 'zod';

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
    if (fetchedMessages.length > 0 && currentConversationId) {
      console.log("Setting messages:", fetchedMessages);
      setMessages(fetchedMessages);
    }
  }, [fetchedMessages, currentConversationId, setMessages]);

  const sendMessage = async (message: string) => {
    if (!userId || !sessionId) {
      throw new Error('User not authenticated');
    }

    let actualConversationId = currentConversationId;

    //TODO: make a sending pending request.
    
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
      let animationFrame: number | null = null;
      let responseText = '';
    
      eventSource.onmessage = (event) => {
        console.log("Received SSE message:", event.data);
        
        try {
          const chunk = JSON.parse(event.data);

          
          if (chunk.event) { 
            eventEmitter.emit("chatEvent", chunk.event);
          } else {
            console.log("no event recorded");
          }
          
          if (chunk.chunk) {
            responseText += chunk.chunk;
            setResponse(responseText);
          }
        } catch (e) {
          console.error("Failed to parse SSE JSON chunk:", e, event.data);
        }
    
      }

      eventSource.onerror = (error) => {
        console.error('EventSource error:', {
          readyState: eventSource.readyState,
          url: eventSource.url,
          error
        });

        eventEmitter.emit("chatEvent", null); 
        eventSource.close();

        setIsStreaming(false);
        setStreamingConversationId(null);

        const finalResponse = responseText;
        if (finalResponse && finalResponse.trim()) {
          const assistantMessage: Message = {
            user_id: userId,
            session_id: sessionId,
            conversation_id: actualConversationId,
            role: 'assistant',
            content: finalResponse,
            timestamp: new Date().toISOString(),
            flags: {},
          };

          setMessages((prev) => [...(prev || []), assistantMessage]);
        }

        setResponse('');
        responseText = '';
        
      };

      
      return () => {
       
        if (eventSource.readyState !== EventSource.CLOSED) {
          eventSource.close();
        }
        
        // Set streaming state to false on cleanup
        setIsStreaming(false);
        setStreamingConversationId(null);
        
        // Clear response state
        setResponse('');
        responseText = '';
      };
    
    } catch (error) {
      console.error("Error sending message:", error);
      setIsStreaming(false);
      setStreamingConversationId(null);
      setResponse('');
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
    streamingConversationId,
  };
}






