"use client";
import { Conversation } from '../../../../types/conversation';
import { useUserStore } from '../../../../types/UserStore';
import { useConversations, useCreateConversation } from '../../api/hooks';
import React, { useState, useMemo } from 'react';


const SideBar: React.FC = () => {
    const { conversation_id, setConversationId, userId } = useUserStore();
    console.log("SideBar - Current userId:", userId);

    const { data: fetchedconversations = [], isLoading, error } = useConversations(userId);
    console.log("SideBar - Fetched conversations:", fetchedconversations);

    const { mutate: createConversation } = useCreateConversation();
    const [pendingConversations, setPendingConversations] = useState<Conversation[]>([]);


    const conversations = useMemo(() => {
            return [...fetchedconversations, ...pendingConversations];
        }, [fetchedconversations, pendingConversations]);


    const handleCreateConverstaion = () => {
        if (userId) {
            const conv: Conversation = {
                id: "pending",
                name: "New Conversation",
                started_at: new Date().toISOString(),
                last_active: new Date().toISOString()
            }

            setPendingConversations((prev: Conversation[]) => [...prev, conv]);
            createConversation({ user_id: userId, name: "New Conversation" }, {

                onSuccess: (data) => {
                    console.log("Conversation created successfully:", data);
                    if (data.id) {
                        setConversationId(data.id);
                        setPendingConversations([]);
                    }
                },
                onError: (error) => {
                    console.error("Error creating conversation:", error);
                }
            });
        } else {
            console.log("User ID not found");
        }
    }

    if(isLoading) {
        return <div className= "h-50 w60 border-2 border-blue-500 bg-blue-300">Loading...</div>;
    }

    if (error) {
        return <div className= "h-50 w60 border-red-500 bg-red-300 border-2 text-red-500">Error: {error.message}</div>;
    }

    return (
        <div className="h-screen bg-slate-700 p-4">
            <h2 className="text-lg font-semibold mb-4">Conversations</h2>
            <button onClick={handleCreateConverstaion} className = "bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"> New Conversation </button>
            <br></br>
            <ul className="space-y-2 mt-3 overflow-y-auto">
                {conversations && conversations.length > 0 ? (
                    conversations.map((conv: Conversation ) => (
                        <li key={conv.id && conv.last_active}>
                            <button
                                onClick={() => setConversationId(conv.id)}
                                className={`w-full text-left px-3 py-2 rounded-xl transition-colors ${
                                    conversation_id === conv.id
                                        ? 'bg-slate-400 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200'
                                        : 'bg-slate-600 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200'
                                }`}
                            >
                                {conv.name || 'New Conversation'}
                            </button>
                        </li>
                    ))
                ) : (
                    <div className="text-center text-gray-500 dark:text-gray-400 p-4">No conversations yet</div>
                )}
            </ul>
        </div>
    );
}

export default SideBar;