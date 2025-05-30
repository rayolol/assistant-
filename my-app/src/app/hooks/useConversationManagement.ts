"use client";

import { useEffect } from 'react';
import { useCreateConversation } from '@/app/api/Queries/createConversation';


export default function useConversationManagement(
  conversation_id: string | undefined, 
  userId: string | undefined, 
  isAuthenticated: boolean,
  setConversationId: (id: string) => void,
  messages: any []
) {
  const { mutate: createConversation } = useCreateConversation();

  useEffect(() => {
    if ((!conversation_id || conversation_id === 'None') && userId && isAuthenticated) {
      if (messages.length > 0) {
        createConversation(
          { user_id: userId, name: "New Conversation" },
          {
            onSuccess: (data) => {
              if (data && data.id) {
                setConversationId(data.id);
              }
            },
            onError: (error) => {
              console.error("Failed to create conversation:", error);
            }
          }
        );
      } else {
        setConversationId("Pending");
      }
      
    }
  }, [conversation_id,messages, userId, isAuthenticated, createConversation, setConversationId]);

  return { createConversation };
}