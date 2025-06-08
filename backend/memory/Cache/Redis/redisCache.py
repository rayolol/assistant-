import redis.asyncio as r
import json
from memory.DB.schemas import ChatMessage
from typing import List, Optional
from memory.DB.Mongo.MongoDB import MongoDB

class RedisCache:
    def __init__(self, Redis_host='localhost', Redis_port=6379, Redis_db=0, session_ttl=3600, pool_size=10, socket_timeout=5):
        self.redis_client = r.Redis(
            host=Redis_host,
            port=Redis_port,
            db=Redis_db,
            password=None,
            connection_pool=r.ConnectionPool(
                max_connections=100
            )
        )
        self.session_ttl = session_ttl

    def make_key(self, conversation_id: str, user_id: str) -> str:
        return f"{user_id}"

    async def get_chat_history(self, db: MongoDB, conversation_id: str, user_id: str) -> Optional[List[ChatMessage]]:
        key = self.make_key(conversation_id, user_id)

        try:
            raw = await self.redis_client.get(key)
            if raw:
                return self.deserialize_history(json.loads(raw))

            # fallback to Mongo
            if not getattr(db, 'initialized', False):
                await db.initialize()
            msgs = await db.message.get_conversation_history(conversation_id, user_id)

            if msgs:
                serialized = self.serialize_history(msgs)
                await self.redis_client.setex(key, self.session_ttl, json.dumps(serialized))
                return msgs

        except Exception as e:
            print(f"[RedisCache.get_chat_history] Error: {e}")
            return []

    async def add_message(self, db: MongoDB, session_id: str, conversation_id: str, user_id: str, message: ChatMessage) -> None:
        key = self.make_key(conversation_id, user_id)
        history = await self.get_chat_history(db, conversation_id, user_id)
        if history is None:
            history = []
        history.append(message)

        await self.redis_client.setex(
            key,
            self.session_ttl,
            json.dumps(self.serialize_history(history))
        )

    async def flush_cache_to_DB(self, conversation_id: str, user_id: str, db: MongoDB) -> None:
        key = self.make_key(conversation_id, user_id)
        raw = await self.redis_client.get(key)
        if not raw:
            return
        msgs = self.deserialize_history(json.loads(raw))
        if msgs:
            await db.message.add_messages(msgs, conversation_id)

    def serialize_history(self, messages: List[ChatMessage]) -> List[dict]:
        return [msg.model_dump(mode='json') for msg in messages]

    def deserialize_history(self, data: List[dict]) -> List[ChatMessage]:
        results = []
        for item in data:
            try:
                results.append(ChatMessage.model_validate(item))
            except Exception:
                continue
        return results
