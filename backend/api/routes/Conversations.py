import fastapi
from models.schemas import ConversationDTO
from fastapi import Depends, HTTPException, Request
from memory.DB.schemas import Conversations
from memory.Cache.Redis.redisCache import RedisCache
import traceback
from services.appContext import AppContext
from api.utils.Dependencies import get_app_context
from typing import List

ConversationsRouter = fastapi.APIRouter()


@ConversationsRouter.get("/chat/conversations/{user_id}", response_model=List[ConversationDTO])
async def get_user_conversations(
    user_id: str,
    appcontext:AppContext = Depends(get_app_context)
) -> List[ConversationDTO]:
    """Endpoint to retrieve all conversations for a user"""
    try:
        if not user_id:
            raise HTTPException(status_code=400, detail="user_id is required")
        # Get all conversations for the user
        conversations = await appcontext.conversationService.get_conversations_list(user_id)
        

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
    request: Request,
    user_id: str,
    appcontext: AppContext = Depends(get_app_context)
)-> ConversationDTO:
    """Endpoint to create a new conversation for a user"""
    try:
        if not user_id:
            raise HTTPException(status_code=400, detail="user_id is required")            

        conversation = await appcontext.conversationService.db.conversation.create(user_id)

        print(f"Created conversation: {conversation}")

        return ConversationDTO(
            id=str(conversation.id),
            user_id=conversation.user_id,
            session_id=conversation.session_id,
            name=conversation.name,
            started_at=conversation.started_at,
            last_active=conversation.last_active,
            is_archived=conversation.is_archived,
            flags=conversation.flags
        )
    
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@ConversationsRouter.delete("/chat/delete-conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    appcontext: AppContext = Depends(get_app_context)
    ):
    """Endpoint to delete a conversation"""
    try:
        if not conversation_id:
            raise HTTPException(status_code=400, detail="conversation_id is required")
        if await appcontext.conversationService.db.conversation.delete(conversation_id):
            return {"message": "Conversation deleted"}
        else:
            raise HTTPException(status_code=500, detail="could not delete conversation")
    
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    

@ConversationsRouter.put("/chat/update-conversations/{conversation_id}")
async def update_conversation( request: ConversationDTO, conversation_id: str, appcontext: AppContext = Depends(get_app_context)):
    try:
        if not conversation_id:
            raise HTTPException(status_code=400, detail="conversation_id is required")
        
        convo = Conversations(
            id = conversation_id,
            user_id= request.user_id,
            session_id=request.session_id,
            name = request.name,
            started_at=request.started_at,
            last_active=request.last_active,
            is_archived=request.is_archived,
            flags=request.flags
        )
        if await appcontext.conversationService.update_conversation(convo):
            return {"message": "conversation updated"}

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
        
    


#TODO Get conversation by id


