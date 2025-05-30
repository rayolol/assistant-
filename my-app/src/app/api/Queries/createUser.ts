import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createUser } from "../api";
import { User } from "@/app/types/schemas";


export const useCreateUser = () => {
    const qc = useQueryClient()
    return useMutation<User, Error, {username: string, email: string}>({
        mutationFn: ({username, email}: {username: string, email: string}) => 
            createUser({username, email}),
        onSuccess: (data) => {
            console.log("User created successfully:", data);
            qc.invalidateQueries({ queryKey: ['user', data.username, data.email] });
        },
        onError: (error) => {
            console.error("Mutation error creating user:", error);
        }
    })
}
