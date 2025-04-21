from motor.motor_asyncio import AsyncIOMotorClient as MongoClient
from pydantic import BaseModel
from datetime import datetime
from typing import List, Dict, Optional, Any
from beanie import init_beanie, Document , Link
from models import users, conversations, ChatMessage

#Create user
#user = User(username="alex", email="alex@example.com")
#await user.insert()

#Create conversation
#conversation = Conversation(user_id=user.id)
#await conversation.insert()

#Create messages
#message = chat_history(conversation_id=conversation.id, messages = {"role": "user", "content": "Hello", timestamp: datetime.datetime.now()})
#await message.insert()

#get history
#history = await Message.find(chat_history.conversation_id == str(conv.id))

class MongoDB:
    def __init__(self,db_name='user_db'):
        self.client = MongoClient("mongodb://localhost:27017")
        self.db = db_name
        self.initialized = False


    async def initialize(self):

        if not self.initialized:
            await init_beanie(
                database=self.client[self.db],
                document_models=[users, conversations, ChatMessage]
                )
            self.initialized = True
        return self

    async def create_user(self, username: str, email: str):
        if not self.initialized:
            await self.initialize()
        user = users(username=username, email=email)
        await user.insert()
        return user._id

    async def add_message(self, messages: ChatMessage, conversation_id: str):
        if not self.initialized:
            await self.initialize()
        message = ChatMessage(conversation_id = conversation_id, messages = messages)
        await message.insert()

    async def create_conversation(self, user_id: str, name: str = "new conversation"):
        """Create a new conversation for a user"""
        if not self.initialized:
            await self.initialize()

        try:
            # Try to find the user first
            from beanie import PydanticObjectId
            from models import users

            # Check if user_id is already a PydanticObjectId
            if not isinstance(user_id, PydanticObjectId):
                try:
                    # Try to convert to PydanticObjectId
                    user_id_obj = PydanticObjectId(user_id)
                except Exception:
                    # If conversion fails, try to find the user by username/email
                    print(f"Invalid user_id format: {user_id}, trying to find user")
                    user = await users.find_one({"username": "Guest", "email": "Guest@example.com"})
                    if not user:
                        # Create a new user if not found
                        user = users(username="Guest", email="Guest@example.com")
                        await user.insert()
                    user_id_obj = user.id
            else:
                user_id_obj = user_id

            # Create the conversation with the valid user ID
            conversation = conversations(user_id=user_id_obj, name=name)
            await conversation.insert()
            return str(conversation.id)
        except Exception as e:
            print(f"Error in create_conversation: {e}")
            raise e

    async def get_history(self, conversation_id: str):
        if not self.initialized:
            await self.initialize()

        history = await ChatMessage.find({"conversation_id": conversation_id}).to_list()
        return history

    async def get_conversation(self, user_id: str, include_archived: bool = False):
        """Get all conversations for a user"""
        try:
            if not self.initialized:
                await self.initialize()

            # Process user_id
            from beanie import PydanticObjectId

            # Check if user_id is already a PydanticObjectId
            if not isinstance(user_id, PydanticObjectId):
                try:
                    # Try to convert to PydanticObjectId
                    user_id_obj = PydanticObjectId(user_id)
                except Exception:
                    # If conversion fails, try to find the user by username/email
                    print(f"Invalid user_id format in get_conversation: {user_id}, trying to find user")
                    user = await users.find_one({"username": "Guest", "email": "Guest@example.com"})
                    if not user:
                        # Create a new user if not found
                        user = users(username="Guest", email="Guest@example.com")
                        await user.insert()
                    user_id_obj = user.id
            else:
                user_id_obj = user_id

            # Build query
            query = {"user_id": user_id_obj}
            if not include_archived:
                query["is_archived"] = False

            print(f"Querying conversations with: {query}")

            # Get conversations
            conversation_list = await conversations.find(query).sort([("last_active", -1)]).to_list()
            print(f"Found {len(conversation_list)} conversations")

            # Convert to dictionaries
            result = []
            for conv in conversation_list:
                result.append({
                    "id": str(conv.id),
                    "name": conv.name,
                    "started_at": conv.started_at.isoformat(),
                    "last_active": conv.last_active.isoformat(),
                    "is_archived": getattr(conv, "is_archived", False),
                    "tags": getattr(conv, "tags", [])
                })
            return result
        except Exception as e:
            print(f"Error in get_conversation: {e}")
            return []

    async def get_conversation_by_id(self, conversation_id: str):
        """Get a specific conversation by ID"""
        if not self.initialized:
            await self.initialize()
        try:
            conv = await conversations.get(conversation_id)
            if not conv:
                return None
            return {
                "id": str(conv.id),
                "name": conv.name,
                "started_at": conv.started_at.isoformat(),
                "last_active": conv.last_active.isoformat(),
                "is_archived": getattr(conv, "is_archived", False),
                "tags": getattr(conv, "tags", [])
            }
        except Exception as e:
            print(f"Error in get_conversation_by_id: {e}")
            return None

    async def update_conversation(self, conversation_id: str, data: dict):
        """Update a conversation with new data"""
        if not self.initialized:
            await self.initialize()
        try:
            conv = await conversations.get(conversation_id)
            if not conv:
                return False

            # Update fields
            if "name" in data:
                conv.name = data["name"]
            if "is_archived" in data:
                conv.is_archived = data["is_archived"]
            if "tags" in data:
                conv.tags = data["tags"]

            # Always update last_active
            conv.last_active = datetime.now()

            # Save changes
            await conv.save()
            return True
        except Exception as e:
            print(f"Error in update_conversation: {e}")
            return False

    async def delete_conversation(self, conversation_id: str):
        """Delete a conversation and all its messages"""
        if not self.initialized:
            await self.initialize()
        try:
            # Delete the conversation
            conv = await conversations.get(conversation_id)
            if not conv:
                return False

            # Delete all messages in the conversation
            await ChatMessage.find({"conversation_id": conversation_id}).delete()

            # Delete the conversation itself
            await conv.delete()
            return True
        except Exception as e:
            print(f"Error in delete_conversation: {e}")
            return False

    async def search_user(self, username: str, email: str):
        try:
            if not self.initialized:
                await self.initialize()
            user = await users.find_one({"username": username, "email": email})
            return user
        except Exception as e:
            print(f"Error in search_user: {e}")
            return None


    async def delete(self, conversation_id: str):

        if not self.initialized:
            await self.initialize()
        await ChatMessage.find({"_id": conversation_id}).delete()
