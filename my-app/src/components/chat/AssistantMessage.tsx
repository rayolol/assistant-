import { memo, startTransition } from 'react';
import { MarkdownRenderer, } from '@/lib/renderer';
import {StreamingMarkdownRenderer} from "@/lib/StreamingMdRenderer"

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

export const StreamingAssistantMessage = ({ streamContent, isStreaming }: { streamContent: string, isStreaming: boolean }) => {
    return (
        <div className="flex justify-start p-4">
            <div className='p4 whitespace-pre-wrap'>
                <StreamingMarkdownRenderer content={streamContent} isStreaming={isStreaming} />
            </div>
        </div>
    );
};

StreamingAssistantMessage.displayName = 'StreamingAssistantMessage';

