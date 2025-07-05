"use client";

import { useEffect, useRef, useState, startTransition, useMemo } from "react";
import eventEmitter from "@/lib/EventEmitter";
import { Message } from "../types/schemas";
import { useUserStore } from "./StoreHooks/UserStore";
import { useMessageStore } from "./StoreHooks/useMessageStore";
import { useChathistory } from "@/app/api/Queries/chatHistory";
import { useChatStream } from "./useChatStream";
import { NodeNextRequest } from "next/dist/server/base-http/node";



export function useMessageHandling() {

  const { userId, sessionId } = useUserStore();

  const wsUrl = useMemo(() => {
    return `ws://localhost:8001/ws/chat/${userId}/${sessionId}`;
  }, [sessionId, userId])

  const { currentConversationId, setMessages, messages} = useMessageStore();
  const { data: fetchedMessages = [], isLoading, error, refetch } = useChathistory( currentConversationId, userId, sessionId );
  const [awaitingEvent, setAwaitingEvent] = useState<boolean>(false)

 
  const { sendJsonMessage, state } = useChatStream(
    userId && sessionId && currentConversationId ? wsUrl : null,
    {
      onChunk: (data: unknown) => {
        console.log("received chunk:", data);
      },
      onStart: () => {
        // Handle stream start if needed
      },
      onComplete: (finalResponse: string) => {
        if (finalResponse && finalResponse.trim()) {
          const assistantMessage: Message = {
            id: crypto.randomUUID(),
            user_id: userId || "",
            session_id: sessionId || "",
            conversation_id: currentConversationId || "",
            role: "assistant",
            content: finalResponse,
            timestamp: new Date(),
            file_id: null,
            flags: {}
          };
          setMessages((prev) => [...(prev || []), assistantMessage])
        }      
      },
      onEvent: (data: any) => {
        console.log("received event:", data);
          const eventMessage: Message = {
            id: crypto.randomUUID(),
            user_id: userId || "", 
            session_id: sessionId || "",
            conversation_id: currentConversationId || "",
            role: "system",
            content: typeof data.content === "string" ? data.content : JSON.stringify(data.content),            
            timestamp: new Date(),
            file_id: null,
            flags: data
          }
          if (data.event === "wait_for_user") {
            setAwaitingEvent(true)
          } else {
            setAwaitingEvent(false)
          }
          setMessages((prev) => [...(prev || []), eventMessage])
      },
    }
  );

  const sendMessage = (conversationId:string, message:string, fileId?:string) => {
    if (!message) return;
      const userMessage: Message = {
        id: crypto.randomUUID(),
        user_id: userId || "",
        session_id: sessionId || "",
        conversation_id: currentConversationId || "",
        role: "user",
        content: message,
        file_id: fileId || null,
        timestamp: new Date(),
        flags: {}
      };
      setMessages((prev) => [...(prev || []), userMessage]);

      const payload = {
        fileId: fileId,
        conversationId:conversationId,
        message: message
      }
      sendJsonMessage(payload)
  }

  const sendUserFeedback = (message: string) => {
    const payload = {
      type: "user_feedback",
      message: message
    }
    sendJsonMessage(payload)
  }

  useEffect(() => {
    if (fetchedMessages.length > 0 && currentConversationId) {
      setMessages(fetchedMessages);
    }
  }, [fetchedMessages, currentConversationId, setMessages]);

  useEffect(() => {
    if (currentConversationId && currentConversationId !== "pending") {
      refetch();
    }
  }, [currentConversationId, refetch]);

  return {
    sendMessage,
    messages,
    isLoading,
    error,
    refetch,
    response: state.text,
    isStreaming: state.streaming,
    currentConversationId,
    awaitingEvent,
    sendUserFeedback
  };
}