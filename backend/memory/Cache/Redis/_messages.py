import redis.asyncio as r
from memory.Cache.Redis.utils import deserialize_history, serialize_history
from memory.DB.schemas import ChatMessage
from typing import List 
import json


class MessageOps:
    def __init__(self, redis_client: r.Redis, session_ttl: int):
        self.redis_client = redis_client
        self.session_ttl = session_ttl


    def make_message_key(self, conversation_id:str, user_id:str):
        return f"{user_id}"
    
    async def get_chat_history(self, conversation_id:str, user_id:str):
        key = self.make_message_key(conversation_id, user_id)

        try: 
            raw = await self.redis_client.get(key)
            if raw:
                return deserialize_history(json.loads(raw))
            
            return []
        
        except Exception as e:
            print("error: [get chat history]: ", e)
            return []

    async def update_history(self,  conversation_id:str, user_id:str, history: List[ChatMessage]): 
        key = self.make_message_key(conversation_id, user_id)

        try:
            res = await self.redis_client.setex(key, self.session_ttl, json.dumps(serialize_history(history)))

            if not res:
                raise Exception("could not store history in cache")
            
        except Exception as e:
            print("error in [add_message]: ", e )
    
            
            


