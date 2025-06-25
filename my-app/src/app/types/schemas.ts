import { z } from "zod";

export const MessageSchema = z.object({
    id: z.string(),
    user_id: z.string(),
    session_id: z.string(),
    conversation_id: z.string(),
    role: z.string(),
    content: z.string(),
    timestamp: z.coerce.date().optional(),
    flags: z.any(),
    file_id: z.string().nullable(),
})

export type Message = z.infer<typeof MessageSchema>;


export const ConversationSchema = z.object({
    id: z.string(),
    user_id: z.string(),
    session_id: z.string(),
    name: z.string(),
    started_at: z.coerce.date().optional(),
    last_active: z.coerce.date().optional(),
    is_archived: z.boolean(),
    flags: z.any(),
})

export type Conversation = z.infer<typeof ConversationSchema>;

export const UserSchema = z.object({
    id: z.string(), // Pydantic ObjectId serialized to string
    username: z.string(),
    email: z.string().email(),
    created_at: z.coerce.date().optional() // assuming ISO string from backend
  });
  
  export type User = z.infer<typeof UserSchema>;


export const PromptSettingsSchema = z.object({
    id: z.string().optional(),
    user_id: z.string(),
    display_name: z.string(),
    custom_prompt: z.string(),
    occupation: z.string(),
    interests: z.string(),
    about_me: z.string(),
    updated_at: z.coerce.date().optional()// assuming ISO string from backend
  });
  
  export type Promptsettings = z.infer<typeof PromptSettingsSchema>;

export const FileAttachmentSchema = z.object({
    file_id: z.string(),
    file_type: z.string().optional(),
    file_size: z.number().optional(),
    file_name: z.string().optional(),
    file_url: z.string(),
}).transform((data) =>({
    id: data.file_id,
    type: data.file_type,
    size: data.file_size,
    name: data.file_name,
    url: data.file_url
}));

export type FileAttachment = z.infer<typeof FileAttachmentSchema>;
