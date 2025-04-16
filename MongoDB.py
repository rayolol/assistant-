from motor.motor_asyncio import AsyncIOMotorClient as MongoClient
from pydantic import BaseModel
from datetime import datetime
from typing import List, Dict
from models import ChatMessage, users, conversations
from beanie import init_beanie, Document



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
        return user.id
    
    async def add_message(self, messages: List[ChatMessage], conversation_id: str):
        message = ChatMessage(conversation_id=conversation_id, messages = messages)
        await message.insert()
        
    async def create_conversation(self, user_id: str):
        conversation = conversations(user_id=user_id)
        await conversation.insert()
        return conversation.id
        
    async def get_history(self, conversation_id: str):
        history = await ChatMessage.find(ChatMessage.conversation_id == conversation_id).to_list()
        print (history)
        return history
    
    async def get_conversation(self, user_id: str):
        conversation = await conversations.find(conversations.user_id == user_id)
        return conversation
    
    async def delete(self, conversation_id: str):
        await ChatMessage.find(ChatMessage.conversation_id == conversation_id).delete()