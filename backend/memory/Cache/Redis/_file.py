import redis.asyncio as r
from models.schemas import FileDoc

class FileOps: 
    def __init__(self, redis_client: r.Redis, session_ttl: int):
        self.redis_client = redis_client
        self.session_ttl = session_ttl


    async def cache_file_metadata(self, file_id: str, metadata: FileDoc, ttl:int = 3600):
        await self.redis_client.setex( f"filemeta: {file_id}", ttl, metadata.model_dump_json())


    async def get_file_metadata(self, file_id: str):
        raw = await self.redis_client.get(f"filemeta: {file_id}")
        if raw: 
            return FileDoc.model_validate_json(raw)
        else: 
            return None