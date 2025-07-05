import fastapi
from fastapi import Depends, HTTPException, Query, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse
import requests

from typing import Optional
from models.models import ChatRequest
from models.schemas import ChatMessageDTO
from api.utils.Dependencies import get_app_context
from memory.Cache.DiskCache.diskCache import DiskCache
from memory.DB.schemas import ChatMessage
from memory.Cache.Redis.redisCache import RedisCache
import traceback
from services.appContext import AppContext
from mem0 import Memory
from beanie import PydanticObjectId
from datetime import datetime
from core.agent_prompts import Streamed_agent_response
from models.models import Mem0Context, ChatSession
import json
import asyncio




MessagesRouter = fastapi.APIRouter()

class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, connection_id: str):
        await websocket.accept()
        self.active_connections[connection_id] = websocket

    async def disconnect(self, websocket: WebSocket, connection_id: str):
        if connection_id in self.active_connections:
            del self.active_connections[connection_id]

    

manager = ConnectionManager()   


#FIXME: pydantic object mess

session = requests.Session()

session.headers.update({
    "connection": "application/json",
    "Keep-Alive": "timeout=60, max=1000"
})

@MessagesRouter.websocket("/ws/chat/{user_id}/{session_id}")
async def websocket_chat(
        websocket: WebSocket,
        user_id: str,
        session_id: str
):
    connection_id = f"{user_id}-{session_id}"

    try:
        await manager.connect(websocket, connection_id)

        appcontext: AppContext = websocket.app.state.AppContext
        print(f"WebSocket connected for user {user_id}, session {session_id}")
        
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)

            message = message_data.get("message")
            fileId = message_data.get("fileId")
            conversation_id = message_data.get("conversationId")

            print("loaded message data: ", message_data)
            print("conversation_id", conversation_id)


            if not conversation_id:
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "message": "conversationId is required"
                }))
                continue



            if not message:
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "message": "message is required"
                }))
                continue

            context = Mem0Context(
                user_id=user_id,
                session_id=session_id,
                conversation_id=conversation_id,
                file_id=fileId if fileId else None,
            )
            context._websocket = websocket
            context._appContext = appcontext

            try: 
                await websocket.send_text(json.dumps({
                    "type": "start",
                    "conversationId": conversation_id,
                    "message": "Starting response generation..."
                }))
                
                # Stream the response
                async for chunk in Streamed_agent_response(
                    app_context=appcontext,
                    context=context,
                    user_input=message,
                ):
                    print(f"Sending chunk: {repr(chunk)}")
                    if chunk:
                        await websocket.send_text(json.dumps({
                                "type": "chunk",
                                "conversationId": conversation_id,
                                "data": {"chunk": chunk}
                        }))
                        
                    await asyncio.sleep(0.05)
                        
                await websocket.send_text(json.dumps({
                    "type": "complete",
                    "conversationId": conversation_id,
                    "message": "Response complete"
                }))
                
            except Exception as e:
                print(f"Error in WebSocket chat: {str(e)}")
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "conversationId": conversation_id,
                    "message": f"Error: {str(e)}"
                }))
    except WebSocketDisconnect:
        print(f"WebSocket disconnected for {connection_id}")
        await manager.disconnect(websocket, connection_id)
    except Exception as e:
        print(f"Error in WebSocket endpoint: {str(e)}")
        await manager.disconnect(websocket, connection_id)
        try:
            await websocket.send_text(json.dumps({
                "type": "error",
                "message": f"Connection error: {str(e)}"
            }))
        except:
            pass
    finally:
        await manager.disconnect(websocket, connection_id)
                


#@MessagesRouter.get("/chat/{user_id}/{session_id}/{conversation_id}")
async def stream_chat(
    user_id: str,
    session_id: str,
    conversation_id: str,
    message: str,
    fileId: Optional[str] = Query(None),
    appcontext: AppContext = Depends(get_app_context)
    
) -> StreamingResponse:
    try:
        print(f"Starting SSE stream for user {user_id}, session {session_id}, conversation {conversation_id}")
        print("file_id", fileId)
        context = Mem0Context(
            user_id=user_id,
            session_id=session_id,
            conversation_id=conversation_id if conversation_id else None,
            file_id=fileId if fileId else None            
        )
        
        async def event_generator():
            try:
                async for chunk in Streamed_agent_response(
                    app_context=appcontext,
                    context=context,
                    user_input=message,
                ):
                    if chunk:  # Only send non-empty chunks
                        yield chunk
                        await asyncio.sleep(0.05)
                        
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
async def send_chat_history(conversation_id: str,session_id: str, user_id: str, appcontext:AppContext = Depends(get_app_context)):
    """Endpoint to retrieve chat history for a given conversation"""
    if not conversation_id or not user_id:
        print("conversation_id and user_id are required")
        raise HTTPException(status_code=400, detail="conversation_id and user_id are required")
    try:
        # Handle guest user
        print(f"Getting chat history for conversation_id={conversation_id}, user_id={user_id}")
        # Get chat history from cache or database
        history = await appcontext.chatService.load_chat_history(conversation_id, user_id)

        if not history or len(history) == 0:
            print("No history found in cache, trying database directly")
            return []

        # Filter messages for this conversation
        conversation_history = []
        for msg in history:
            if str(msg.conversation_id) == str(conversation_id) and str(msg.user_id) == str(user_id):
                conversation_history.append(ChatMessageDTO(
                    id=str(msg.id),
                    user_id=str(msg.user_id),
                    conversation_id=str(msg.conversation_id),
                    session_id=msg.session_id,
                    timestamp=msg.timestamp,
                    role=msg.role,
                    content=msg.content,
                    file_id=msg.file_id
                ))

        print(f"Returning {len(conversation_history)} messages for conversation {conversation_id}")
        print("file_id: ", [c.file_id for c in conversation_history])
        return conversation_history

    except Exception as e:
        print(f"Error in send_chat_history: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    

# @MessagesRouter.put("/chat/message/{messsage_id}")
# async def update_message(request: ChatMessageDTO, message_id: str, appcontext: AppContext):
#     if not message_id:
#         raise HTTPException(status_code=400, detail="message_id is required")
    
#     msg = ChatMessage(
#         id = request.id,
#         conversation_id= request.conversation_id,
#         user_id=request.user_id,
#         session_id= request.session_id,
#         timestamp=request.timestamp,
#         content = request.content,
#         role= request.role,
#         file_id = request.file_id,
#         metadata=request.metadata,
#     )
    



#TODO: add delete message
