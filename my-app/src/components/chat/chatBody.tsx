import  {DotIndicator}  from './TypingIndicator';
import { MessageList } from './messageList';
import React, { useEffect, useState } from 'react';
import { EmptyState } from './EmptyState';
import { Message } from '@/app/types/schemas';
import { StreamingAssistantMessage } from './AssistantMessage';
import eventEmitter from '@/lib/EventEmitter';

interface ChatBodyProps {
    messages: Message[];
    isStreaming: boolean;
    response: string;
    username: string;
}


export const ChatBody = ({messages, isStreaming, response, username }: ChatBodyProps) => {
    const [chatEvent, setChatEvent] = useState<string | null>(null);
    
    
    useEffect(() => {
        const handler = (event: any) => {
            console.log("Received chat event:", event);
            setChatEvent(event);
        };
        eventEmitter.on("chatEvent", handler);
        return () => {
            eventEmitter.off("chatEvent", handler);
        };
    }, []);

    useEffect(() => {
        console.log("response in chatbody: ", response)
    }, [response])

   
    // Clear the chatEvent state when streaming is done
    useEffect(() => {
        if (!isStreaming) {
            setChatEvent(null);
        }
    }, [isStreaming]);

    if (!messages || messages.length === 0) {
        return (<EmptyState username ={username}/>)
    }


    return (
        <>
            <MessageList messages={messages}/>
            {
                isStreaming && (
                    <div className = "w-full min-h-100 max-h-fit flex flex-col grow">
                        {chatEvent && (<div className="text-md text-accent glare-text w-fit">{chatEvent}</div>)}
                        <StreamingAssistantMessage streamContent={response} isStreaming={isStreaming}/>
                        <DotIndicator/>
                    </div>
                )
            }
        </>
    )
}