import { useQuery } from "@tanstack/react-query";
import { fetchPromptSettings } from "../api";
import { Promptsettings } from "@/app/types/schemas";


export const useGetForm = (user_id: string | null ) =>
    useQuery<Promptsettings>({
        queryKey: ['userPreferences', user_id],
        queryFn: () => fetchPromptSettings(user_id ?? ' '),
        enabled: Boolean(user_id),
        refetchOnWindowFocus: false,
        
    })