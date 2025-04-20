import React, { useState, useEffect } from 'react';
import { Conversation } from '../types/message.tsx';
import { fetchConversations } from '../api/api.ts';
import { useUserStore } from '../types/UserStore.tsx';

const ConversationWindow = () => {
    const [conversation, setConversation] = useState<Conversation[]>([]);
    const { user } = useUserStore();

    const getConversation = async () => {
        try {
            const response = await fetchConversations(user);
            setConversation(response);
        } catch (error) {
            console.error('Error fetching conversations:', error);
        }
    }

    
    useEffect(() => {
        if (user){
            getConversation();
        }
    }, [user]);


    return (
        <div>
            <h1>Conversation Window</h1>
        </div>
    )
}