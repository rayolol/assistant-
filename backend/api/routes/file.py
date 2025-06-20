import fastapi 
from fastapi import File, UploadFile, Depends, HTTPException
import uuid
import os
from api.utils.Dependencies import get_cache
from memory.Cache.Redis.redisCache import RedisCache
from models.schemas import FileDoc
from pathlib import Path
from memory.Cache.DiskCache.diskCache import DiskCache



FileRouter = fastapi.APIRouter()

def get_disk_cache():
    return DiskCache()

@FileRouter.get("/file/metadata/{file_id}")
async def get_file_data(file_id: str, dc = Depends(get_disk_cache)):
    """
    Temporary function for frontend testing: Gets metadata about a file.
    Returns a JSON object matching the FileAttachmentSchema (id, name, type, url).
    The 'url' field will point to another endpoint to fetch the actual file content.
    """
    try:
        # Retrieve the file path from the DiskCache (assuming it stores paths now)
        file_path = dc.cache.get(file_id)

        if not file_path or not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail=f"File with ID {file_id} not found in cache or on disk.")

        file_name = os.path.basename(file_path)
        
        # Simple media type inference based on file extension
        file_type = "application/octet-stream" # Default
        if "." in file_name:
            ext = file_name.split(".")[-1].lower()
            if ext in ["jpg", "jpeg", "png", "gif", "bmp", "webp"]:
                file_type = f"image/{ext}"
            elif ext == "pdf":
                file_type = "application/pdf"
            elif ext == "txt":
                file_type = "text/plain"
            # Add more types as needed

        # Construct the URL for fetching the actual file content.
        # This assumes your FastAPI app is mounted at the root and this router is `/`.
        # If your FastAPI app has a prefix, adjust the URL accordingly.
        # For local development, it might be http://localhost:8001/file/content/{file_id}
        # The frontend's `axios.instance` uses `baseURL`, so `/file/content/{file_id}` is correct relative path.
        content_url = f"/file/content/{file_id}"

        return {
            "id": file_id,
            "name": file_name,
            "type": file_type,
            "url": content_url
        }

    except HTTPException as he:
        # Re-raise HTTPExceptions directly
        raise he
    except Exception as e:
        # Catch any other unexpected errors and return a 500
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@FileRouter.get("/file/content/{file_id}")
async def get_file(file_id: str, dc = Depends(get_disk_cache)):
    try:

        content = dc.Load(file_id)
        return fastapi.responses.Response(content=content, media_type="application/octet-stream")
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=e)
    

@FileRouter.post("/files/upload") 
async def upload_file(
    file: UploadFile = File(...),
    dc: DiskCache = Depends(get_disk_cache),
    cache: RedisCache = Depends(get_cache)
): 
    try:
        file_id = uuid.uuid4()

        # Sanitize filename for storing and returning to frontend
        safe_filename = "".join(c for c in file.filename if c.isalnum() or c in ('.', '_', '-')).rstrip()
        if not safe_filename:
            safe_filename = f"uploaded_file_{file_id}" 


        content = await file.read()
        fileDoc = FileDoc(
            file_id=str(file_id),
            file_name=safe_filename,
            file_type=file.content_type,
            file_size=len(content),
            file_url= f"/file/content/{file_id}"
        )

        await cache.cache_file_metadata(file_id, fileDoc)
        dc.Write(file.filename, file_id, content)

        return fileDoc

    except Exception as e:
        print(f"Error during file upload to temporary disk cache: {e}") 
        raise HTTPException(status_code=500, detail=f"File upload failed: {e}")
        