from .chatService import chatService
from .uploadFileService import uploadService
from .userSerivce import userService
from .conversationService import conversationService

from memory.Cache.DiskCache.diskCache import DiskCache
from memory.Cache.Redis.redisCache import RedisCache
from memory.DB.Mongo.MongoDB import MongoDB
from agentic.handoffs.agent import Agents



from settings.settings import MEMORY_Config

from mem0 import Memory


class AppContext:
    #TODO: add app config later
    def __init__ (self, app_config = None):
        self.db =  MongoDB()
        self.cache =  RedisCache()
        self.dc = DiskCache()
        self.memory = Memory.from_config(MEMORY_Config)

        self.chatService = chatService(self.db, self.cache)
        self.uploadService = uploadService(self.db, self.cache, self.dc)
        self.userService = userService(self.db, self.cache)
        self.agents = Agents(self.memory)
        self.conversationService = conversationService(self.db, self.cache)


    async def init(self):
        await self.db.initialize()


