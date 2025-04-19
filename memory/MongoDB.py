from motor.motor_asyncio import AsyncIOMotorClient as MongoClient
from pydantic import BaseModel
from datetime import datetime
from typing import List, Dict, Optional, Any
from beanie import init_beanie, Document , Link
from models import users, conversations, ChatMessage

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
                document_models=[users, conversations, ChatMessage]
                )
            self.initialized = True
        return self
        
    async def create_user(self, username: str, email: str):
        user = users(username=username, email=email)
        await user.insert()
        return user._id
    
    async def add_message(self, messages: ChatMessage, conversation_id: str):
        message = ChatMessage(conversation_id = conversation_id, messages = messages)
        await message.insert()
        
    async def create_conversation(self, user_id: str, name: str = "new conversation"):
        conversation = conversations(user_id=user_id)
        await conversation.insert()
        return conversation.id
        
    async def get_history(self, conversation_id: str):
        history = await ChatMessage.find({"conversation_id": conversation_id}).to_list()
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
        await ChatMessage.find({"_id": conversation_id}).delete()