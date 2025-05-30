from motor.motor_asyncio import AsyncIOMotorClient as MongoClient
from ._user import UserOps
from ._conversation import ConversationOps
from ._message import MessageOps
from ._Miscellaneous import PromptSettingsOps
from .init_beanie import init_db



class MongoDB:
    def __init__(self,db_name='user_db'):
        self.user = UserOps()
        self.conversation = ConversationOps()
        self.message = MessageOps()
        self.prompt_settings = PromptSettingsOps()

    async def initialize(self):
        await init_db()
