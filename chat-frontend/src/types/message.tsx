
export type Message = {
    user_id: string | null;
    session_id: string ;
    conversation_id: string | null;
    role: string;
    content: string;
    timestamp: string;
    ui_metadata: any;
    flags: any;
    
}