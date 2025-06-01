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
    const rendered = useMemo(() => renderMarkdown(streamContent), [streamContent]);

    return (
        <div className="flex justify-start">
            <div className="p-4 prose dark:prose-invert whitespace-pre-wrap">
                <div dangerouslySetInnerHTML={{ __html: rendered }} />
            </div>
        </div>
    );
});

StreamingAssistantMessage.displayName = 'StreamingAssistantMessage';

