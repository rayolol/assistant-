
from beanie import Document
from datetime import datetime
from pydantic import Field, field_validator, field_serializer
from beanie import Link
from pydantic import BaseModel
from typing import Dict, Any, Union, List, Type, Optional
from beanie import PydanticObjectId
from bson import ObjectId



#TODO: impement Prompt Settings
#TODO: impement to dto function
class DTOConverter:
    def to_dto(self, dto_class: Type[BaseModel]) -> BaseModel:
        return dto_class.model_validate(self)

    @classmethod
    def from_dto(cls, dto):
        return cls.model_validate(dto.model_dump())



class Users(Document, DTOConverter):
    id: Optional[PydanticObjectId] = Field(default_factory=PydanticObjectId, alias="_id")
    username: str
    email: str
#    JWT: str
    created_at: datetime = Field(default_factory=datetime.now)


class Conversations(Document, DTOConverter):
    id: Optional[PydanticObjectId]= Field(..., alias= '_id')
    user_id: Union[str, PydanticObjectId ,Link[Users]]
    session_id: str
    name: str = "new conversation"
    started_at: datetime = Field(default_factory=datetime.now)
    last_active: datetime = Field(default_factory=datetime.now)
    is_archived: bool = False
    flags: Dict[str,Any] = Field(default_factory=dict)
class ChatMessage(Document, DTOConverter):
    id: Optional[PydanticObjectId]= Field(..., alias= '_id')
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

class PromptSettings(Document, DTOConverter):
    
    id: Optional[PydanticObjectId] = Field(default_factory=PydanticObjectId, alias="_id")
    user_id: Union[str, PydanticObjectId ,Link[Users]]
    display_name: str | None = None
    custom_prompt: str | None = None
    occupation: str | None = None
    interests: str | None = None
    about_me: str | None = None
    updated_at: datetime = Field(default_factory=datetime.now)

