from memory.Cache.DiskCache.diskCache import DiskCache
from memory.Cache.Redis.redisCache import RedisCache
from memory.DB.Mongo.MongoDB import MongoDB
from models.schemas import FileDoc
import uuid 



class uploadService:
    def __init__(self, db: MongoDB, cache: RedisCache, dc: DiskCache):
        self.db = db
        self.cache = cache
        self.disk = dc

    async def upload_temp(self, content: bytes,filename, content_type: str):
        file_id = str(uuid.uuid4())

        safe_filename = "".join(c for c in filename if c.isalnum() or c in ('.', '_', '-')).rstrip()
        if not safe_filename:
            safe_filename = f"uploaded_file_{file_id}" 

        file_doc = FileDoc(
            file_id = file_id,
            file_name = safe_filename,
            file_type = content_type,
            file_size = len(content),
            file_url = f"/file/content/{file_id}"
        )

        await self.cache.files.cache_file_metadata(file_id, file_doc)
        self.disk.Write(filename, file_id, content)

        return file_doc


    async def finalize_upload(self, user_id:str, convo_id:str, msg_id:str, file_id:str) :
        try:
            file_doc = await self.cache.files.get_file_metadata(file_id)

            permanent_path = self.disk.flush_cache_in_permanent_folder(
            file_id
            )
            if not permanent_path:
                raise "failed to get permanent path"
            
            print("got permanent path:", permanent_path)

            await self.db.file.create(
                user_id=user_id,
                conversation_id=convo_id,
                message_id=msg_id,
                permanent_path = permanent_path,
                fileDoc=file_doc            
            )
            return permanent_path
        except Exception as e:
            print("error in file metadata:", e)
            raise e

    async def get_file_content(self, file_id):

    #TODO: implement file cahing later
        content = self.disk.Load(file_id)
        if not content:
            file_meta = await self.db.file.get_by_file_id(file_id)
            if not file_meta:
                raise FileNotFoundError("did not find metadata in DB")
            content = self.disk.get_permanent_file(file_meta.permanent_path, file_id)

        return content
    
    async def get_file_metadata(self, file_id):

        file_meta = await self.cache.files.get_file_metadata(file_id)
        if not file_meta:
            file = await self.db.file.get_by_file_id(file_id)
            if not file: 
                raise FileNotFoundError("could not find file metadata")
            file_meta = file.file_metadata

        return file_meta


        

