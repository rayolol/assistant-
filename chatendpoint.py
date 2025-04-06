from main import *
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import traceback
from typing import Dict, Any
from pydantic import BaseModel

from slowapi import Limiter, _rate_limit_exceeded_handler

class ChatRequest(BaseModel):
    message: str
    class Config:
        extra = "ignore"
        
class ChatResponse(BaseModel):
    status: str = "success"
    response: str
    timestamp: str = None
    class Config:
        extra = "ignore"
    
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

async def agent_response(user_input: str) -> str:
    """Process user input through the agent system and return a response"""

    global conversation_history
    conversation_history = []
    agents = At()

    try:
        # Get system prompt with relevant memories
        try:
            full_prompt = build_system_prompt(user_input, user_id="user")
            print("System prompt:", full_prompt)
        except Exception as e:
            print(f"Error building system prompt: {e}")
            full_prompt = user_input

        # Create context object with user_id
        context = DT.Mem0Context(user_id="user")

        # Run the agent with proper context
        try:
            # Create a run config to ensure consistent settings across handoffs
            run_config = RunConfig(
                workflow_name="Memory Assistant Workflow",
                trace_metadata={"user_id": "user"}
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
            entry = {
                "timestamp": datetime.now(),
                "user": user_input,
                "assistant": response_text
            }
            add_to_history(entry)

            return response_text

        except Exception as e:
            print(f"Error during agent run: {e}")
            traceback.print_exc()
            response_text = "Sorry, I encountered an error processing your request."
            print("AI:", response_text)

            # Add to conversation history
            entry = {
                "timestamp": datetime.now(),
                "user": user_input,
                "assistant": response_text
            }
            add_to_history(entry)

            return response_text

    except Exception as e:
        error_msg = f"Unexpected error: {e}"
        print(error_msg)
        traceback.print_exc()
        return error_msg

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

@app.post("/chat")
async def chat_endpoint(request: ChatRequest) -> Dict[str, Any]:
    """Process a chat message and return the agent's response"""
    try:

        user_input = request.message

        # Process the message through the agent
        response_text = await agent_response(user_input)

        return {
            "response": response_text,
        }

    except Exception as e:
        error_message = str(e)
        print(f"Error in chat endpoint: {error_message}")
        traceback.print_exc()

        return {
            "status": "error",
            "error": error_message,
            "timestamp": datetime.now().isoformat()
        }

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
