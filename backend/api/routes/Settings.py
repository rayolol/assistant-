import fastapi
from memory.DB.Mongo.MongoDB import MongoDB
from memory.Cache.Redis.redisCache import RedisCache
from api.utils.Dependencies import get_app_context
import traceback
from services.appContext import AppContext
from memory.DB.schemas import PromptSettings
from models.schemas import PromptSettingsDTO
from fastapi import Depends, HTTPException
from models.models import UserPreferences

SettingsRouter = fastapi.APIRouter()


#TODO: add prompt settings to db

@SettingsRouter.put("/users/update-prompt-settings/{user_id}", response_model= PromptSettingsDTO)
async def UpdatePromptSettings(
    request: PromptSettingsDTO,
    user_id: str,
    appcontext: AppContext = Depends(get_app_context)
):
    """Endpoint to update user information"""
    try:
        if not request.user_id:
            raise HTTPException(status_code=400, detail="user_id is required")
        info = await appcontext.userService.update_user_prompt_settings(user_id)
        
        if info:
            return PromptSettingsDTO(
                id=str(info.id),
                user_id=info.user_id,
                display_name=info.display_name,
                custom_prompt=info.custom_prompt,
                occupation=info.occupation,
                interests=info.interests,
                about_me=info.about_me,
                updated_at=info.updated_at.isoformat(timespec="milliseconds")
            )
        else:
            raise Exception("User info not updated")
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    

@SettingsRouter.get("/users/get-prompt-settings/{user_id}", response_model= PromptSettingsDTO)
async def get_prompt_settings(user_id: str, appcontext:AppContext = Depends(get_app_context)):
    """Endpoint to retrieve user information"""
    try:
        if not user_id:
            raise HTTPException(status_code=400, detail="user_id is required")
        info = await appcontext.db.prompt_settings.get_by_user_id(user_id)
        if info:
            return PromptSettingsDTO(
                id=str(info.id),
                user_id=info.user_id,
                display_name=info.display_name,
                custom_prompt=info.custom_prompt,
                occupation=info.occupation,
                interests=info.interests,
                about_me=info.about_me,
                updated_at=info.updated_at.isoformat(timespec="milliseconds")
            )
        else:
            raise Exception("User info not found")
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    

