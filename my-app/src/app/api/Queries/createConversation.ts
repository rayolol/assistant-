import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createConversation } from "../api";
import { Conversation } from "@/app/types/schemas";


export const useCreateConversation = () => {
    const qc = useQueryClient()
    return useMutation<Conversation, Error, { user_id: string, name?: string }>({
        mutationFn: ({user_id, name}: { user_id: string, name?: string }) => 
            createConversation(user_id, name),
        onSuccess: (data) => {
            console.log("Conversation created successfully:", data);
            qc.invalidateQueries({ queryKey: ['conversations', data.user_id] });
        },
        onError: (error) => {
            console.error("Mutation error creating conversation:", error);
        }
    })
}