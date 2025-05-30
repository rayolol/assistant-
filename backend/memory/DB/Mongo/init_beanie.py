from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient
from memory.DB.schemas import Users, ChatMessage, Conversations

async def init_db():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    await init_beanie(
        database=client.user_db,
        document_models=[Users, ChatMessage, Conversations],
    )
