from beanie import PydanticObjectId
from fastapi import FastAPI, Request, HTTPException, Depends, BackgroundTasks, Response
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import asyncio
from typing import List, AsyncGenerator
from datetime import datetime
from models.models import ChatRequest, ChatResponse, ChatSession, Mem0Context, conversations
from memory.redisCache import RedisCache
from memory.MongoDB import MongoDB
from core.agent_prompts import Streamed_agent_response as Streamed_agent_response
import traceback
import requests
from http.client import HTTPConnection
from contextlib import asynccontextmanager

# Rate limiting can be added later if needed
# from slowapi import Limiter, _rate_limit_exceeded_handler

# Use memory from core.agent_prompts

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    yield
    # Shutdown
    session.close()

app = FastAPI(
    title="Memory Chat API",
    description="API for interacting with a memory-based chat agent",
    version="1.0.0",
    lifespan=lifespan
)
# Add CORS middleware to allow frontend applications to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)


async def get_db():
    """Dependency to get the MongoDB instance"""
    db = MongoDB()
    if not db.initialized:
        await db.initialize()
    return db

async def get_cache():
    """Dependency to get the RedisCache instance"""
    return RedisCache()

async def get_or_create_guest_user(request: Request, db: MongoDB = Depends(get_db)):
    """Get or create a guest user"""

    body = await request.json()
    print(body)
    username = body.get("username")
    email = body.get("email")

        
    print(f"POST /users/get-user-id")
    if not username and not email:
        raise HTTPException(status_code=400, detail="Username or email is required")

    user = await db.search_user(username=username, email=email)
    if not user:
        # Create the guest user if it doesn't exist
        user_id = await db.create_user(username, email)
        print("Created new guest user:", user_id)
    else:
        user_id = str(user.id)
        print("Using existing guest user:", user_id)
    return user_id

async def flush_to_DB(session: ChatSession, cache: RedisCache, db: MongoDB):
    """Flush chat history from Redis to MongoDB"""
    while 1:
        await asyncio.sleep(300)
        if not session or not db:
            return
        await cache.flush_cache_to_DB(session, db)



@app.get("/")
async def root():
    """Root endpoint that returns a welcome message"""
    return {
        "message": "Memory Chat API is running",
        "status": "online",
        "endpoints": {
            "/": "This welcome message",
            "/chat": "POST endpoint for chat interactions"
        }
    }
session = requests.Session()

session.headers.update({
    "connection": "application/json",
    "Keep-Alive": "timeout=60, max=1000"
})

@app.post("/chat/streamed")
async def chat_endpoint_streamed(
    request: ChatRequest,
    background_tasks: BackgroundTasks,
    db: MongoDB = Depends(get_db),
    cache: RedisCache = Depends(get_cache)):
    """Process a chat message and return the agent's response"""
    try:
        context = Mem0Context()
        context.receive_chat_request(request)
        context.session_start_time = datetime.now() if context.session_start_time is None else context.session_start_time
        print(f"Received streaming chat request: {request.model_dump()}")

        # Process the message and return a streaming response
        async def content_generator():
            async for chunk in Streamed_agent_response(db=db, cache=cache, context=context, user_input=request.content):
                yield chunk.encode('utf-8')

        return StreamingResponse(
            content=content_generator(),
            media_type="text/event-stream"
        )

    except Exception as error:
        traceback.print_exc()
        session.close();

        raise HTTPException(status_code=500, detail=str(error))


@app.get("/chat/history/{conversation_id}/{user_id}/{session_id}")
async def send_chat_history(conversation_id: str,session_id: str, user_id: str, cache: RedisCache = Depends(get_cache), db: MongoDB = Depends(get_db)):
    """Endpoint to retrieve chat history for a given conversation"""
    if not conversation_id or not user_id:
        print("conversation_id and user_id are required")
        raise HTTPException(status_code=400, detail="conversation_id and user_id are required")
    try:
        # Handle guest user
        print(f"Getting chat history for conversation_id={conversation_id}, user_id={user_id}")

        # Create a session object
        session = ChatSession(
            conversation_id=PydanticObjectId(conversation_id),
            session_id=session_id,
            user_id=PydanticObjectId(user_id)
        )

        # Get chat history from cache or database
        history = await cache.get_chat_history(db, session)

        if not history or len(history) == 0:
            print("No history found in cache, trying database directly")
            history = await cache.load_from_db(session, db)

        if not history:
            print("No history found in database either")
            return []

        # Filter messages for this conversation
        conversation_history = []
        for msg in history:
            if hasattr(msg, 'conversation_id') and str(msg.conversation_id) == str(conversation_id):
                conversation_history.append(msg)

        print(f"Returning {len(conversation_history)} messages for conversation {conversation_id}")
        return conversation_history

    except Exception as e:
        print(f"Error in send_chat_history: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))





# Add this endpoint to debug what's being sent
@app.post("/debug")
async def debug_endpoint(request: Request):
    """Debug endpoint to see what's being sent"""
    body = await request.json()
    print("Received request body:", body)
    return {"received": body}

@app.delete("/chat/conversations/{conversation_id}")
async def delete_conversation(conversation_id: str, db: MongoDB = Depends(get_db)):
    """Endpoint to delete a conversation"""
    try:
        if not conversation_id:
            raise HTTPException(status_code=400, detail="conversation_id is required")
        await db.delete_conversation(conversation_id)
        return {"message": "Conversation deleted"}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat/conversations/{user_id}")
async def create_conversation(
    user_id: str,
    db: MongoDB = Depends(get_db)
):
    """Endpoint to create a new conversation for a user"""
    try:
        if not user_id:
            raise HTTPException(status_code=400, detail="user_id is required")

        # Now create the conversation with the valid user ID
        conversation_id = await db.create_conversation(user_id)
        return {"id": conversation_id}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/chat/conversations/{user_id}")
async def get_user_conversations(
    user_id: str,
    db: MongoDB = Depends(get_db)
):
    """Endpoint to retrieve all conversations for a user"""
    try:
        if not user_id:
            raise HTTPException(status_code=400, detail="user_id is required")
        # Get all conversations for the user
        conversations = await db.get_conversation(user_id)

        # If conversations is None or empty, return an empty list
        if not conversations:
            return []

        # If it's a single conversation object, convert to list
        if not isinstance(conversations, list):
            conversations = [conversations]

        # Format the response
        result = []
        for conv in conversations:
            # Handle both dictionary and object formats
            if isinstance(conv, dict):
                result.append({
                    "id": conv.get("id") or str(conv.get("_id", "")),
                    "name": conv.get("name", "New Conversation"),
                    "created_at": conv.get("created_at", ""),
                    "last_active": conv.get("last_active", "")
                })
            else:
                # Assuming it's an object with attributes
                result.append({
                    "id": getattr(conv, "id", None) or str(getattr(conv, "_id", "")),
                    "name": getattr(conv, "name", "New Conversation"),
                    "created_at": getattr(conv, "created_at", ""),
                    "last_active": getattr(conv, "last_active", "")
                })

        response_data = {"data": result}
        print(f"Returning conversations: {response_data}")
        return response_data

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/users/get-user-id")
async def get_user_info(
    request: Request,
    db: MongoDB = Depends(get_db)
):
    """Endpoint to retrieve user information"""
    try:
        # Parse the request body
        body = await request.json()
        print(body)
        username = body.get("username")
        email = body.get("email")

        print(f"POST /users/get-user-id - username: {username}, email: {email}")

        if not username and not email:
            raise HTTPException(status_code=400, detail="Username or email is required")

        # Handle guest user
        id = await db.search_user(username=username, email=email)

        if not id:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {"userId": str(id)}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/chat/{user_id}/{session_id}/{conversation_id}")
async def stream_chat(
    user_id: str,
    session_id: str,
    conversation_id: str,
    message: str,
    db: MongoDB = Depends(get_db),
    cache: RedisCache = Depends(get_cache)
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
                    db=db,
                    cache=cache,
                    context=context,
                    user_input=message
                ):
                    if chunk:  # Only send non-empty chunks
                        print(f"Sending chunk: {chunk}")
                        yield f"data: {chunk}\n\n"
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
