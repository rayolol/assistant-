import { useEventEmitter } from "@/app/hooks/useEventEmmiter";
import { useMessageHandling } from "@/app/hooks/useMessageHandling";
import { useState } from "react";



interface tempState {
    event: string;
    data: any
}


export const Event =  ({ title, content }: { title?: string; content?: string }) =>{ 
    const [event, setEvent] = useState<tempState | undefined>(undefined);

    useEventEmitter({
        channel: "chatEvents",
        onListen: (e: any) => {
            try {
                setEvent({
                    event: e.event,
                    data: e.data
                })
            } catch (e) {
                console.error("error recorded: ", e)
            }
        }})
    return (
    <div className="bg-muted text-white p-4 flex flex-col rounded shadow">
        <div className="flex flex-row justify-start items-center">
            <h1>{title}</h1>
            <p>{content}</p>
        </div>
        <div>
            {event && (
                <div>
                    {event.event}
                    {event.data}
                </div>
            )}
        </div>
    </div>
  )},