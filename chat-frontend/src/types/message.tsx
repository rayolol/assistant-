
export type Message = {
    user_id: string;
    session_id: string ;
    conversation_id: string;
    role: string;
    content: string;
    timestamp: string;
    ui_metadata: any;
    flags: any;
    
}

export type User = {
    user_id: string;
    username: string;
    email: string;
    current_conversation_id: string;
    created_at: string;
    updated_at: string;
}

export type Conversation = {
    name: string | "new conversation";
    user_id: string;
    conversation_id: string;
    messages: Message[];
    last_active: string | Date; // datetime
    created_at: string;
}