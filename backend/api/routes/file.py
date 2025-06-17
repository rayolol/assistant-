import fastapi 
from fastapi import File, UploadFile, Depends, HTTPException
import uuid
from api.utils.Dependencies import get_db
from memory.DB.schemas import ChatMessage
from memory.DB.Mongo.MongoDB import MongoDB


FileRouter = fastapi.APIRouter()

@FileRouter.get("/file/{file_id}")
def get_file(file_id: str):
    print("getting a file...");
    pass


@FileRouter.post("/files/upload/{conversation_id}/{user_id}/{message_id}")
async def upload_file(
    conversation_id: str,
    user_id: str, 
    message_id: str,
    file: UploadFile = File(...),
    db: MongoDB = Depends(get_db)
):
    try: 
        print(file.__str__())
        file_id = str(uuid.uuid4())
        file_path = f"uploads/{file_id}_{file.filename}"
        safe_filename = "".join(c for c in file.filename if c.isalnum() or c in ('.', '-','_','/', "`\`")).rstrip()

        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)

        return {
            "file_id": file_id,
            "file_name": safe_filename,
            "file_type": file.content_type,
            "file_size": len(content),
            "file_url": file_path
        } 
    except Exception as e:
        raise HTTPException(status_code=500, detail = f"file upload failed: {e}")
        