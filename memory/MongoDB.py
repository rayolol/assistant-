from motor.motor_asyncio import AsyncIOMotorClient as MongoClient
from pydantic import BaseModel
from datetime import datetime
from typing import List, Dict, Optional, Any
from models import ChatMessage
from beanie import init_beanie, Document , Link

class users(Document):
    username: str
    email: str
#    password: str
    created_at: datetime = datetime.now()

class conversations(Document):
    name: str = "new Conversation"
    user: Link[users]
    messages: List[Link[messages]]
    started_at: datetime = datetime.now()
    last_active: Optional[datetime] = None

class messages(Document):
    role: str
    conversation_id: Link[conversations]
    content: str  # Changed from 'messages' to 'content' for clarity
    timestamp: datetime = datetime.now()
    tool_calls: List[Dict[str, Any]] = []  # Changed from 'tool_Calls' to 'tool_calls' for consistency

#Create user
#user = User(username="alex", email="alex@example.com")
#await user.insert()

#Create conversation
#conversation = Conversation(user_id=user.id)
#await conversation.insert()

#Create messages
#message = chat_history(conversation_id=conversation.id, messages = {"role": "user", "content": "Hello", timestamp: datetime.datetime.now()})
#await message.insert()

#get history
#history = await Message.find(chat_history.conversation_id == str(conv.id))

class MongoDB:
    def __init__(self,db_name='user_db'):
        self.client = MongoClient("mongodb://localhost:27017")
        self.db = db_name
        self.initialized = False


    async def initialize(self):

        if not self.initialized:
            await init_beanie(
                database=self.client[self.db],
                document_models=[users, conversations, messages]
                )
            self.initialized = True
        return self

    async def create_user(self, username: str, email: str):
        user = users(username=username, email=email)
        await user.insert()
        return user._id

    async def add_message(self, message_content: List[ChatMessage], conversation_id: str):
        for msg in message_content:
            message = messages(
                conversation_id=conversation_id,
                role=msg.role,
                content=msg.content,
                timestamp=msg.timestamp
            )
            await message.insert()

    async def create_conversation(self, user_id: str, name: str = "new conversation"):
        conversation = conversations(user=user_id, name=name)
        await conversation.insert()
        return conversation.id

    async def get_history(self, conversation_id: str):
        history = await messages.find({"conversation_id": conversation_id}).to_list()
        return history

    async def get_conversation(self, user_id: str):
        try:
            conversation = await conversations.find({"user": user_id}).to_list()
            return conversation
        except Exception as e:
            print(f"Error in get_conversation: {e}")
            return None


    async def delete(self, conversation_id: str):

        if not self.initialized:
            await self.initialize()
        await messages.find({"_id": conversation_id}).delete()