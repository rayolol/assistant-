from core.agent_prompts import Streamed_agent_response
from memory.MongoDB import MongoDB
from memory.redisCache import RedisCache
from models.models import Mem0Context

import datetime
import asyncio

async def init_db():
    db = MongoDB()
    if not db.initialized:
        await db.initialize()
    return db

async def main():
    # Initialize database and cache
    db = await init_db()
    cache = RedisCache()
    
    while True:
        user_input = input("Enter a message: ")
        if user_input.strip() in ["exit", "quit", "bye"]:
            print("Exiting...")
            break
        
        context = Mem0Context(
            user_id="1",
            session_id="1",
            conversation_id="1",
            current_agent="main_agent",
            previous_agent=None,
            tool_usage_history=[],
            response_metrics={},
            chat_history=[]
        )

        try:
            # Process stream properly
            async for chunk in Streamed_agent_response(
                db=db, 
                cache=cache, 
                context=context, 
                user_input=user_input,
            ):
                print(chunk, end='', flush=True)
            print()  # New line after response
        except Exception as e:
            print(f"Error: {str(e)}")

if __name__ == "__main__":
    asyncio.run(main())