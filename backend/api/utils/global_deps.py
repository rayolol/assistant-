from memory.Cache.Redis.redisCache import RedisCache
from memory.DB.Mongo.MongoDB import MongoDB
from fastapi import Depends
import asyncio
import time
from mem0 import Memory
from settings.settings import MEMORY_Config
from models.models import ChatSession


DB_instance : MongoDB | None = None
Cache_instance : RedisCache | None = None
Memory_instance : Memory | None = None
