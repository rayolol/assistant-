import { useQuery } from "@tanstack/react-query";
import { fetchMessagesHistory } from "../api";
import { Message } from "@/app/types/schemas";

export const useChathistory = (conversation_id: string | null | undefined, user_id: string | null, session_id: string | null) =>
    useQuery<Message[]>({
        queryKey: ['messages', conversation_id],
        queryFn: () => {
            if (!conversation_id || conversation_id === 'None' || conversation_id === 'pending') {
                return [];
            }
            return fetchMessagesHistory(conversation_id, user_id, session_id);
        },
        enabled: Boolean(user_id) && conversation_id !== 'pending',
        refetchOnWindowFocus: false,
        staleTime: 1000 * 60 * 60 * 3,
        
    })