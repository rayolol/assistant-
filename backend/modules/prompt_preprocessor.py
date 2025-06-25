from typing import List, Dict
import base64
from pydantic import BaseModel
from typing import Literal, Union
from services.uploadFileService import uploadService


class url(BaseModel):
    url: str

class TextInput(BaseModel):
    type: Literal["input_text"]
    text: str

class ImageInput(BaseModel):
    type: Literal["input_image"]
    image_url: str  # base64-encoded data URL
    detail: Literal["auto", "low", "high"] = "auto"

class PromptMessage(BaseModel):
    role: Literal["user", "system", "assistant"] = "user"
    content: List[Union[TextInput, ImageInput]] | str

    





class PromptBuilder:
    def __init__(self):
        self.messages: List[PromptMessage] = []

    def add_system(self, text: str):
        self.messages.append(PromptMessage(role="system", content = text.strip()))
        return self

    def add_text(self, text: str):
        if text.strip():
            self.messages.append(PromptMessage(role="user", content=text.strip()))
        return self

    async def add_image_from_disk(self, text:str, file_id: str, fileService: uploadService , detail: str = "auto"):
        try:
            self.messages.append(PromptMessage(type="input_text", content= (
                "The user has included an image. If their message is unclear, you must interpret it as a request to describe or analyze the image content."
            )))

            image_bytes = await fileService.get_file_content(file_id)
            b64_img = base64.b64encode(image_bytes).decode("utf-8")
            data_url = f"data:image/png;base64,{b64_img}"
            content: List[Union[TextInput, ImageInput]] = []
            if text:
                content.append(TextInput(type="input_text", text = text))

            
            content.append(ImageInput(type="input_image", image_url=data_url, detail=detail))
            self.messages.append(PromptMessage(role="user", content = content))
        except Exception as e:
            print(f"Failed to load image for prompt: {e}")
        return self

    def build(self) -> List[PromptMessage]:
        
        return [msg.model_dump() for msg in self.messages]
