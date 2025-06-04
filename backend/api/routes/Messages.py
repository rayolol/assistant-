import fastapi
from fastapi import Depends, HTTPException
from fastapi.responses import StreamingResponse
import requests
from models.models import ChatRequest
from api.utils.Dependencies import get_db, get_cache, get_AI_Memory
from memory.DB.Mongo.MongoDB import MongoDB
from memory.Cache.Redis.redisCache import RedisCache
import traceback
from mem0 import Memory
from beanie import PydanticObjectId
from datetime import datetime
from core.agent_prompts import Streamed_agent_response
from models.models import Mem0Context, ChatSession
import asyncio




MessagesRouter = fastapi.APIRouter()


#FIXME: pydantic object mess

session = requests.Session()

session.headers.update({
    "connection": "application/json",
    "Keep-Alive": "timeout=60, max=1000"
})


@MessagesRouter.get("/chat/{user_id}/{session_id}/{conversation_id}")
async def stream_chat(
    user_id: str,
    session_id: str,
    conversation_id: str,
    message: str,
    db: MongoDB = Depends(get_db),
    cache: RedisCache = Depends(get_cache),
    memory: Memory = Depends(get_AI_Memory)
) -> StreamingResponse:
    try:
        print(f"Starting SSE stream for user {user_id}, session {session_id}, conversation {conversation_id}")
        context = Mem0Context(
            user_id=user_id,
            session_id=session_id,
            conversation_id=conversation_id if conversation_id else None,           
        )
        
        async def event_generator():
            try:
                async for chunk in Streamed_agent_response(
                    memory=memory,
                    db=db,
                    cache=cache,
                    context=context,
                    user_input=message
                ):
                    if chunk:  # Only send non-empty chunks
                        print(f"Sending chunk: {chunk}")
                        yield chunk
                        await asyncio.sleep(0.08)
                        
            except Exception as e:
                print(f"Error in event generator: {str(e)}")
                yield f"data: Error: {str(e)}\n\n"
                raise

        return StreamingResponse(
            event_generator(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
                "Content-Type": "text/event-stream"
            }
        )
    except Exception as e:
        print(f"Error in chat endpoint: {str(e)}")
        session.close()
        raise HTTPException(status_code=500, detail=str(e))

    

@MessagesRouter.get("/chat/history/{conversation_id}/{user_id}/{session_id}")
async def send_chat_history(conversation_id: str,session_id: str, user_id: str, cache: RedisCache = Depends(get_cache), db: MongoDB = Depends(get_db)):
    """Endpoint to retrieve chat history for a given conversation"""
    if not conversation_id or not user_id:
        print("conversation_id and user_id are required")
        raise HTTPException(status_code=400, detail="conversation_id and user_id are required")
    try:
        # Handle guest user
        print(f"Getting chat history for conversation_id={conversation_id}, user_id={user_id}")
        # Get chat history from cache or database
        history = await cache.get_chat_history(db, conversation_id, user_id)

        if not history or len(history) == 0:
            print("No history found in cache, trying database directly")

        if not history:
            print("No history found in database either")
            return []

        # Filter messages for this conversation
        conversation_history = []
        for msg in history:
            if str(msg.conversation_id) == str(conversation_id) and str(msg.user_id) == str(user_id):
                conversation_history.append(msg)

        print(f"Returning {len(conversation_history)} messages for conversation {conversation_id}")
        return conversation_history

    except Exception as e:
        print(f"Error in send_chat_history: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    

#TODO: add update message
#TODO: add delete message
