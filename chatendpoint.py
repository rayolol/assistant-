from fastapi import FastAPI, Request, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import traceback
from datetime import datetime
from core.agent import Agents as At
from models import ChatRequest, ChatResponse, ChatSession, Mem0Context
from memory.redisCache import RedisCache
from memory.MongoDB import MongoDB
from core.agent_prompts import agent_response
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

@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(
    request: ChatRequest,
    background_tasks: BackgroundTasks,
    db: MongoDB = Depends(get_db),
    cache: RedisCache = Depends(get_cache)
) -> ChatResponse:
    """Process a chat message and return the agent's response"""
    try:
        if not request.user_id:
            request.user_id = await db.create_user("Guest", "guest@example.com")
            if not request.conversation_id:
                request.conversation_id = await db.create_conversation(request.user_id)

        # Convert ObjectId to string if needed
        user_id = str(request.user_id)
        conversation_id = str(request.conversation_id)
        

        context = Mem0Context(
            user_id=user_id,
            session_id=request.session_id,
            conversation_id=conversation_id,
            current_agent="memory_agent"

        )

        background_tasks.add_task(flush_to_DB, context.to_chat_session(), cache, db)
        # Process the message through the agent
        response = await agent_response(db = db, cache = cache, context=context, user_input=request.message)

        # Create a fresh response object
        chat_response = ChatResponse(
            status="success",
            current_agent="memory_agent",
            response=response,  # Use the raw message as the response text
            response_metadata={},
            tool_calls=context.tool_usage_history,
            chat_history=context.chat_history,
            ChatSession=ChatSession(
                user_id=user_id,
                session_id=request.session_id,
                conversation_id=conversation_id
            )
        )


        return chat_response

    except Exception as e:
        error_message = str(e)
        print(f"Error in chat endpoint: {error_message}")
        traceback.print_exc()

        return ChatResponse(
            status="error",
            current_agent="memory_agent",
            response=f"Error: {error_message}",
            timestamp=datetime.now().isoformat(),
            response_metadata={"error_details": error_message},
            chat_history=[],
            ChatSession=ChatSession(
                user_id=request.user_id,
                session_id=request.session_id,
                conversation_id=request.conversation_id
            )
        )


@app.get("/chat/{conversation_id}/{user_id}")
async def send_chat_history(conversation_id: str, user_id: str, cache: RedisCache = Depends(get_cache), db: MongoDB = Depends(get_db)):
    """Endpoint to retrieve chat history for a given conversation"""
    if not conversation_id or not user_id:
        print("conversation_id and user_id are required")
        raise HTTPException(status_code=400, detail="conversation_id and user_id are required")
    try:
        history = await cache.get_chat_history(db, ChatSession(conversation_id=conversation_id,session_id="1234567890", user_id=user_id))
        if history is None:
            history = await cache.load_from_db(ChatSession(conversation_id=conversation_id,session_id="1234567890", user_id=user_id), db)
            if history is None:
                return []
        return history
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))



# Add this endpoint to debug what's being sent
@app.post("/debug")
async def debug_endpoint(request: Request):
    """Debug endpoint to see what's being sent"""
    body = await request.json()
    print("Received request body:", body)
    return {"received": body}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
