
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