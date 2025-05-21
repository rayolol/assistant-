import { useEffect, useRef, useState } from 'react';

interface SSEOptions {
  onMessage?: (data: string) => void;
  onError?: (error: Event) => void;
  onOpen?: (event: Event) => void;
  batchInterval?: number;
}

export function useSSE(url: string, options: SSEOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Event | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const responseTextRef = useRef('');

  useEffect(() => {
    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.onopen = (event) => {
      setIsConnected(true);
      options.onOpen?.(event);
    };

    eventSource.onmessage = (event) => {
      responseTextRef.current += event.data;
      
      // Clear any pending update
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      
      // Batch updates using setTimeout
      updateTimeoutRef.current = setTimeout(() => {
        options.onMessage?.(responseTextRef.current);
      }, options.batchInterval || 25);
    };

    eventSource.onerror = (error) => {
      setError(error);
      setIsConnected(false);
      options.onError?.(error);
    };

    return () => {
      // Cleanup
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      
      if (eventSource.readyState !== EventSource.CLOSED) {
        eventSource.close();
      }
      
      setIsConnected(false);
      setError(null);
      responseTextRef.current = '';
    };
  }, [url, options.batchInterval]);

  const close = () => {
    if (eventSourceRef.current?.readyState !== EventSource.CLOSED) {
      eventSourceRef.current?.close();
    }
  };

  return {
    isConnected,
    error,
    close,
    getResponseText: () => responseTextRef.current
  };
} 