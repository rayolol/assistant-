import  TypingIndicator  from './TypingIndicator';
import { MessageList } from './messageList';
import React from 'react';
import { EmptyState } from './EmptyState';
import { Message } from '@/app/types/schemas';
import { StreamingAssistantMessage } from './AssistantMessage';

interface ChatBodyProps {
    messages: Message[];
    isStreaming: boolean;
    response: string;
    username: string;
}


export const ChatBody = ({messages, isStreaming, response, username }: ChatBodyProps) => {
    if (!messages || messages.length === 0) {
        return (<EmptyState username ={username}/>)
    }


    return (
        <>
            <MessageList messages={messages}/>
            {
                isStreaming && (
                    <>
                        <StreamingAssistantMessage streamContent={response}/>
                        <TypingIndicator/>
                    </>
                )
            }
        </>
    )
}