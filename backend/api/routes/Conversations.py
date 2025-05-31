import fastapi
from models.schemas import ConversationDTO
from fastapi import Depends, HTTPException
from memory.DB.Mongo.MongoDB import MongoDB
from memory.Cache.Redis.redisCache import RedisCache
import traceback
from api.utils.Dependencies import get_db, get_cache

ConversationsRouter = fastapi.APIRouter()


@ConversationsRouter.get("/chat/conversations/{user_id}", response_model=list[ConversationDTO])
async def get_user_conversations(
    user_id: str,
    db: MongoDB = Depends(get_db),
    cache: RedisCache = Depends(get_cache)
)-> list[ConversationDTO]:
    """Endpoint to retrieve all conversations for a user"""
    try:
        if not user_id:
            raise HTTPException(status_code=400, detail="user_id is required")
        # Get all conversations for the user
        conversations = await db.conversation.get_by_user_id(user_id)

        # If conversations is None or empty, return an empty list
        if not conversations:
            return []

        # If it's a single conversation object, convert to list
        if not isinstance(conversations, list):
            conversations = [conversations]

        print(f"Returning conversations: {conversations}")
        return [ConversationDTO(
            id=str(c.id),
            user_id=c.user_id,
            session_id=c.session_id,
            name=c.name,
            started_at=c.started_at,
            last_active=c.last_active,
            is_archived=c.is_archived,
            flags=c.flags
        ) for c in conversations]

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

#TODO add pending conversation request
@ConversationsRouter.post("/chat/create-conversations/{user_id}", response_model=ConversationDTO)
async def create_conversation(
    request: ConversationDTO,
    user_id: str,
    db: MongoDB = Depends(get_db),
    cache: RedisCache = Depends(get_cache)
)-> ConversationDTO:
    """Endpoint to create a new conversation for a user"""
    try:
        if not user_id:
            raise HTTPException(status_code=400, detail="user_id is required")            

        conversation = await db.conversation.create(user_id)

        print(f"Created conversation: {conversation}")

        return [ConversationDTO(
            id=str(conversation.id),
            user_id=conversation.user_id,
            session_id=conversation.session_id,
            name=conversation.name,
            started_at=conversation.started_at,
            last_active=conversation.last_active,
            is_archived=conversation.is_archived,
            flags=conversation.flags
        )]
    
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
        if await db.conversation.delete(conversation_id):
            return {"message": "Conversation deleted"}
        else:
            raise HTTPException(status_code=500, detail="could not delete conversation")
    
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    

#TODO Update conversation name

#TODO Get conversation by id

#TODO Get conversation by user id

