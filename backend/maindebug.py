from core.agent_prompts import Streamed_agent_response
from memory.MongoDB import MongoDB
from memory.redisCache import RedisCache
from models.models import Mem0Context

import datetime
import asyncio


db = MongoDB()
if not db.initialized:
    asyncio.run(db.initialize())
cache = RedisCache()



async def main():
    while True:
        user_input = input("Enter a message: ")
        if user_input.strip() in ["exit", "quit", "bye"]:
            print("Exiting...")
            break
        
        Context = Mem0Context(
            user_id="1",
            session_id="1",
            conversation_id="1",
            current_agent="Main_agent",
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
                context=Context, 
                user_input=user_input,
            ):
                print(chunk, end='', flush=True)
            print()  # New line after response
        except Exception as e:
            print(f"Error: {str(e)}")

if __name__ == "__main__":
    asyncio.run(main())