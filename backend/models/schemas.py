from pydantic import BaseModel, field_serializer, field_validator, Field, SerializationInfo
from typing import Union
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
    id: str = Field(..., alias='_id')
    user_id: str
    conversation_id: str
    session_id: str
    timestamp: datetime
    role: str
    content: str
   

class PromptSettingsDTO(BaseModel):
    id: str | None = None
    user_id: str
    display_name: str | None = None
    custom_prompt: str | None = None
    occupation: str | None = None
    interests: str | None = None
    about_me: str | None = None
    updated_at: str | None = None # ISO string format with milliseconds precision

    
  