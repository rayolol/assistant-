from memory.Cache.Redis.redisCache import RedisCache
from memory.DB.Mongo.MongoDB import MongoDB
from fastapi import Depends
import asyncio
from mem0 import Memory
from settings.settings import MEMORY_Config
from models.models import ChatSession

async def get_db():
    """Dependency to get the MongoDB instance"""
    db = MongoDB()
    if not getattr(db, 'initialized', False):
                await db.initialize()
    return db

async def get_cache():
    """Dependency to get the RedisCache instance"""
    return RedisCache()


async def flush_to_DB(session: ChatSession, cache: RedisCache, db: MongoDB):
    """Flush chat history from Redis to MongoDB"""
    while 1:
        await asyncio.sleep(300)
        if not session or not db:
            return
        await cache.flush_cache_to_DB(session, db)


async def get_AI_Memory(): 
    return Memory.from_config(MEMORY_Config)





