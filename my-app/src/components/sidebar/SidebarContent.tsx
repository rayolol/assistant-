
import { Conversation } from '@/app/types/schemas';
import { ConversationList } from './ConversationList';
import { SidebarMenuButton } from '../ui/sidebar';
import { Plus } from 'lucide-react';

interface SidebarContentProps {
    conversations: Conversation[];
    onConversationClick: (conversation: Conversation) => void;
    currentConversationId: string | null;
    onNewConversationClick: () => void;
}



export const SidebarConversations = ({ conversations, onNewConversationClick, onConversationClick, currentConversationId }: SidebarContentProps) => {
    return (
        <nav className="h-screen flex flex-col">
            <section className="m-4">
                <SidebarMenuButton onClick={onNewConversationClick}>
                    <Plus />
                    Create New Conversation
                </SidebarMenuButton>
            </section>

            <section>
                {conversations && conversations.length > 0 ? (
                    <ConversationList 
                        conversations={conversations} 
                        onConversationClick={onConversationClick} 
                        currentConversationId={currentConversationId}
                    />
                ) : (
                    <p>No conversations</p>
                )}
            </section>
        </nav>
    )
}