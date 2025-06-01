import { useEffect } from 'react';


export const useAutoScroll = (messagesEndRef: React.RefObject<HTMLDivElement | null>, isStreaming: boolean) => {
    useEffect(() => {
        if (messagesEndRef.current) {
            // Use requestAnimationFrame for smoother scrolling
            requestAnimationFrame(() => {
                messagesEndRef.current?.scrollIntoView({ 
                    behavior: isStreaming ? 'auto' : 'smooth',
                    block: 'end'
                });
            });
        }
    }, [isStreaming, messagesEndRef]);
}
