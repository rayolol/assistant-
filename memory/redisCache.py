import redis.asyncio as r  # Import the Redis library
import json
from models import ChatMessage, ChatSession, Mem0Context
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta 
from MongoDB import MongoDB
import os
import asyncio




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
    
    async def get_chat_history(self, db: MongoDB, session: ChatSession) -> Optional[List[ChatMessage]]:
        """Retrieve the chat history from Redis"""
        
        key = self.make_key(session)
        
        history_json = await self.redis_client.get(key)
        
        if history_json:
            chat_data = json.loads(history_json)
            
            # Convert the chat data to ChatMessage objects
            messages = []
            for msg in chat_data:
                # If conversation_id is a string representation of a Link object, use the session's conversation_id
                if 'conversation_id' in msg and isinstance(msg['conversation_id'], str) and '<beanie.odm.fields.Link' in msg['conversation_id']:
                    msg['conversation_id'] = session.conversation_id
                
                try:
                    messages.append(ChatMessage(**msg))
                except Exception as e:
                    print(f"Error creating ChatMessage: {e}")
                    # Skip this message if it can't be converted
                    continue
            
            return self.deserialize_history(messages)
        else:
            history = await db.get_history(session.conversation_id)
            
            return self.deserialize_history(history)
    
    async def add_message(self,db: MongoDB, session: ChatSession, message: ChatMessage) -> None:
        """Add a message to the chat history in Redis"""
        key = self.make_key(session)
        # Get current history or initialize empty list
        current_history = await self.get_chat_history(db, session) or []
        # Add the new message
        current_history.append(message)
        # Serialize the chat history
        serialized_data = self.serialize_history(current_history)
        await self.redis_client.setex(key, self.session_ttl, json.dumps(serialized_data))
    
    def serialize_history(self, data: List[ChatMessage]) -> Any:
        """Serialize data to JSON string"""
        serialized_data = []
        for m in data:
            # Create a copy of the message data
            message_dict = {}
            
            # Handle Link objects for conversation_id
            if hasattr(m, 'conversation_id'):
                if hasattr(m.conversation_id, '__str__'):
                    # Store the actual ID value, not the Link object representation
                    message_dict['conversation_id'] = str(m.conversation_id).replace('ObjectId(\'', '').replace('\')', '')
                else:
                    message_dict['conversation_id'] = m.conversation_id
            
            # Handle timestamp
            if hasattr(m, 'timestamp'):
                if m.timestamp and isinstance(m.timestamp, datetime):
                    message_dict['timestamp'] = m.timestamp.isoformat()
                elif m.timestamp and isinstance(m.timestamp, str):
                    message_dict['timestamp'] = m.timestamp
                else:
                    message_dict['timestamp'] = datetime.now().isoformat()
            
            # Copy other attributes
            for attr, value in m.__dict__.items():
                if attr not in ['conversation_id', 'timestamp', '__pydantic_fields_set__', '__pydantic_extra__', '__pydantic_private__']:
                    message_dict[attr] = value
            
            serialized_data.append(message_dict)
                    
        return serialized_data
    
    def deserialize_history(self, data: List[ChatMessage]) -> List[ChatMessage]:
        """Deserialize data from JSON string"""
        deserialized_data = []
        
        for m in data:
            try:
                # Handle timestamp conversion
                if hasattr(m, 'timestamp') and m.timestamp and isinstance(m.timestamp, str):
                    try:
                        m.timestamp = datetime.fromisoformat(m.timestamp)
                    except ValueError as e:
                        print(f"Error parsing timestamp: {e}")
                        m.timestamp = datetime.now()
            except Exception as e:
                print(f"Error during deserialization: {e}")
            
            deserialized_data.append(m)
            
        return deserialized_data
   
    async def load_from_db(self, session: ChatSession, db: MongoDB) -> None:
        """Load chat history from MongoDB and store it in Redis"""
        key = self.make_key(session)
        
        if not getattr(db, 'initialized', False):
            await db.initialize()
            
        history_docs = await db.get_history(session.conversation_id)
        
        chat_history = []
        for doc in history_docs:
            if (isinstance(doc, ChatMessage)):
                chat_history.append(doc)
                continue
            
            elif isinstance(doc, dict):
                chat_history.append(ChatMessage(**doc))
        
        chat_history = self.deserialize_history(chat_history)
        
        serialized_data = self.serialize_history(chat_history)
        
        if chat_history:
            await self.redis_client.setex(key, self.session_ttl, json.dumps(serialized_data))
        
        return chat_history
    
    async def flush_cache_to_DB(self, session: ChatSession, db: MongoDB) -> None:
        """Flush chat history from Redis to MongoDB"""
        key = self.make_key(session)
        
        chat_history_json = await self.redis_client.get(key)
        if not chat_history_json:
            print("no chat history found")
            return
        
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
        history = await cache.get_chat_history(mongo_db_instance, session)

        # If empty, load from MongoDB
        if not history:
            history = await cache.load_from_db(session, mongo_db_instance)

        # Add new message
        msg = ChatMessage(role="user", content="Hello!", timestamp=datetime.now())
        await cache.add_message(session, msg)
        
        print(await cache.get_chat_history(mongo_db_instance, session))

    asyncio.run(main())
