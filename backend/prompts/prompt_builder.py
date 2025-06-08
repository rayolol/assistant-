import json
import yaml
from memory.DB.schemas import ChatMessage
from pydantic import BaseModel
from typing import List, Dict, Any

class Memory (BaseModel):
    ref: int
    content: str

class PromptStructure(BaseModel):
    memories: List[Memory]
    history: List[Dict[str, Any]]
    current_message: str
    user_description: str


def build_full_prompt(history: List[ChatMessage], memories: Dict[Any, Any], current_conversation_id: str, user_input: str, userdescription: str) -> PromptStructure:
    """build the prompt of the assistant"""
    try:
        results = memories.get("results", []) if isinstance(memories, dict) else print("memories is not a dictionary") and []
        memory_list = []

        for i, memory in enumerate(results) if results else []:
            memory_list.append(Memory(ref=i, content=memory["memory"]))


        history_list = []
        if history:
            for msg in history:
                if msg.conversation_id == current_conversation_id:
                    history_dict = {
                        "role": msg.role,
                        "content": msg.content,
                    }
                    history_list.append(history_dict)
                    


        full_prompt =  PromptStructure(
            memories=memory_list,
            history=history_list,
            current_message=user_input,
            user_description=userdescription
        )

        # Make sure to return the full_prompt
        return full_prompt

    except Exception as e:
        print(f"Error in build_full_prompt: {e}")
        import traceback
        traceback.print_exc()
        return PromptStructure(memories=[], history=[], current_message=user_input, user_description=userdescription)


def format_prompt(prompt: PromptStructure, as_yaml: bool = False) -> str:
    
    data = prompt.model_dump()

    if as_yaml:
        return yaml.dump(data, sort_keys=False, allow_unicode=True)
    else:
        return json.dumps(data, indent=2, ensure_ascii=False)
