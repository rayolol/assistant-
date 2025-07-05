
from memory.Cache.DiskCache.diskCache import DiskCache
from memory.Cache.Redis.redisCache import RedisCache
from memory.DB.Mongo.MongoDB import MongoDB
from memory.DB.schemas import Conversations


class conversationService:
    def __init__(self, db:MongoDB, cache: RedisCache):
        self.db = db
        self.cache = cache

    async def get_conversations_list(self,user_id: str):
        conversations = await self.db.conversation.get_by_user_id(user_id)

        if not conversations:
            return []

        if not isinstance(conversations, list):
            conversations = [conversations]
        
        return conversations
    
    async def update_conversation(self, convo:Conversations):
        return await self.db.conversation.update(convo)
        
