import redis.asyncio as r
import json
from memory.DB.schemas import ChatMessage
from typing import List, Optional
from ._file import FileOps
from ._messages import MessageOps
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
        self.files = FileOps(self.redis_client, self.session_ttl)
        self.messages = MessageOps(self.redis_client, self.session_ttl)

   