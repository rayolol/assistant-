"use client";
import { useMessageHandling } from '@/app/hooks/useMessageHandling';
import React, { useEffect, useRef } from 'react';
import { ChatBody }from './chatBody';
import { useAutoScroll } from '@/app/hooks/useAutoScroll';
import { useUserStore } from '@/app/hooks/StoreHooks/UserStore';
import { ErrorCard } from '@/components/utils/ErrorCard';

interface ChatWindowProps {
  messages: any,
  isStreaming: boolean,
  response: string,
  error: any
}

export const ChatWindow = ({ messages, isStreaming, response, error}: ChatWindowProps) => {
  const { username } = useUserStore();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log("response in chatwindow: ",response )
  }, [response])
  useAutoScroll(messagesEndRef, isStreaming);

  return (  
    <div className="flex flex-col h-full w-max-4xl mx-50 w-min-[500px]">
      <ChatBody messages={messages ?? []} isStreaming={isStreaming} response={response} username = {username ?? ""}/>
      <div className='flex items-center justify-center h-full'>
        {error && <ErrorCard error={error}/>}
      </div>
      <div ref={messagesEndRef} />
    </div>
  );
};
