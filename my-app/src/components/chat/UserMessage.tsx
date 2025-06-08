import Image from 'next/image';
import React, { memo } from 'react';
import { Pencil, Copy } from 'lucide-react';


interface UserMessageProps {
    message: string;
    attachment?: string | null;
    ref: React.RefObject<HTMLDivElement | null>;
}



export const UserMessage = memo(({ message, attachment = null, ref }: UserMessageProps) => {

    return (
        <div className="m-2 flex flex-col items-end transition-all ease-in-out duration-50 slide-up scroll-mt-[64px]" ref={ref}>
            <div className="px-4 py-3 rounded-4xl max-w-[40%] bg-accent text-accent-foreground">
                <div className="whitespace-pre-wrap">
                    {attachment && (
                        <div className="mb-2">
                            <Image src={attachment} alt="Attachment" className="max-w-xs" />
                        </div>
                    )}
                    {message}
                </div>
            </div>
            <div className="flex gap-2 mt-1 opacity-0 hover:opacity-100 transition-opacity ease-in duration-300">
                <button className="p-1 rounded-full text-muted-foreground hover:text-accent-foreground transition-colors">
                    <Pencil size={16} />
                </button>
                <button className="p-1 rounded-full text-muted-foreground hover:text-accent-foreground transition-colors">
                    <Copy size={16} />
                </button>
            </div>
        </div>
    );
});

UserMessage.displayName = 'UserMessage';
