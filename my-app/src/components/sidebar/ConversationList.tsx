import { Conversation } from '@/app/types/schemas';
import { ConversationButton } from './ConversationButton';

interface ConversationListProps {
    conversations: Conversation[];
    onConversationClick: (conversation: Conversation) => void;
    currentConversationId: string | null;
    isStreaming: boolean;
}



export const ConversationList = ({ conversations, isStreaming, onConversationClick, currentConversationId }: ConversationListProps) => {

    const sortedConversations = [...conversations].sort((a, b) => {
        const dateA = new Date(a.last_active || 0).getTime();
        const dateB = new Date(b.last_active || 0).getTime();
        return dateB - dateA;
    });

    return (
        <ul className='flex flex-col'>
            {sortedConversations.map((conversation) => (
                <li key={conversation.id} className='m-2'>
                    <ConversationButton conversation={conversation} currentConversationId={currentConversationId ?? ""} isStreaming={isStreaming} onClick={onConversationClick}/>
                </li>
            ))}
        </ul>
    )
}