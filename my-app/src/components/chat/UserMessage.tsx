import Image from 'next/image';
import { memo } from 'react';



export const UserMessage = memo(({ message, attachment = null }: { message: string, attachment?: null}) => {
    return (
        <div className="flex justify-end">
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