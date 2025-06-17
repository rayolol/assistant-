import React, { memo, useEffect } from 'react';
import { Attachment } from './Attachment';
import { Message } from '@/app/types/schemas';
import { useGetFile } from '@/app/api/Queries/getfile';

interface UserMessageProps {
    message: Message;
    ref: React.RefObject<HTMLDivElement | null>;
}

export const UserMessage = memo(({ message, ref }: UserMessageProps) => {
  
    const { data: file, isLoading: isFileLoading } = useGetFile(message.file_id || '');
    useEffect(()=>{
        console.log("message content:", message.content)
    }, [message])

    return (
        <div className="m-2 flex flex-col items-end transition-all ease-in-out duration-50 slide-up scroll-mt-[64px]" ref={ref}>
            <div className="px-4 py-3 rounded-4xl max-w-[40%] bg-accent text-accent-foreground">
                <div className="whitespace-pre-wrap">
                    {message.file_id && (
                        <Attachment filePath={file?.url || ''} fileName={file?.name} fileType={file?.type} />
                    )}
                    {message.content}
                </div>
            </div>
        </div>
    );
});

UserMessage.displayName = 'UserMessage';
