import fastapi
from fastapi import Depends, HTTPException, Request
from models.schemas import UserDTO
from memory.DB.Mongo.MongoDB import MongoDB
from memory.Cache.Redis.redisCache import RedisCache
from api.utils.Dependencies import get_db, get_cache
import traceback

UserRouter = fastapi.APIRouter()


#TODO: change the input request 


@UserRouter.post("/users/get-user-id")
async def get_user_info(
    request: Request,
    db: MongoDB = Depends(get_db)
):
    """Endpoint to retrieve user information"""
    try:
        # Parse the request body
        body = await request.json()
        username = body.get("username")
        email = body.get("email")

        print(f"POST /users/get-user-id - username: {username}, email: {email}")

        if not username and not email:
            raise HTTPException(status_code=400, detail="Username or email is required")

        # Handle guest user
        #TODO: add JWT for real auth
        user = await db.user.get_user_by_email(email=email)
        #TODO: remove later
        if not user:
            user = await db.user.create_user(username=username, email=email)
        # user = await db.user.get_user_by_username(username=username)

        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return UserDTO(
            id=str(user.id),
            username=user.username,
            email=user.email,
            created_at=user.created_at
        )
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

    user = await db.user.create_user(username=username, email=email)
    if not user:
        raise HTTPException(status_code=400, detail="User not created")
    else:
        print("Created new guest user:", user.id)
    return UserDTO(
        id=str(user.id),
        username=user.username,
        email=user.email,
        created_at=user.created_at
    )