from memory.Cache.Redis.redisCache import RedisCache
from memory.DB.Mongo.MongoDB import MongoDB
from fastapi import Depends, Request
import asyncio
import time
from mem0 import Memory
from settings.settings import MEMORY_Config
from models.models import ChatSession

async def get_db(request: Request):
    return request.app.state.db
   
async def get_cache(request: Request):
    return request.app.state.cache
   

async def flush_to_DB(session: ChatSession, cache: RedisCache, db: MongoDB):
    """Flush chat history from Redis to MongoDB"""
    while 1:
        await asyncio.sleep(300)
        if not session or not db:
            return
        await cache.flush_cache_to_DB(session, db)


async def get_AI_Memory(request: Request): 
    return request.app.state.memory





