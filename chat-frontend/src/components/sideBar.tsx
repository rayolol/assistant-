import React, { useState, useEffect, useCallback } from 'react';
import { useUserStore } from '../types/UserStore.tsx';
import { fetchConversations, createConversation } from '../api/api.ts';
import { Conversation } from '../types/message.tsx';

const SideBar = () => {

    const { user, conversation_id, setConversationId } = useUserStore();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(false);

    
    // Only fetch conversations when user changes or on initial load
    useEffect(() => {
        if (user) {
            setLoading(true);
            fetchConversations(user).then(res => {
                if(res.data)
                    setConversations(res.data);
                    setLoading(false)
            })
        }
    },[user]);  // Remove conversation_id from dependencies

    const handleConversationClick = (id: string) => {
        console.log("Switching to conversation:", id);
        setConversationId(id);
    };

    return (
        <div className="w-1/4 p-4 bg-gray-700 shadow-md h-screen">
            <h2 className="text-lg font-semibold mb-4 text-white">Conversations</h2>
            
            {loading ? (
                <p className="text-gray-300">Loading conversations...</p>
            ) : (
                <ul className="space-y-4 overflow-y-auto">
                    {conversations.length > 0 ? (
                        conversations.map((conversation) => (
                            <li 
                                className={`cursor-pointer w-full p-4 rounded-xl flex items-center ${
                                    conversation_id === conversation.id ? 'bg-blue-600' : 'bg-slate-500'
                                } hover:bg-slate-400 transition-colors`} 
                                key={conversation.id} 
                                onClick={() => handleConversationClick(conversation.id)}
                            >
                                <span className="text-white truncate">{conversation.name || "New Conversation"}</span>
                            </li>
                        ))
                    ) : (
                        <p className="text-gray-300">No conversations found</p>
                    )}
                </ul>
            )}
            
            <button 
                className="mt-4 w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors"
                onClick={async () => {
                    if (user) {
                        try {
                            const newConversation = await createConversation(user);
                            setConversationId(newConversation.id);
                            fetchConversations(user).then(res => {
                                if(res.data)
                                    setConversations(res.data);
                            })
                        } catch (error) {
                            console.error('Error creating new conversation:', error);
                        }
                    }
                }}
            >
                Create New Conversation
            </button>
        </div>
    );

}

export default SideBar;





