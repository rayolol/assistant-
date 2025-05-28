from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient
from models.models import users, ChatMessage, conversations

async def init_beanie():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    await init_beanie(
        database=client.your_db_name,
        document_models=[users, ChatMessage, conversations],
    )
