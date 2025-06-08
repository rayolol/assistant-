from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient
from memory.DB.schemas import Users, ChatMessage, Conversations, PromptSettings

async def init_db():
    client = AsyncIOMotorClient(
        "mongodb://localhost:27017",
        maxPoolSize=100,
        minPoolSize=10,
        maxIdleTimeMS=30000,
        socketTimeoutMS=30000,
        connectTimeoutMS=5000,
        serverSelectionTimeoutMS=5000,
        waitQueueTimeoutMS=1000
        )
    await init_beanie(
        database=client.user_db,
        document_models=[Users, ChatMessage, Conversations, PromptSettings],
    )
