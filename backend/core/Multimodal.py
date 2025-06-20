import base64
from typing import List, Dict, Union
from memory.Cache.DiskCache.diskCache import DiskCache

def build_multimodal_input(prompt_text: str, file_id: str, dc:DiskCache ) -> List[any]:
    
    prompt = []

    if prompt_text:
        prompt.append({"type": "input_text", "text": prompt_text})

    if file_id:
        try: 
            image_bytes = dc.Load(file_id)
            b64_img = base64.b64encode(image_bytes).decode("utf-8")
            prompt.append({
                "type": "input_image",
                "image_url": f"data:image/png;base64,{b64_img}",
                "detail": "auto"
            })

            full_Prompt = [{"role":"user", "content": prompt}]
        except Exception as e:
            print("error in multimodal input: ", e)
    return full_Prompt