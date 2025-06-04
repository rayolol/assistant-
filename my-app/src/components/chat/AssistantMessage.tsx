import { memo, useMemo } from 'react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { renderMarkdown } from '@/lib/renderer';


export const AssistantMessage = memo(({ message }: { message: string }) => {
    return (
        <div className="flex justify-start">
            <div className="p-4 whitespace-pre-wrap">
                <MarkdownRenderer content={message} />
            </div>
        </div>
    );
});

AssistantMessage.displayName = 'AssistantMessage';

export const StreamingAssistantMessage = memo(({ streamContent }: { streamContent: string }) => {
    return (
        <div className="flex justify-start p-4">
            <div className='p4 whitespace-pre-wrap'>
                <MarkdownRenderer content={streamContent} />
            </div>
        </div>
    );
});

StreamingAssistantMessage.displayName = 'StreamingAssistantMessage';

