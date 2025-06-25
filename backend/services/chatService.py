from memory.DB.Mongo.MongoDB import MongoDB
from memory.Cache.Redis.redisCache import RedisCache
from memory.DB.schemas import ChatMessage
import traceback

class chatService:
    def __init__(self, db: MongoDB, cache: RedisCache):
        self.db = db
        self.cache = cache

    async def load_chat_history(self, conversation_id:str, user_id:str):
        try:

            history = await self.cache.messages.get_chat_history(conversation_id, user_id)
            if not history:
                history = await self.db.message.get_conversation_history(conversation_id, user_id)
                if not history: 
                    return []
           

            return history
        except Exception as e:
            print("error in chatservice: ",e )
            traceback.print_exc()
            return []

    async def add_message(self,msg: ChatMessage):

        try:
        
            new_message = await self.db.message.create(msg)

            history = await self.load_chat_history(msg.conversation_id, msg.user_id)

            history.append(new_message)

            await self.cache.messages.update_history(
                history = history,
                conversation_id=msg.conversation_id,
                user_id=msg.user_id
            )

            return new_message
        except Exception as e:
            traceback.print_exc()
            print("error in add message: ", e)





