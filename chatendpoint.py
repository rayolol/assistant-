from fastapi import FastAPI, Request, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
import asyncio
from main import *
import traceback
from datetime import datetime
from agents import Runner, RunConfig
from agent import Agents as At
from models import ChatRequest, ChatResponse, ChatSession, Mem0Context
from redisCache import RedisCache
from MongoDB import MongoDB
from bson.objectid import ObjectId

from slowapi import Limiter, _rate_limit_exceeded_handler


    
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

async def agent_response(context: Mem0Context, user_input: str) -> Mem0Context:
    """Process user input through the agent system and return a comprehensive response object"""
    agents = At()

    try:
        # Get system prompt with relevant memories
        try:
            full_prompt = build_system_prompt(context=context, user_message=user_input)
            print("System prompt:", full_prompt)
        except Exception as e:
            print(f"Error building system prompt: {e}")
            full_prompt = user_input

        # Run the agent with proper context
        try:
            # Create a run config to ensure consistent settings across handoffs
            run_config = RunConfig(
                workflow_name="Memory Assistant Workflow",
                trace_metadata={"user_id": context.user_id}
            )

            # Run the memory agent with the context
            result = await Runner.run(
                starting_agent=agents.memory_agent(),
                input=user_input,
                context=context,
                run_config=run_config
            )

            response_text = result.final_output if hasattr(result, 'final_output') else "No response generated."
            print("AI:", response_text)

            # Add to conversation history
            context.add_to_history(user_message = user_input, assistant_response = response_text)
            
            response = Mem0Context(
                user_id=context.user_id,
                session_id=context.session_id,
                conversation_id=context.conversation_id,
                current_agent=context.current_agent,
                chat_history=context.chat_history.copy()
            )
            
            return response

        except Exception as e:
            print(f"Error during agent run: {e}")
            traceback.print_exc()
            response_text = "Sorry, I encountered an error processing your request."
            print("AI:", response_text)

            # Add to conversation history
            context.add_to_history(user_message = user_input, assistant_response = response_text)
            
            # Update response object with error info
            response = Mem0Context(
                user_id=context.user_id,
                session_id=context.session_id,
                conversation_id=context.conversation_id,
                current_agent=context.current_agent,
                chat_history=context.chat_history.copy()
            )
            return response

    except Exception as e:
        error_msg = f"Unexpected error: {e}"
        print(error_msg)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=error_msg)
    
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
        
        session = ChatSession(
            user_id=user_id,
            session_id=request.session_id,
            conversation_id=conversation_id
        )
        
        background_tasks.add_task(flush_to_DB, session, cache, db)
        
        # Get the chat history from the cache or initialize it if it doesn't exist
        chat_history = await cache.get_chat_history(db, session) 
        if not chat_history:
            chat_history = await cache.load_from_db(session, db)
            
        print("retrieved: ", chat_history)
        # Always use memory_agent as the default starting agent
        formatted_context = Mem0Context().receive_chat_request(request)
        
        # Process the message through the agent
        response_obj = await agent_response(context=formatted_context, user_input=request.message)
        
        # Save the updated chat history to the cache
        message = response_obj.chat_history[-1]
        
        await cache.add_message(db, session, message)
        await cache.add_message(db, session, response_obj.chat_history[-1])
        print("added: ", response_obj.chat_history)
        
        # Create a fresh response object
        chat_response = ChatResponse(
            status="success",
            current_agent="memory_agent",
            response=message.content,
            timestamp=datetime.now().isoformat(),
            response_metadata={},
            tool_calls=response_obj.tool_usage_history,
            chat_history=response_obj.chat_history,
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
        raise HTTPException(status_code=400, detail="conversation_id and user_id are required")
    try:
        history = await cache.get_chat_history(db, ChatSession(conversation_id=conversation_id,session_id="1234567890", user_id=user_id))
        return history
    except Exception as e:
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
