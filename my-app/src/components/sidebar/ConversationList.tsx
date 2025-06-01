import { Conversation } from '@/app/types/schemas';
import { SidebarMenuButton } from '../ui/sidebar';

interface ConversationListProps {
    conversations: Conversation[];
    onConversationClick: (conversation: Conversation) => void;
    currentConversationId: string | null;
}



export const ConversationList = ({ conversations, onConversationClick, currentConversationId }: ConversationListProps) => {

    const sortedConversations = [...conversations].sort((a, b) => {
        const dateA = new Date(a.last_active || 0).getTime();
        const dateB = new Date(b.last_active || 0).getTime();
        return dateB - dateA;
    });

    return (
        <ul className='flex flex-col'>
            {sortedConversations.map((conversation) => (
                <li key={conversation.id} className='m-2'>
                    <SidebarMenuButton className={ `${currentConversationId === conversation.id ? 'bg-accent text-accent-foreground' : `bg-sidebar`} h-10`} onClick={() => onConversationClick(conversation)}>
                        <h3 className= "m-4">{conversation.name}</h3>
                    </SidebarMenuButton>
                </li>
            ))}
        </ul>
    )
}