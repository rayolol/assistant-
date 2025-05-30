import { useQuery } from "@tanstack/react-query";
import { fetchUserId } from "../api";
import { User } from "@/app/types/schemas";


export const useGetUser = (username: string, email: string) =>
    useQuery<User>({
        queryKey: ['user', username, email],
        queryFn: () => fetchUserId({ username, email }),
        enabled: Boolean(username) && Boolean(email),
        refetchOnWindowFocus: false,
    })
