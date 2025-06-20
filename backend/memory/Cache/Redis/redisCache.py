import redis.asyncio as r
import json
from memory.DB.schemas import ChatMessage
from typing import List, Optional
from models.schemas import FileDoc
from memory.DB.schemas import FileMeta
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
        key = self.make_key(conversation_id=conversation_id, user_id= user_id)

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

        stored_Message = await ChatMessage.insert(message)

        if not stored_Message:
            raise Exception("could not store message")

        history = await self.get_chat_history(db, conversation_id, user_id)
        if history is None:
            print("no history")
            history = []
        
        history.append(stored_Message)

        res = await self.redis_client.setex(
            key,
            self.session_ttl,
            json.dumps(self.serialize_history(history))
        )
        return stored_Message




    async def flush_cache_to_DB(self, conversation_id: str, user_id: str, db: MongoDB) -> None:
        key = self.make_key(conversation_id, user_id)
        raw = await self.redis_client.get(key)
        if not raw:
            return
        msgs = self.deserialize_history(json.loads(raw))
        if msgs:
            await db.message.add_messages(msgs, conversation_id)

    def serialize_history(self, messages: List[ChatMessage]) -> List[dict]:
        results = []
        for msg in messages:
            msg_dict = msg.model_dump(mode='json')
            # Convert null file_id to undefined (by removing the field)
            if msg_dict.get('file_id') is None:
                msg_dict.pop('file_id', None)
            results.append(msg_dict)
        return results

    def deserialize_history(self, data: List[dict]) -> List[ChatMessage]:
        results = []
        for item in data:
            try:
                results.append(ChatMessage.model_validate(item))
            except Exception:
                continue
        return results
    

    async def cache_file_metadata(self, file_id: str, metadata: FileDoc, ttl:int = 600):
        await self.redis_client.setex( f"filemeta: {file_id}", ttl, metadata.model_dump_json())


    async def load_cache_in_db(self, user_id: str, conversation_id: str, message_id: str, file_id: str, db:MongoDB):
        raw = await self.redis_client.get(f"filemeta: {file_id}")
        if raw:
            await db.file.create(
                user_id= user_id, 
                conversation_id= conversation_id, 
                message_id= message_id,
                fileDoc= FileDoc.model_validate_json(raw)
                )
        else: 
            raise Exception("file not found in cache")
            

    async def get_file_metadata(self, file_id: str):
        raw = await self.redis_client.get(f"filemeta: {file_id}")
        if raw: 
            return FileDoc.model_validate_json(raw)
        else: 
            raise Exception("file not found in cache")
        
    
        
