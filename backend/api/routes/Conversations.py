import fastapi
from fastapi import Depends, HTTPException
from memory.MongoDB import MongoDB
from memory.redisCache import RedisCache
import traceback
from api.utils.Dependencies import get_db, get_cache

ConversationsRouter = fastapi.APIRouter()


@ConversationsRouter.get("/chat/conversations/{user_id}")
async def get_user_conversations(
    user_id: str,
    db: MongoDB = Depends(get_db),
    cache: RedisCache = Depends(get_cache)
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

#TODO add pending conversation request
@ConversationsRouter.post("/chat/conversations/{user_id}")
async def create_conversation(
    user_id: str,
    db: MongoDB = Depends(get_db),
    cache: RedisCache = Depends(get_cache)
):
    """Endpoint to create a new conversation for a user"""
    try:
        if not user_id:
            raise HTTPException(status_code=400, detail="user_id is required")

        # Now create the conversation with the valid user ID
        #TODO return whole conversation object
        conversation_id = await db.create_conversation(user_id)
        return {"id": conversation_id}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@ConversationsRouter.delete("/chat/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    db: MongoDB = Depends(get_db),
    cache: RedisCache = Depends(get_cache)
    ):
    """Endpoint to delete a conversation"""
    try:
        if not conversation_id:
            raise HTTPException(status_code=400, detail="conversation_id is required")
        await db.delete_conversation(conversation_id)
        return {"message": "Conversation deleted"}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    

#TODO Update conversation name

#TODO Get conversation by id

#TODO Get conversation by user id

