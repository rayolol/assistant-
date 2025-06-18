"use client";

import { useEffect, useRef, useState, startTransition } from "react";
import eventEmitter from "@/lib/EventEmitter";
import { Message } from "../types/schemas";
import { useUserStore } from "./StoreHooks/UserStore";
import { useMessageStore } from "./StoreHooks/useMessageStore";
import { useCreateConversation } from "@/app/api/Queries/createConversation";
import { useChathistory } from "@/app/api/Queries/chatHistory";

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
    setIsStreaming,
  } = useMessageStore();

  const assistantRef = useRef<string>(""); // Accumulate assistant tokens
  const [streamingConversationId, setStreamingConversationId] = useState<string | null>(null);

  const { data: fetchedMessages = [], isLoading, error, refetch } = useChathistory(
    currentConversationId,
    userId,
    sessionId
  );
  const { mutate: createConversation } = useCreateConversation();

  // Load chat history if it exists
  useEffect(() => {
    if (fetchedMessages.length > 0 && currentConversationId) {
      setMessages(fetchedMessages);
    }
  }, [fetchedMessages, currentConversationId, setMessages]);

  // Refetch when switching conversations
  useEffect(() => {
    if (currentConversationId && currentConversationId !== "pending") {
      refetch();
    }
  }, [currentConversationId, refetch]);

  // Token-by-token update logic
  const appendToken = (token: string) => {
    assistantRef.current += token;

    startTransition(() => {
      setMessages((prev) => {
        const lastIndex = prev.length - 1;

        if (lastIndex >= 0 && prev[lastIndex].role === "assistant") {
          const updated = [...prev];
          updated[lastIndex] = {
            ...updated[lastIndex],
            content: assistantRef.current,
          };
          return updated;
        } else {
          return [
            ...prev,
            {
              user_id: userId,
              session_id: sessionId,
              conversation_id: currentConversationId,
              role: "assistant",
              content: assistantRef.current,
              timestamp: new Date().toISOString(),
              flags: {},
            },
          ];
        }
      });
    });
  };

  // Send a user message and stream response
  const sendMessage = async (message: string, fileId: string | null = null) => {
    if (!userId || !sessionId) {
      throw new Error("User not authenticated");
    }

    let actualConversationId = currentConversationId;

    // Create new conversation if needed
    if (currentConversationId === "pending") {
      try {
        const result = await new Promise((resolve, reject) => {
          createConversation(
            { user_id: userId, name: "New Conversation" },
            {
              onSuccess: (data) => resolve(data),
              onError: (error) => reject(error),
            }
          );
        });

        actualConversationId = (result as { id: string }).id;
        setCurrentConversationId(actualConversationId);
      } catch (error) {
        console.error("Failed to create conversation:", error);
        throw new Error("Failed to create conversation");
      }
    }

    const payload: Message = {
      user_id: userId,
      session_id: sessionId,
      conversation_id: actualConversationId,
      role: "user",
      content: message,
      timestamp: new Date().toISOString(),
      file_id: fileId,
      flags: {},
    };

    setMessages((prev) => [...(prev || []), payload]);
    let query = ""

    try {
      const encodedMessage = encodeURIComponent(message);
      if (fileId) {
        query = `&fileId=${encodeURIComponent(fileId)}`;
      } 
      const url = `http://localhost:8001/chat/${userId}/${sessionId}/${actualConversationId}?message=${encodedMessage}${query}`;

      const eventSource = new EventSource(url);

      setIsStreaming(true);
      setStreamingConversationId(actualConversationId);

      eventSource.onopen = () => {
        console.log("SSE connection opened.");
        assistantRef.current = ""; // Reset accumulated tokens
      };

      eventSource.onmessage = (event) => {
        try {
          const chunk = JSON.parse(event.data);

          if (chunk.event) {
            eventEmitter.emit("chatEvent", chunk.event);
          }

          if (chunk.chunk) {
            appendToken(chunk.chunk);
          }
        } catch (e) {
          console.error("Invalid SSE chunk:", e, event.data);
        }
      };

      eventSource.onerror = (error) => {
        console.error("SSE error:", error);
        eventSource.close();

        setIsStreaming(false);
        setStreamingConversationId(null);

        // Finalize message
        const finalResponse = assistantRef.current;
        assistantRef.current = "";

        // if (finalResponse && finalResponse.trim()) {
        //   const assistantMessage: Message = {
        //     user_id: userId,
        //     session_id: sessionId,
        //     conversation_id: actualConversationId,
        //     role: "assistant",
        //     content: finalResponse,
        //     timestamp: new Date().toISOString(),
        //     flags: {},
        //   };

        //   setMessages((prev) => [...(prev || []), assistantMessage]);
        // }

        setResponse("");
      };

      return () => {
        if (eventSource.readyState !== EventSource.CLOSED) {
          eventSource.close();
        }
        setIsStreaming(false);
        setStreamingConversationId(null);
        setResponse("");
        assistantRef.current = "";
      };
    } catch (error) {
      console.error("Failed to send SSE request:", error);
      setIsStreaming(false);
      setStreamingConversationId(null);
      setResponse("");
      assistantRef.current = "";
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
