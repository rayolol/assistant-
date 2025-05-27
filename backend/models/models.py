from pydantic import BaseModel, Field
from beanie import Document, Link, PydanticObjectId
from datetime import datetime
from typing import List, Dict, Any, Optional, Union



class users(Document):
    username: str
    email: str
#    password: str
    created_at: datetime = Field(default_factory=datetime.now)
    
class conversations(Document):
    user_id: Link[users]
    name: str = "new conversation"
    started_at: datetime = Field(default_factory=datetime.now)
    last_active: datetime = Field(default_factory=datetime.now)

class ChatSession(BaseModel):
    user_id: Union[str,PydanticObjectId]
    session_id: str
    conversation_id: Union[str, PydanticObjectId]



class ChatMessage(Document):
    conversation_id: Union[str, PydanticObjectId ,Link[conversations]]
    timestamp: datetime = Field(default_factory=datetime.now)
    role: str
    content: str
    metadata: Dict[str, Any] = Field(default_factory=dict)
    #tool_calls: List[ToolUsageRecord] = []

    def __init__(self, **data):
        # Convert ObjectId to string for serialization purposes
        if 'conversation_id' in data and not isinstance(data['conversation_id'], str):
            try:
                data['conversation_id'] = str(data['conversation_id'])
            except Exception:
                pass
                
        if 'timestamp' not in data:
            data['timestamp'] = datetime.now()
        super().__init__(**data)
        

class ToolUsageRecord(BaseModel):
    tool_name: str
    timestamp: datetime = Field(default_factory=datetime.now)
    inputs: Dict[str, Any] = {}
    success: bool = True
    output_summary: str = ""
    
    def __init__(self, **data):
        if 'timestamp' not in data:
            data['timestamp'] = datetime.now()
        super().__init__(**data)
        

class Mem0Context(BaseModel):
    """Main data pipeline context for the agent application"""
    username: str | None = None
    recent_memories: List[Dict[str, Any]] | None = None
    user_id: Union[str | PydanticObjectId] | None = None
    session_id: str | None = None
    session_start_time: datetime = Field(default_factory=datetime.now)
    conversation_id: str | None = None
    current_agent: str | None = None
    previous_agent: str | None = None
    tool_usage_history: List[ToolUsageRecord] = []
    response_metrics: Dict[str, Any] = {}
    chat_history: List[ChatMessage] = []
    
    def to_chat_session(self) -> "ChatSession":
        """convert context to chat session"""
        return ChatSession(
            user_id = self.user_id,
            session_id = self.session_id,
            conversation_id = self.conversation_id
        )
    
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
        self.user_id = str(chat_request.user_id)
        self.session_id = chat_request.session_id
        self.conversation_id = str(chat_request.conversation_id)
        return self

class ChatRequest(BaseModel):
    user_id: Optional[str] = None
    session_id: str
    conversation_id: Optional[str] = None 
    role: str
    timestamp: Optional[str] = None
    content: str
    ui_metadata: Dict[str, Any] = {}
    flags: Dict[str, Any] = {}
        
class ChatResponse(BaseModel):
    ChatSession: ChatSession 
    status: str = "success"
    current_agent: str
    response: str
    timestamp: str = None
    response_metadata: Dict[str, Any] = {}
    tool_calls: List[ToolUsageRecord] = []
    chat_history: List[ChatMessage] = []

def normalize_id(id_value):
    """Convert any ID format (Link, ObjectId, string) to a plain string ID."""
    if id_value is None:
        return None
        
    # Handle Link objects
    if hasattr(id_value, 'id'):
        return str(id_value.id)
        
    # Handle string representation of Link objects
    if isinstance(id_value, str) and '<beanie.odm.fields.Link' in id_value:
        import re
        id_match = re.search(r"ObjectId\('([^']+)'\)", id_value)
        if id_match:
            return id_match.group(1)
            
    # Handle ObjectId objects
    if hasattr(id_value, '__str__'):
        return str(id_value)
        
    return str(id_value)

class UserPreferences(BaseModel):
    user_id: Union[str, PydanticObjectId ,Link[users]]
    occupation: str
    interests: str
    custom_prompt: str
    user_info: str


class UserPreferencesDoc(Document):
    user_id: Union[str, PydanticObjectId ,Link[users]]
    occupation: Optional[str] = None
    interests: Optional[str] = None
    custom_prompt: Optional[str] = None
    user_info: Optional[str] = None

