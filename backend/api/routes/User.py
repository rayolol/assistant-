import fastapi
from fastapi import Depends, HTTPException, Request
from models.models import UserPreferences
from memory.MongoDB import MongoDB
from memory.redisCache import RedisCache
from api.utils.Dependencies import get_db, get_cache
import traceback

UserRouter = fastapi.APIRouter()


#TODO: change the input request 

#TODO: return user info object

@UserRouter.post("/users/get-user-id")
async def get_user_info(
    request: Request,
    db: MongoDB = Depends(get_db)
):
    """Endpoint to retrieve user information"""
    try:
        # Parse the request body
        body = await request.json()
        print(body)
        username = body.get("username")
        email = body.get("email")

        print(f"POST /users/get-user-id - username: {username}, email: {email}")

        if not username and not email:
            raise HTTPException(status_code=400, detail="Username or email is required")

        # Handle guest user
        id = await db.search_user(username=username, email=email)

        if not id:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {"userId": str(id)}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@UserRouter.post("/users/create-user")
async def create_user(request: Request, db: MongoDB = Depends(get_db)):
    """Get or create a guest user"""

    body = await request.json()
    print(body)
    username = body.get("username")
    email = body.get("email")

        
    print(f"POST /users/get-user-id")
    if not username and not email:
        raise HTTPException(status_code=400, detail="Username or email is required")

    user = await db.search_user(username=username, email=email)
    if not user:
        # Create the guest user if it doesn't exist
        user_id = await db.create_user(username, email)
        print("Created new guest user:", user_id)
    else:
        user_id = str(user.id)
        print("Using existing guest user:", user_id)
    return user_id