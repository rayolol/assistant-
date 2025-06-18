import React, { memo, useEffect } from 'react';
import { Attachment } from './Attachment';
import { Message } from '@/app/types/schemas';
import { useGetFile } from '@/app/api/Queries/getfile';
import { Trash2Icon } from 'lucide-react';
import { Pencil } from 'lucide-react';
import Image from 'next/image';
import { Tr } from 'zod/v4/locales';

interface UserMessageProps {
    message: Message;
    ref: React.RefObject<HTMLDivElement | null>;
}

export const UserMessage = memo(({ message, ref }: UserMessageProps) => {
  
    const { data: file, isLoading: isFileLoading } = useGetFile(message.file_id);
    useEffect(()=>{
        console.log("message file_id: ", message.file_id)
        console.log("file fetched: ", file)
    }, [ file, message.file_id])

    return (
        <div className="m-2 flex flex-col items-end transition-all ease-in-out duration-50 slide-up scroll-mt-[64px]" ref={ref}>
            <div className="px-4 py-3 rounded-4xl max-w-[40%] bg-accent text-accent-foreground">
                <div className="whitespace-pre-wrap">
                    {message.file_id && (
                        <Attachment filePath={file?.url || ''} fileName={file?.name} fileType={file?.type} loading={isFileLoading}/>
                    )}
                    {message.content}
                </div>
            </div>
            <div className = "transition-opacity ease-in-out flex m-1 opacity-0 hover:opacity-60 gap-2 flex-row items-center justify-end">
                <button className=' p-2 rounded-sm hover:bg-accent'>
                    <Trash2Icon className='bg-muted opacity-50'/>
                </button>
                <button className='p-2 rounded-sm hover:bg-accent'>
                    <Pencil className='bg-muted opacity-50'/>
                </button>
            </div>
        </div>
    );
});

UserMessage.displayName = 'UserMessage';
