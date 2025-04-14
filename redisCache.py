import redis.asyncio as r  # Import the Redis library
import json
from pydantic import BaseModel as baseModel
from default_tools import ChatMessage, Mem0Context
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta 
from MongoDB import MongoDB
import os
import asyncio


class ChatSession(baseModel):
    user_id: str
    session_id: str
    conversation_id: str

class RedisCache:
    def __init__(self,Redis_host='localhost',Redis_port=6379,Redis_db=0,session_ttl=3600):
        self.host = Redis_host
        self.port = Redis_port
        self.db = Redis_db
        self.session_ttl = session_ttl  # Default TTL for session data (1 hour)
        
        self.redis_client = r.Redis(
            host=self.host,
            port=self.port,
            db=self.db,
            password=None
        )
        
    def make_key(self, session: ChatSession) -> str:
        return f"session:{session.session_id}"
    
    async def get_chat_history(self, session: ChatSession) -> Optional[List[ChatMessage]]:
        """Retrieve the chat history from Redis"""
        key = self.make_key(session)
        chat_history_json = await self.redis_client.get(key)
        if chat_history_json:
            chat_data = json.loads(chat_history_json)
            
            messages = [ChatMessage(**msg) for msg in chat_data]
            
            return self.deserialize_history(messages)
        else:
            return None
        
    async def add_message(self, session: ChatSession, message: ChatMessage) -> None:
        """Add a message to the chat history in Redis"""
        key = self.make_key(session)
        # Get current history or initialize empty list
        current_history = await self.get_chat_history(session) or []
        # Add the new message
        current_history.append(message)
        # Serialize the chat history
        serialized_data = self.serialize_history(current_history)
        await self.redis_client.setex(key,self.session_ttl, json.dumps(serialized_data))
    
    def serialize_history(self, data: List[ChatMessage]) -> Any:
        """Serialize data to JSON string"""
        serialized_data = []
        for m in data:
            if m.timestamp and isinstance(m.timestamp, datetime):
                m.timestamp = m.timestamp.isoformat()  # Convert datetime to ISO format string
                serialized_data.append(m.model_dump())  # Add the serialized message to the list
                
        return serialized_data
    
    def deserialize_history(self, data: List[ChatMessage]) -> List[ChatMessage]:
        """Deserialize data from JSON string"""
        deserialized_data = []
        
        for m in data:
            try: 
                if m.timestamp and isinstance(m.timestamp, str):
                    m.timestamp = datetime.fromisoformat(m.timestamp)  # Convert ISO format string back to datetime
            except ValueError as e:
                print(f"Error parsing timestamp: {e}")
                m.timestamp = datetime.now()  # Fallback to current time if parsing fails
                
            deserialized_data.append(m) 
            # Add the deserialized message to the list
        return deserialized_data
   
    async def load_from_db(self, session: ChatSession, db: MongoDB) -> None:
        """Load chat history from MongoDB and store it in Redis"""
        key = self.make_key(session)
        
        if not getattr(db, 'initialized', False):
            await db.initialize()
            
        history_docs = await db.get_history(session.conversation_id)
        chat_history = [ChatMessage(**doc) for doc in history_docs]
        
        chat_history = self.deserialize_history(chat_history)
        
        serialized_data = self.serialize_history(chat_history)
        
        if chat_history:
            await self.redis_client.setex(key, self.session_ttl, json.dumps(serialized_data))
        
        return chat_history
    
    async def flush_cache_to_DB(self, session: ChatSession, db: MongoDB) -> None:
        """Flush chat history from Redis to MongoDB"""
        key = self.make_key(session)
        
        chat_history_json = await self.redis_client.get(key)
        if chat_history_json:
            print("no chat history found")
        
        chat_data = json.loads(chat_history_json)
        
        full_chat_history = []
        for msg in chat_data:
            msg = ChatMessage(**msg)
            full_chat_history.append(msg)
            
        await db.add_message(full_chat_history, session.conversation_id)
        print("flushed", full_chat_history.__str__())
            
    
    
if __name__ == "__main__":
    async def main():
        mongo_db_instance = MongoDB()
        await mongo_db_instance.initialize()
        session = ChatSession(user_id="123", session_id="abc", conversation_id="conv1")
        cache = RedisCache()

        # First try to load from cache
        history = await cache.get_chat_history(session)

        # If empty, load from MongoDB
        if not history:
            history = await cache.load_from_db(session, mongo_db_instance)

        # Add new message
        msg = ChatMessage(role="user", content="Hello!", timestamp=datetime.now())
        await cache.add_message(session, msg)
        
        print(await cache.get_chat_history(session))

    asyncio.run(main())
