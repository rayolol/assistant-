from pydantic import BaseModel
from beanie import Document, Link, PydanticObjectId
from datetime import datetime
from typing import List, Dict, Any, Optional



class users(Document):
    username: str
    email: str
#    password: str
    created_at: datetime = datetime.now()
    
class conversations(Document):
    user_id: Link[users]
    started_at: datetime = datetime.now()
    last_active: datetime = datetime.now()

class ChatSession(BaseModel):
    user_id: str
    session_id: str
    conversation_id: str

class ChatMessage(Document):
    conversation_id: Link[conversations]
    timestamp: datetime | None = None
    role: str
    content: str
    #tool_calls: List[ToolUsageRecord] = []

    def __init__(self, **data):
        # Convert string ID to PydanticObjectId if needed
        if 'conversation_id' in data and isinstance(data['conversation_id'], str):
            try:
                data['conversation_id'] = PydanticObjectId(data['conversation_id'])
            except Exception:
                # If it's not a valid ObjectId format, we'll need to handle this differently
                # Maybe look up the conversation by another field
                pass
                
        if 'timestamp' not in data:
            data['timestamp'] = datetime.now()
        super().__init__(**data)

class ToolUsageRecord(BaseModel):
    tool_name: str
    timestamp: datetime = None
    inputs: Dict[str, Any] = {}
    success: bool = True
    output_summary: str = ""
    
    def __init__(self, **data):
        if 'timestamp' not in data:
            data['timestamp'] = datetime.now()
        super().__init__(**data)
        

class Mem0Context(BaseModel):
    """Main data pipeline context for the agent application"""
    recent_memories: List[Dict[str, Any]] | None = None
    user_id: str | None = None
    session_id: str | None = None
    session_start_time: datetime | None = None
    conversation_id: str | None = None
    current_agent: str | None = None
    previous_agent: str | None = None
    tool_usage_history: List[ToolUsageRecord] = []
    response_metrics: Dict[str, Any] = {}
    chat_history: List[ChatMessage] = []
    
    def add_to_history(self, user_message: str, assistant_response: str) -> None:
        """Add a conversation entry to the history"""
        user_entry = ChatMessage(
            conversation_id=self.conversation_id,
            timestamp=datetime.now(),
            role="user",
            content=user_message
        )
        self.chat_history.append(user_entry)
        
        assistant_entry = ChatMessage(
            conversation_id=self.conversation_id,
            timestamp=datetime.now(),
            role="assistant",
            content=assistant_response
        )
        self.chat_history.append(assistant_entry)
    
    def to_chat_response(self) -> "ChatResponse":
        """convert context to chat response"""
        return ChatResponse(
            user_id = self.user_id,
            session_id = self.session_id,
            conversation_id = self.conversation_id,
            current_agent = self.current_agent,
            response = self.response_metrics,
            timestamp = self.session_start_time,
            tool_calls = self.tool_usage_history,
            chat_history = self.chat_history            
        )
        
    def receive_chat_request(self, chat_request: "ChatRequest") -> "Mem0Context":
        """convert chat request to context"""
        self.user_id = chat_request.user_id
        self.session_id = chat_request.session_id
        self.conversation_id = chat_request.conversation_id
        return self

class ChatRequest(BaseModel):
    user_id: str
    session_id: str
    conversation_id: str
    message: str
    ui_metadata: Dict[str, Any] = {}
    flags: Dict[str, Any] = {}
        
class ChatResponse(BaseModel):
    status: str = "success"
    current_agent: str
    response: str
    timestamp: str = None
    response_metadata: Dict[str, Any] = {}
    tool_calls: List[ToolUsageRecord] = []
    chat_history: List[ChatMessage] = []
