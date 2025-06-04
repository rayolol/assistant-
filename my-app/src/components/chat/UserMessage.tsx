import Image from 'next/image';
import React, { memo } from 'react';


interface UserMessageProps {
    message: string;
    attachment?: string | null;
    ref: React.RefObject<HTMLDivElement | null>;
}



export const UserMessage = memo(({ message, attachment = null, ref }: UserMessageProps) => {

    return (
        <div className="flex justify-end transition-all ease-in-out duration-50 slide-up scroll-mt-[64px]" ref={ref}>
            <div className="p-4 rounded-full bg-accent text-accent-foreground">
                <div className="whitespace-pre-wrap">
                    {attachment && (
                        <div className="mb-2">
                            <Image src={attachment} alt="Attachment" className="max-w-xs" />
                        </div>
                    )}
                    {message}
                </div>
            </div>
        </div>
    );
});

UserMessage.displayName = 'UserMessage';