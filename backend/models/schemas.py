from pydantic import BaseModel, field_serializer, field_validator, Field, SerializationInfo
from typing import Union, Optional, List
from datetime import datetime
from bson import ObjectId
from beanie import PydanticObjectId
import pydantic


class UserDTO(BaseModel):
    id: str 
    username: str
    email: str
    created_at: datetime


class ConversationDTO(BaseModel):
    id: str 
    user_id: str
    session_id: str
    name: str
    started_at: datetime
    last_active: datetime
    is_archived: bool
    flags: dict

    
class ChatMessageDTO(BaseModel):
    id: str
    user_id: str
    conversation_id: str
    session_id: str
    timestamp: datetime
    role: str
    content: str
    file_id: Optional[str] | None = None
   

class PromptSettingsDTO(BaseModel):
    id: str | None = None
    user_id: str
    display_name: str | None = None
    custom_prompt: str | None = None
    occupation: str | None = None
    interests: str | None = None
    about_me: str | None = None
    updated_at: str | None = None # ISO string format with milliseconds precision


class FileDoc(BaseModel):
    file_id: str
    file_type: str
    file_size: int
    file_name: str 
    file_url: str




    
  