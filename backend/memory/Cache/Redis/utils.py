from typing import List
from memory.DB.schemas import ChatMessage



def serialize_history( messages: List[ChatMessage]) -> List[dict]:
        results = []
        for msg in messages:
            msg_dict = msg.model_dump(mode='json')
            # Convert null file_id to undefined (by removing the field)
            if msg_dict.get('file_id') is None:
                msg_dict.pop('file_id', None)
            results.append(msg_dict)
        return results

def deserialize_history( data: List[dict]) -> List[ChatMessage]:
    results = []
    for item in data:
        try:
            results.append(ChatMessage.model_validate(item))
        except Exception:
            continue
    return results