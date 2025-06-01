import { Message } from '@/app/types/schemas';
import { AssistantMessage } from './AssistantMessage';
import { UserMessage } from './UserMessage';


interface MessageListProps {
    messages: Message[];
}

//TODO: put message object in message arg
export const MessageList = ({ messages }: MessageListProps) => {
    return (
        <div className="flex flex-col gap-4">
            {messages.map((message, index) => {
                if (message.role === 'user') {
                    return <UserMessage key={index} message={message.content} />;
                } else {
                    return <AssistantMessage key={index} message={message.content} />;
                }
            })}
        </div>
    );
};