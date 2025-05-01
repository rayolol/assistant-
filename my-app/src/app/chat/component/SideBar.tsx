"use client";
import { Conversation } from '../../../../types/conversation';
import { useUserStore } from '../../hooks/StoreHooks/UserStore';
import useSidebarData from '../../hooks/useSidebarData';
import { deleteConversation } from '@/app/api/api';
import React, { useState } from 'react';

const DropdownMenu: React.FC<{ isOpen: boolean, setIsOpen: (isOpen: boolean) => void, position: {x: number, y: number} }> = ({ isOpen , setIsOpen, position }) => {
    const { conversation_id } = useUserStore();

    return (
        <>
            {isOpen && (
                <div className="min-w-[100px] bg-blue-950 text-white rounded-2xl transition-transform transform:fade-in border-gray-700 absolute z-10"
                        onMouseEnter={() => setIsOpen(true)}
                        onMouseLeave={() => setIsOpen(false)}
                        style={{top: position.y + "px", left: position.x + "px"}}
                        >
                    <option className="block bg-slate-600 hover:bg-gray-700" value="Delete" onClick={() => conversation_id && deleteConversation(conversation_id)}>
                        Delete
                    </option>
                    <option className="block bg-slate-600 hover:bg-gray-700" value="EditName" onClick={() => console.log("Edit")}>
                        Edit Name
                    </option>
                </div>
            )}
        </>
    );
};


const SideBar: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false); // State for dropdown menu open/close
    const { username, email, logout } = useUserStore();
    const [position, setPosition] = useState({x: 0, y: 0}); // Fixed typo in variable name
    const { currentConversationId, setCurrentConversationId, conversations, isLoading, error, startNewConversation } = useSidebarData()


    if(isLoading) {
        return <div className= "h-50 border-2 border-blue-500 bg-blue-300">Loading...</div>;
    }

    if (error) {
        return <div className= "h-50 border-red-500 bg-red-300 border-2 text-red-500">Error: {error.message}</div>;
    }

    return (
        <nav className="h-screen flex flex-col">
             <header>
                <h2 className="text-lg text-center font-semibold mb-4">Conversations</h2>
             </header>
             <button className="w-full text-left px-3 cursor-pointer py-2 rounded-xl transition-colors bg-neutral-400 dark:hover:bg-neutral-700 text-gray-800 dark:text-gray-200" onClick={startNewConversation}>Create New Conversation</button>
            <hr></hr>
            <ul className="space-y-2 mt-3 overflow-y-auto flex-1 p-4">
                {conversations && conversations.length > 0 ? (
                    conversations.map((conv: Conversation, index: number) => (
                        <li key={index && conv.id && conv.last_active}>
                            <button
                                onClick={() => {setCurrentConversationId(conv.id)}}
                                onMouseEnter={(e: React.MouseEvent) => {
                                    // Get parent container position
                                    setPosition({
                                      x: e.clientX ,
                                      y: e.clientY
                                    });
                                    setIsOpen(true);
                                }}
                                onMouseLeave={() => setIsOpen(false)}
                                className={`w-full text-left px-3 cursor-pointer py-2 rounded-xl transition-colors ${
                                    currentConversationId === conv.id
                                        ? 'bg-zinc-400 dark:bg-zinc-700/30 text-gray-800 dark:text-blue-200'
                                        : 'bg-neutral-700 dark:hover:bg-neutral-700 text-gray-800 dark:text-gray-200'
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
            <DropdownMenu isOpen={isOpen} setIsOpen={setIsOpen} position={position}></DropdownMenu>
            <footer className=' h-20'>
                <div className="flex items-center justify-start font-bold gap-4  text-gray-500 dark:text-gray-400 p-4">
                    {username} {email}
                    <button className='text-white cursor-pointer' onClick={() => logout()}>Logout</button>
                </div>
            </footer>
        </nav>
    );
}

export default SideBar;