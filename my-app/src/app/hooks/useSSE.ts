import { useEffect, useRef, useState, useCallback } from 'react';

interface SSEOptions {
  onMessage?: (data: string) => void;
  onError?: (error: Event) => void;
  onOpen?: (event: Event) => void;
}

type UserStore = {
  userId: string;
  sessionId: string;
  currentConversationId: string;
}

export function useSSE(user: UserStore, options: SSEOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [response, setResponse] = useState('');
  const [error, setError] = useState<Event | null>(null);
  const [message, setMessage] = useState('');
  const bufferRef = useRef("");
  const [isStreaming, setIsStreaming] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const RAFRef = useRef<number | null>(null);

  const sendMessage = useCallback((newMessage: string) => {
    setMessage(newMessage);
  }, []);

  const close = useCallback(() => {
    if (eventSourceRef.current?.readyState !== EventSource.CLOSED) {
      eventSourceRef.current?.close();
      setIsConnected(false);
      setError(null);
      setResponse('');
    }
  }, []);

  useEffect(() => {
    let eventSource: EventSource | null = null;
    if (!message) return;
    if (!isStreaming) {
      eventSource = new EventSource(
        `http://localhost:8001/chat/${user.userId}/${user.sessionId}/${user.currentConversationId}?message=${encodeURIComponent(message)}`
      );
    }
    
    eventSourceRef.current = eventSource;

    if (eventSource) {
      eventSource.onopen = (event) => {
        setIsConnected(true);
        options.onOpen?.(event);
      };

      eventSource.onmessage = (event) => {
        bufferRef.current = event.data;
        options.onMessage?.(event.data);
        setIsStreaming(true);
        if (RAFRef.current === null) {
          RAFRef.current = requestAnimationFrame(() => {
            setResponse((prev) => prev + bufferRef.current);
            bufferRef.current = "";
            RAFRef.current = null;
          });
        }
      };

      eventSource.onerror = (error) => {
        setError(error);
        setIsConnected(false);
        options.onError?.(error);
        close();
        setIsStreaming(false);
      };
    }

    return () => {
      close();
      if (RAFRef.current) {
        cancelAnimationFrame(RAFRef.current);
        setIsStreaming(false);
      }
    };
  }, [message, user.userId, user.sessionId, user.currentConversationId, options, close, isStreaming]);

  return {
    isConnected,
    error,
    isStreaming,
    close,
    response,
    sendMessage
  };
} 