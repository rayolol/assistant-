"use client";
import { useCallback } from 'react';
import { Message } from '../types/schemas';
import { baseURL } from '../api/api';
import { useMessageStore } from './StoreHooks/useMessageStore';


export const useStreamedResponse = () => {
    const {response, setResponse, isStreaming, setIsStreaming, setMessages} = useMessageStore();

    const resetStreaming = useCallback(() => {
        setResponse("");
        setIsStreaming(false);
    }, [setResponse, setIsStreaming]);

    const startStreaming = useCallback(async (message: Message) => {
        console.log("Starting streaming with message:", message);
        setResponse("");
        setIsStreaming(true);
        let finalResponse:string = "";
        try {
            console.log("Fetching from:", `${baseURL}/chat/streamed`);
            const res = await fetch(`${baseURL}/chat/streamed`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(message)
            });

            console.log("Stream response status:",
                res.status);
            if (!res.ok) {
                throw new Error(`Stream response error: ${res.status} ${res.statusText}`);
            }

            const reader = res.body!.getReader();
            const decoder = new TextDecoder("utf-8");

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });
                finalResponse += chunk;
                setResponse(finalResponse);
            }
            console.log("Response changed:", response);
            if (response && !isStreaming ) {

            const aiMessage: Message = {
                user_id: message.user_id,
                session_id: message.session_id,
                conversation_id: message.conversation_id,
                role: 'assistant',
                content: finalResponse,
                timestamp: new Date().toISOString(),
                ui_metadata: {},
                flags: {}
            };
            setMessages((prev) => [...(prev || []), aiMessage]);
            resetStreaming();
    }
        } catch (error) {
            console.error("Error sending message:", error);
            throw error;
        } finally {
            setIsStreaming(false);
        }
    }, []);

    return { response, isStreaming, startStreaming, resetStreaming };

}
