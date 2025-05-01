"use client";
import { useCallback, useState } from 'react';
import { Message } from '../../../types/message';
import { baseURL } from '../api/api';



export const useStreamedResponse = () => {
    const [response, setResponse] = useState<string>("");
    const [isStreaming, setIsStreaming] = useState<boolean>(false)

    const resetStreaming = useCallback(() => {
        setResponse("");
        setIsStreaming(false);
    }, []);

    const startStreaming = useCallback(async (message: Message) => {
        console.log("Starting streaming with message:", message);
        setResponse("");
        setIsStreaming(true);
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
                setResponse((prev: string) => {
                    const newResponse = prev + chunk;
                    return newResponse;
                });
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
