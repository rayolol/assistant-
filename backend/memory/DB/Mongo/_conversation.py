from memory.DB.schemas import Conversations
from datetime import datetime
from pydantic import Field
from typing import Dict, Any

class ConversationOps:
    async def create(self, user_id: str, name: str = "New Conversation"):
        #TODO: add session id
        convo = Conversations(user_id=user_id,session_id="123456790", name=name)
        await convo.insert()
        return convo

    async def get_by_user_id(self, user_id: str):
        return await Conversations.find(Conversations.user_id == user_id).to_list()
    
    async def delete(self, convo_id):
        convo = await self.get_by_id(convo_id)
        if convo: 
            await convo.delete()
            return True
        return False
    
    async def update(self, convo_id: str, name: str = None, is_archived: bool = None, flags: Dict[str,Any] = None):
        convo = await self.get_by_id(convo_id)
        if convo: 
            convo.name = name
            convo.is_archived = is_archived
            convo.flags = flags
            convo.last_active = datetime.now()
            await convo.save()
            return convo
        return None
    
    async def get_by_id(self, convo_id: str):
        return await Conversations.find_one(Conversations.id == convo_id)
