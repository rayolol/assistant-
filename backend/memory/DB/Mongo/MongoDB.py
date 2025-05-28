from motor.motor_asyncio import AsyncIOMotorClient as MongoClient
from ._user import UserOps
from ._conversation import ConversationOps
from ._message import MessageOps
from .init_beanie import init_beanie


class MongoDB:
    def __init__(self,db_name='user_db'):
        self.user = UserOps()
        self.conversation = ConversationOps()
        self.message = MessageOps()
    
    async def init(self):
        await init_beanie()
