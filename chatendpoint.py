from fastapi import FastAPI, Request, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
import asyncio
from main import *
import traceback
from pydantic import BaseModel
from datetime import datetime
from agents import Runner, RunConfig
from agent import Agents as At
from agents import RunContextWrapper
import default_tools as DT
from default_tools import ChatMessage, ToolUsageRecord
from typing import List, Dict, Any
from redisCache import RedisCache, ChatSession
from MongoDB import MongoDB

from slowapi import Limiter, _rate_limit_exceeded_handler

class ChatRequest(BaseModel):
    user_id: str
    session_id: str
    conversation_id: str
    message: str
    ui_metadata: Dict[str, Any] = {}
    flags: Dict[str, Any] = {}
        
class ChatResponse(BaseModel):
    status: str = "success"
    current_agent: str
    response: str
    timestamp: str = None
    response_metadata: Dict[str, Any] = {}
    tool_calls: List[ToolUsageRecord] = []
    chat_history: List[ChatMessage] = []

    
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
db = MongoDB()
cache = RedisCache()

async def get_db():
    try: 
        if not db.initialized:
            await db.initialize()
        return db
    except Exception as e:
        print(f"Error in get_db: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
async def get_cache():
    return cache

async def flush_cache_to_db(session: ChatSession, db: MongoDB) -> None:
    """Flush chat history from Redis to MongoDB"""
    while(True):
        await asyncio.sleep(300)
        await cache.flush_cache_to_DB(session, db)
        print("flushed")
        

async def agent_response(context: DT.Mem0Context, user_input: str) -> Dict[str, Any]:
    """Process user input through the agent system and return a comprehensive response object"""
    agents = At()
    
    response_obj = {
        "response_text": "",
        "current_agent": context.current_agent,
        "previous_agent": context.previous_agent,
        "timestamp": datetime.now().isoformat(),
        "tool_calls": [],
        "chat_history": [],
        "status": "success"
    }

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
            
            # Update response object
            response_obj["response_text"] = response_text
            response_obj["current_agent"] = context.current_agent
            response_obj["previous_agent"] = context.previous_agent
            response_obj["tool_calls"] = context.tool_usage_history
            response_obj["chat_history"] = context.chat_history.copy()

            return response_obj

        except Exception as e:
            print(f"Error during agent run: {e}")
            traceback.print_exc()
            response_text = "Sorry, I encountered an error processing your request."
            print("AI:", response_text)

            # Add to conversation history
            context.add_to_history(user_message = user_input, assistant_response = response_text)
            
            # Update response object with error info
            response_obj["response_text"] = response_text
            response_obj["status"] = "error"
            response_obj["error_details"] = str(e)
            response_obj["chat_history"] = context.chat_history.copy()

            return response_obj

    except Exception as e:
        error_msg = f"Unexpected error: {e}"
        print(error_msg)
        traceback.print_exc()
        
        # Update response object with error info
        response_obj["response_text"] = error_msg
        response_obj["status"] = "error"
        response_obj["error_details"] = str(e)
        
        return response_obj

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
        
        session = ChatSession(
            user_id=request.user_id,
            session_id=request.session_id,
            conversation_id=request.conversation_id
        )
        
        # Get the chat history from the cache or initialize it if it doesn't exist
        chat_history = await cache.get_chat_history(session) 
        if not chat_history:
            chat_history = await cache.load_from_db(session, db)
            
        print("retrieved: ", chat_history)
        # Always use memory_agent as the default starting agent
        formatted_context = DT.Mem0Context(
            user_id=request.user_id,
            session_id=request.session_id,
            conversation_id=request.conversation_id,
            current_agent="memory_agent",
            chat_history=chat_history if chat_history else []
        )
        
        # Process the message through the agent
        response_obj = await agent_response(context=formatted_context, user_input=request.message)
        
        # Save the updated chat history to the cache
        user_message = ChatMessage(
            role="user",
            content=request.message,
            timestamp=datetime.now()
        )
        
        ai_message = ChatMessage(
            role="assistant",
            content=response_obj["response_text"],
            timestamp=datetime.now()
        )
        await cache.add_message(session, user_message)
        await cache.add_message(session, ai_message)
        print("added: ", response_obj["chat_history"][-1])
        
        background_tasks.add_task(flush_cache_to_db, session, db)
        
        # Create a fresh response object
        chat_response = ChatResponse(
            status=response_obj["status"],
            current_agent=response_obj["current_agent"],
            response=response_obj["response_text"],
            timestamp=datetime.now().isoformat(),
            tool_calls=response_obj["tool_calls"],
            chat_history=response_obj["chat_history"]
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
            chat_history=[]
        )
        
@app.get("/conversations/{user_id}")
async def get_conversations(user_id: str, db: MongoDB = Depends(get_db)):
    """Get all conversations for a user"""
    try:
        conversations = await db.get_conversation(user_id)
        return conversations
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

app.delete("/conversations/{conversation_id}")
async def delete_conversation(conversation_id: str, db: MongoDB = Depends(get_db)):
    """Delete a conversation"""
    try:
        await db.delete(conversation_id)
        return {"message": "Conversation deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    

@app.post("/debug")
async def debug_endpoint(request: Request):
    """Debug endpoint to see what's being sent"""
    body = await request.json()
    print("Received request body:", body)
    return {"received": body}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
