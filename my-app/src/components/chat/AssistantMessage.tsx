import { memo, startTransition } from 'react';
import { MarkdownRenderer,StreamingMarkdownRenderer } from '@/lib/renderer';


export const AssistantMessage = memo(({ message }: { message: string }) => {
    return (
        <div className="flex justify-start">
            <div className="p-4 whitespace-pre-line">
                <MarkdownRenderer content={message} />
            </div>
        </div>
    );
});

AssistantMessage.displayName = 'AssistantMessage';

export const StreamingAssistantMessage = memo(({ streamContent, isStreaming }: { streamContent: string, isStreaming: boolean }) => {
    return (
        <div className="flex justify-start p-4">
            <div className='p4 whitespace-pre-wrap'>
                <StreamingMarkdownRenderer content={streamContent} isStreaming={isStreaming} />
            </div>
        </div>
    );
});

StreamingAssistantMessage.displayName = 'StreamingAssistantMessage';

