"""Default tools for the agent"""
from agents import function_tool, RunContextWrapper
import traceback
from pydantic import BaseModel
from typing import Dict, Any, List

memory = None

def set_memory(mem_instance):
    global memory
    memory = mem_instance

class Mem0Context(BaseModel):
    recent_memories: List[Dict[str, Any]] | None = None
    user_id: str | None = None
    
class DefaultToolBox:
    def __init__(self):
        
        pass
    
    
    @staticmethod
    @function_tool
    def update_memory(context: RunContextWrapper[Mem0Context], existing_memory_ref: int, updated_content: str = "") -> str:
        """
        Update a message in Mem0
        Arg:
            existing_memory_ref: The reference number of the memory to update.
            updated_content: The new content for the memory.
        """
        try: 
            global memory
            if memory is None:
                return "Memory system not initialized"
            
            if not updated_content or updated_content.strip() == "":
                return "Cannot update without content"
            
            print(f"Attempting to update memory with ref: {existing_memory_ref}")
            print(f"Available memories: {context.context.recent_memories}")
            print(f"New content: {updated_content}")
            
            if context.context.recent_memories:
                for entry in context.context.recent_memories:
                    if entry["ref"] == existing_memory_ref:
                        print(f"Found matching memory: {entry}")
                        memory.update(entry["id"], updated_content)
                        return f"Successfully updated memory from '{entry['memory']}' to '{updated_content}'"
                return f"No memory found with reference number {existing_memory_ref}"
            else:
                return "No memories available to update"
                    
        except Exception as e:
            print(f"Error in update_memory: {e}")
            traceback.print_exc()
            return f"Failed to update memory: {str(e)}"
    
    @staticmethod
    @function_tool
    def delete_memory(
        context: RunContextWrapper[Mem0Context],
        existing_memory_ref: int,
    ) -> str:
        """
        Delete a memory from Mem0
        by inserting the selected memory ref
        
        Args:
            existing_memory_ref: The reference number of the memory to delete.
        """
        try:
            global memory
            if memory is None:
                return "Memory system not initialized"
            if existing_memory_ref is None:
                return "Cannot delete without a reference number"
            
            print(f"Attempting to delete memory with ref: {existing_memory_ref}")
            print(f"Available memories: {context.context.recent_memories}")

            if context.context.recent_memories:
                for entry in context.context.recent_memories:
                    if entry["ref"] == existing_memory_ref:
                        print(f"Found matching memory: {entry}")
                        memory.delete(entry["id"])
                        return f"Successfully deleted memory: '{entry['memory']}'"
                return f"No memory found with reference number {existing_memory_ref}"
            else:
                return "No memories available to delete"
        
        except Exception as e:
            print(f"Error in delete_memory: {e}")
            traceback.print_exc()
            return f"Failed to delete memory: {str(e)}"

    
    @staticmethod
    @function_tool
    def add_to_memory(
        context: RunContextWrapper[Mem0Context],
        content: str = "",
    ) -> str:
        """
        Add a message to Mem0
        Args:
            content: The content to store in memory.
        """
        try:
            global memory
            if memory is None:
                return "Memory system not initialized"
            
            # Handle None content
            if content is None:
                return "Cannot store empty content"
            
            if not content or content.strip() == "":
                return "Cannot store empty content"
            
            messages = [{"role": "user", "content": content}]
    
            memory.add(messages, user_id='user', metadata={"source": "user_input"})
            print("memory updated")
            return f"Stored message: {content}"
        except Exception as e:
            print(f"Error in add_to_memory: {e}")
            traceback.print_exc()
            return f"Failed to store message: {str(e)}"

    @staticmethod
    @function_tool
    def search_memory(
        context: RunContextWrapper[Mem0Context],
        query: str = "",  # Add default empty string
    ) -> str:
        """
        Search for memories in Mem0
        Args:
            query: The search query.
        """
        try:
            global memory
            if memory is None:
                return "Memory system not initialized"
            
            if not query or query.strip() == "":
                return "Cannot search with empty query"
            
            memories = memory.search(query, user_id="user")
            
            if not memories or "results" not in memories or not memories["results"]:
                return "No memories found matching your query."
            
            results = '\n'.join([result["memory"] for result in memories["results"] if "memory" in result])
            return results or "No readable memories found."
        except Exception as e:
            print(f"Error in search_memory: {e}")
            traceback.print_exc()
            return f"Failed to search memory: {str(e)}"

    @staticmethod    
    @function_tool
    def get_all_memory(
        context: RunContextWrapper[Mem0Context],
    ) -> str:
        """Retrieve all memories from Mem0"""
        try:
            global memory
            if memory is None:
                raise "Memory system not initialized"
        
            memories = memory.get_all(user_id="user")
            
            if not memories or "results" not in memories or not memories["results"]:
                return "No memories found."
                
            results = '\n'.join([result["memory"] for result in memories["results"] if "memory" in result])
            return results or "No readable memories found."
        except Exception as e:
            print(f"Error in get_all_memory: {e}")
            traceback.print_exc()
            return f"Failed to retrieve memories: {str(e)}"
        
