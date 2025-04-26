from beanie import PydanticObjectId
from fastapi import FastAPI, Request, HTTPException, Depends, BackgroundTasks, Response
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import asyncio
from typing import List
from datetime import datetime
from core.agent import Agents as At
from models import ChatRequest, ChatResponse, ChatSession, Mem0Context, conversations
from memory.redisCache import RedisCache
from memory.MongoDB import MongoDB
from core.agent_prompts import agent_response, Streamed_agent_response
import traceback

# Rate limiting can be added later if needed
# from slowapi import Limiter, _rate_limit_exceeded_handler

# Use memory from core.agent_prompts

app = FastAPI(
    title="Memory Chat API",
    description="API for interacting with a memory-based chat agent",
    version="1.0.0"
)
# Add CORS middleware to allow frontend applications to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
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

async def get_or_create_guest_user(db: MongoDB, user_id: str = None):
    """Get or create a guest user"""
    if not user_id or user_id == "guest":
        user = await db.search_user("Guest", "Guest@example.com")
        if not user:
            # Create the guest user if it doesn't exist
            user_id = await db.create_user("Guest", "Guest@example.com")
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
        context.session_start_time = datetime.now()
        context.current_agent = "main_agent"  # Set a default agent

        print(f"Received streaming chat request: {request.model_dump()}")

        # Process the message and return a streaming response
        return StreamingResponse(
            Streamed_agent_response(db=db, cache=cache, context=context, user_input=request.content),
            media_type="text/event-stream"
        )

    except Exception as error:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(error))

@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(
    request: ChatRequest,
    background_tasks: BackgroundTasks,
    db: MongoDB = Depends(get_db),
    cache: RedisCache = Depends(get_cache)
) -> ChatResponse:
    """Process a chat message and return the agent's response"""
    try:
        # Add debug logging
        print(f"Received chat request: {request.model_dump()}")

        # Handle guest user or missing user_id
        if not request.user_id:
            request.user_id = await get_or_create_guest_user(db, request.user_id)

        # Fix indentation and convert IDs to strings
        user_id = str(request.user_id)
        conversation_id = str(request.conversation_id) if request.conversation_id else None

        # Create a new conversation if needed
        if not conversation_id:
            new_conversation = conversations(user_id=user_id, name="New Conversation")
            await new_conversation.insert()
            conversation_id = str(new_conversation.id)
            print(f"Created new conversation: {conversation_id}")

        # Create context object
        context = Mem0Context()
        context.receive_chat_request(request)
        context.session_start_time = datetime.now()
        context.current_agent = "main_agent"  # Set a default agent

        # Process the message
        response_text = await agent_response(db=db, cache=cache, context=context, user_input=request.content)

        # Create a proper ChatSession object
        chat_session = ChatSession(
            user_id=user_id,
            session_id=request.session_id,
            conversation_id=conversation_id
        )

        # Create a proper ChatResponse
        response = ChatResponse(
            ChatSession=chat_session,
            status="success",
            current_agent=context.current_agent or "default_agent",
            response=response_text,  # Use the actual response text
            timestamp=datetime.now().isoformat(),
            chat_history=context.chat_history
        )

        return response

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))



@app.get("/chat/{conversation_id}/{user_id}/{session_id}")
async def send_chat_history(conversation_id: str,session_id: str, user_id: str, cache: RedisCache = Depends(get_cache), db: MongoDB = Depends(get_db)):
    """Endpoint to retrieve chat history for a given conversation"""
    if not conversation_id or not user_id:
        print("conversation_id and user_id are required")
        raise HTTPException(status_code=400, detail="conversation_id and user_id are required")
    try:
        # Handle guest user
        user_id = await get_or_create_guest_user(db, user_id)
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
            # Create user if not found
            print(f"User not found, creating new user with username: {username}, email: {email}")
            id = await db.create_user(username=username, email=email)
            print(f"Returning user ID: {id}")
            return {"userId": str(id)}

        return {"userId": str(id)}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
