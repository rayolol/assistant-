import { UserPreferencesSchema } from "@/app/types/zodTypes/userPreferences";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateUserInfo } from "../api";
import { z } from "zod";

export const useSendForm = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (userPreferences: z.infer<typeof UserPreferencesSchema>) => updateUserInfo(userPreferences),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["userPreferences"] });
        },
        onError: (error) => {
            console.error("Error sending form:", error);
        },
    });
};
