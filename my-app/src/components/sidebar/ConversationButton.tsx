import { SidebarMenuButton } from "../ui/sidebar";
import { Conversation } from '@/app/types/schemas';
import { ConversationDropdown } from "./ConversationDropdown";
import { EllipsisVertical } from 'lucide-react';
import { useState } from "react";

interface ConversationButtonProps {
    conversation: Conversation;
    currentConversationId: string;
    isStreaming: boolean;
    onClick: (conversation: Conversation) => void;
}


export const ConversationButton = ({ conversation, currentConversationId, isStreaming, onClick }: ConversationButtonProps) => {
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [conversationName, setConversationName] = useState<string>(conversation.name);

    //TODO: make update conversation name enpoint
    const onSubmit = () => {
        setIsEditing(false);
        console.log("Submitted: " + conversationName);
    }

    return (
        <SidebarMenuButton className={ `${currentConversationId === conversation.id ? 'bg-accent text-accent-foreground' : `bg-sidebar`} h-10 transition-all ease-in-out duration-100 flex flex-row justify-between items-center`} onClick={() => onClick(conversation)}>
            {isEditing ? (
                <input type="text" className="m-4" value={conversation.name} onChange={(e) => {setConversationName(e.target.value)}} onSubmit={onSubmit}/>
            ) : (
                <h3 className= "m-4">{conversation.name}</h3>
            )}

            {isStreaming && currentConversationId === conversation.id ? (
                <svg className="w-6 h-6 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            ) : (
                <ConversationDropdown
                    currentConversationId={currentConversationId}
                    onEdit={() => {setIsEditing(true)}}
                    setArchive={() => {/* TODO: implement archive logic */}}
                    onDelete={() => {/* TODO: implement delete logic */}}
                >
                    <div className="m-2 rounded-full bg-transparent hover:bg-accent border-none">
                        <EllipsisVertical />
                    </div>
                </ConversationDropdown>
            )}
        </SidebarMenuButton>
    )
}