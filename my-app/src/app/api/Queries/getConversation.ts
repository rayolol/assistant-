import { useQuery } from "@tanstack/react-query";
import { fetchConversations } from "../api";
import { Conversation } from "@/app/types/schemas";


export const useConversation = ( user_id: string | null ) =>
    useQuery<Conversation[]>({
        queryKey: ['conversation', user_id],
        queryFn: () => fetchConversations(user_id ?? ' '),
        enabled: Boolean(user_id),
        refetchOnWindowFocus: false,
        
    })
