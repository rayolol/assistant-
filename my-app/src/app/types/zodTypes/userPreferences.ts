import { z } from "zod/v4";

export const UserPreferencesSchema = z.object({
    user_id: z.string(),
    username: z.string(),
    occupation: z.string(),
    interests: z.string(),
    custom_prompt: z.string(),
    user_info: z.string(),
});

