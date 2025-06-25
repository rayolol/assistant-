import fastapi 
from fastapi import File, UploadFile, Depends, HTTPException
import uuid
import os
from api.utils.Dependencies import get_app_context
from memory.Cache.Redis.redisCache import RedisCache
from models.schemas import FileDoc
from services.appContext import AppContext
from pathlib import Path
from memory.Cache.DiskCache.diskCache import DiskCache
import traceback



FileRouter = fastapi.APIRouter()

def get_disk_cache():
    return DiskCache()

@FileRouter.get("/file/metadata/{file_id}")
async def get_file_data(file_id: str, appcontext:AppContext = Depends(get_app_context)):
    """
    Temporary function for frontend testing: Gets metadata about a file.
    Returns a JSON object matching the FileAttachmentSchema (id, name, type, url).
    The 'url' field will point to another endpoint to fetch the actual file content.
    """
    try:
        # Retrieve the file path from the DiskCache (assuming it stores paths now)
        file_meta = await appcontext.uploadService.get_file_metadata(file_id)

        if not file_meta:
            raise HTTPException(status_code=404, detail=f"File with ID {file_id} not found in cache or on disk.")
        
        return file_meta
    except HTTPException as he:
        # Re-raise HTTPExceptions directly
        raise he
    except Exception as e:
        # Catch any other unexpected errors and return a 500
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@FileRouter.get("/file/content/{file_id}")
async def get_file(file_id: str, appcontext: AppContext = Depends(get_app_context)):
    try:

        content = await appcontext.uploadService.get_file_content(file_id)
        return fastapi.responses.Response(content=content, media_type="application/octet-stream")
    
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    

@FileRouter.post("/files/upload") 
async def upload_file(
    file: UploadFile = File(...),
    appcontext:AppContext = Depends(get_app_context)
    
): 
    try:

        return await appcontext.uploadService.upload_temp(await file.read(), file.filename, file.content_type)

    except Exception as e:
        print(f"Error during file upload to temporary disk cache: {e}") 
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"File upload failed: {e}")
        