from memory.DB.Mongo.MongoDB import MongoDB
from memory.Cache.Redis.redisCache import RedisCache
from memory.DB.schemas import PromptSettings


class userService:
    def __init__ (self, db: MongoDB, cache: RedisCache):
        self.db = db
        self.cache = cache

    async def get_user_data(self,email:str, username:str, jwt: str = '123456'):
        user = self.db.user.get_user_by_email(email)
        #TODO: remove later add JWT for real auth
        if not user:
            user = self.db.user.create_user(username=username, email=email)

            print("created a new user")

        return user
    



    async def get_user_prompt_settings(self, user_id: str):
        #TODO: add caching
        return await self.db.prompt_settings.get_by_user_id(user_id)
    
    async def update_user_prompt_settings(self, user_id: str, ps: PromptSettings):

        info = await self.get_user_prompt_settings(user_id)
        if not info:
            info = await self.db.prompt_settings.create(
                user_id=user_id,
                display_name=ps.display_name,
                custom_prompt=ps.custom_prompt,
                occupation=ps.occupation,
                interests=ps.interests,
                about_me=ps.about_me
                )
        else:
            info = await self.db.prompt_settings.update(
                user_id=user_id,
                display_name=ps.display_name,
                custom_prompt=ps.custom_prompt,
                occupation=ps.occupation,
                interests=ps.interests,
                about_me=ps.about_me
                )
            
        return info
    

    
