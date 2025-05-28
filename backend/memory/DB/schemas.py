from beanie import Document
from datetime import datetime
from pydantic import Field
from beanie import Link
from pydantic import BaseModel
from typing import Dict, Any, Union, List
from beanie import PydanticObjectId

class Users(Document):
    username: str
    email: str
#    JWT: str
    created_at: datetime = Field(default_factory=datetime.now)

class Conversations(Document):
    user_id: Union[str, PydanticObjectId ,Link[Users]]
    session_id: str
    name: str = "new conversation"
    started_at: datetime = Field(default_factory=datetime.now)
    last_active: datetime = Field(default_factory=datetime.now)
    is_archived: bool = False
    flags: Dict[str,Any] = Field(default_factory=dict)


class ChatMessage(Document):
    user_id: Union[str, PydanticObjectId ,Link[Users]]
    conversation_id: Union[str, PydanticObjectId ,Link[Conversations]]
    session_id: str
    timestamp: datetime = Field(default_factory=datetime.now)
    role: str
    content: str
    metadata: Dict[str, Any] = Field(default_factory=dict)
    #tool_calls: List[Dict[str,Any]] = []
    #planned_steps: List[Dict[str,Any]] = []
    #attachments: Any = None
    

