import { Message } from '@/app/types/schemas';
import { AssistantMessage } from './AssistantMessage';
import { UserMessage } from './UserMessage';
import React, { useEffect, useRef, useState, memo } from 'react';

interface MessageListProps {
    messages: Message[];
}

export const MessageList = memo(({ messages }: MessageListProps) => {    
    // Scroll handling logic
    const [hasSnapped, setHasSnapped] = useState(false);
    const lastMessageRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        if (lastMessageRef.current && !hasSnapped) {
            lastMessageRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setHasSnapped(true);
        }
    }, [hasSnapped, lastMessageRef, messages]);

    useEffect(() => {
        setHasSnapped(false);
    }, [messages]);

    return (
        <div className="flex flex-col gap-4">
            {messages.map((message, index) => {
                const isLastMessage = messages[messages.length - 1].role === 'user' && index === messages.length - 1;
                
                if (message.role === 'user') {
                    return (
                        <UserMessage 
                            key={index} 
                            message={message} 
                            ref={isLastMessage ? lastMessageRef : null} 
                        />
                    );
                } else {
                    return <AssistantMessage key={index} message={message.content} />;
                }
            })}
        </div>
    );
});

MessageList.displayName = 'MessageList';
