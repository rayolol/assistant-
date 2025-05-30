from memory.DB.schemas import ChatMessage
from typing import Dict, Any


class MessageOps:
    async def create(self, message: ChatMessage):
        await message.insert()
        return message

    async def get_by_conversation_id(self, convo_id: str):
        return await ChatMessage.find(ChatMessage.conversation_id == convo_id).to_list()
    
    async def get_by_user_id(self, user_id: str):
        return await ChatMessage.find(ChatMessage.user_id == user_id).to_list()
    
    async def get_by_id(self, message_id: str):
        return await ChatMessage.find_one(ChatMessage.id == message_id)
    
    async def delete(self, message_id: str):
        message = await self.get_by_id(message_id)
        if message: 
            await message.delete()
            return True
        return False
    
    async def update(self, message_id: str, content: str = None, metadata: Dict[str,Any] = None):
        message = await self.get_by_id(message_id)
        if message:
            message.content = content
            message.metadata = metadata
            await message.save()
            return message
        return None
    
    async def get_conversation_history(self, convo_id: str, user_id: str):
        return await ChatMessage.find(ChatMessage.conversation_id == convo_id, ChatMessage.user_id == user_id).to_list()

