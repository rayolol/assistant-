import { useEffect } from "react"
import { appEvents,  } from "@/lib/GlobalServices"


interface EventEmitterProps {
    onListen: (data: any) => void;
    channel: any;
}




export const useEventEmitter = ({onListen, channel}: EventEmitterProps) => {
    useEffect(() => {
        try {
            appEvents.listen(channel, onListen);
            return () => {
                appEvents.off(channel, onListen)
            };
        } catch (e) {
            console.error("error detected: ", e)
        }       
    })
}