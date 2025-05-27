import fastapi
from memory.MongoDB import MongoDB
from memory.redisCache import RedisCache
from api.utils.Dependencies import get_db, get_cache
import traceback
from fastapi import Depends, HTTPException
from models.models import UserPreferences

SettingsRouter = fastapi.APIRouter()




@SettingsRouter.put("/users/update-user-info/{user_id}", response_model=UserPreferences)
async def UpdatePromptSettings(
    request: UserPreferences,
    user_id: str,
    db: MongoDB = Depends(get_db),
):
    """Endpoint to update user information"""
    try:
        if not request.user_id:
            raise HTTPException(status_code=400, detail="user_id is required")
        info = await db.get_user_info(user_id)
        if not info:
            info = await db.create_user_info(request)
        else:
            info = await db.update_user_info(request)

        info = await db.update_user_info(request)
        if info:
            return info
        else:
            raise Exception("User info not updated")
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    

