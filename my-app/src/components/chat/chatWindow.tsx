"use client";
import { useMessageHandling } from '@/app/hooks/useMessageHandling';
import React, { useRef } from 'react';
import { ChatBody }from './chatBody';
import { useAutoScroll } from '@/app/hooks/useAutoScroll';
import { useUserStore } from '@/app/hooks/StoreHooks/UserStore';
import { ErrorCard } from '@/components/utils/ErrorCard';

export const ChatWindow = () => {
  const { messages, isStreaming, response, error} = useMessageHandling();
  const { username } = useUserStore();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useAutoScroll(messagesEndRef, isStreaming);

  return (  
    <div className="flex flex-col h-full w-4xl mx-auto">
      <ChatBody messages={messages ?? []} isStreaming={isStreaming} response={response} username = {username ?? ""}/>
      <div className='flex items-center justify-center h-full'>
        {error && <ErrorCard error={error}/>}
      </div>
      <div ref={messagesEndRef} />
    </div>
  );
};
