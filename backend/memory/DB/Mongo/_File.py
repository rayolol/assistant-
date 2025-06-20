from memory.DB.schemas import FileMeta, FileDoc
from typing import Dict, Any

class FileOps: 
    async def create(self, user_id: str, conversation_id: str, message_id: str, fileDoc: FileDoc):
        file_meta = FileMeta(
            user_id=user_id, 
            conversation_id=conversation_id,
            message_id= message_id,
            file_metadata=fileDoc
        )
        
        await file_meta.insert()

    async def get_by_file_id(self, file_id:str):
        return await FileMeta.find(FileMeta.file_metadata.file_id == file_id)
    
    async def get_by_conversation_id(self, conversation_id: str):
        return await FileMeta.find(FileMeta.conversation_id == conversation_id)
    
    async def get_by_message_id(self, message_id: str):
        return await FileMeta.find(FileMeta.message_id == message_id)
