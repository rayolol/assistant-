from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import time
from memory.DB.Mongo.MongoDB import MongoDB
import requests
from contextlib import asynccontextmanager
from memory.Cache.Redis.redisCache import RedisCache
from mem0 import Memory
from services.appContext import AppContext
import api.routes.User
import api.routes.Messages
import api.routes.Settings
import api.routes.Conversations
import api.routes.file

session = requests.Session()

session.headers.update({
    "connection": "application/json",
    "Keep-Alive": "timeout=60, max=1000"
})



@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("Starting up...")
    #TODO: add app config
    app.state.AppContext = AppContext()
    await app.state.AppContext.init()

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
    allow_origins=["*"],  # Your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

app.include_router(api.routes.User.UserRouter)
app.include_router(api.routes.Messages.MessagesRouter)
app.include_router(api.routes.Settings.SettingsRouter)
app.include_router(api.routes.Conversations.ConversationsRouter)
app.include_router(api.routes.file.FileRouter)

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

# Add this endpoint to debug what's being sent
@app.post("/debug")
async def debug_endpoint(request: Request):
    """Debug endpoint to see what's being sent"""
    body = await request.json()
    print("Received request body:", body)
    return {"received": body}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "chatendpoint:app",
        host="0.0.0.0",
        port=8001,
        workers=4,
        http="httptools",
        timeout_keep_alive=120,
        limit_concurrency=1000
  )






