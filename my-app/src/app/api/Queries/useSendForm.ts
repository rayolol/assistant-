import { Promptsettings } from "@/app/types/schemas";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updatePromptSettings } from "../api";

export const useSendForm = () => {
    const queryClient = useQueryClient();
    return useMutation<Promptsettings, Error, Promptsettings>({
        mutationFn: (promptSetting: Promptsettings ) => updatePromptSettings(promptSetting),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["userPreferences"] });
        },
        onError: (error) => {
            console.error("Error sending form:", error);
        },
    });
};
