from memory.DB.schemas import Users

class UserOps:
    #TODO: add JWT
    async def create_user(self, username, email):
        user = Users(username=username, email=email)
        await user.insert()
        return user

    async def get_user_by_id(self, id: str):
        return await Users.find_one(Users.id == id)
    
    async def get_user_by_email(self, email: str):
        return await Users.find_one(Users.email == email)
    
    async def get_user_by_username(self, username: str):
        return await Users.find_one(Users.username == username)

    async def update_user(self, id: str, username: str = None, email: str = None):
        user = await self.get_user_by_id(id)
        if user:
            user.username = username
            user.email = email
            await user.save()
            return user
        return None

    async def delete_user(self, id: str):
        user = await self.get_user_by_id(id)
        if user:
            await user.delete()
            return True
        return False
