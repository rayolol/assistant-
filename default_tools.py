"""Default tools for the agent"""
from agents import function_tool, RunContextWrapper
import traceback
from pydantic import BaseModel

memory = None

def set_memory(mem_instance):
    global memory
    memory = mem_instance

class Mem0Context(BaseModel):
    user_id: str | None = None
    
class DefaultToolBox:
    def __init__(self):
        pass
    
    
    @staticmethod
    @function_tool
    def update_memory(context: RunContextWrapper[Mem0Context], id: str = "", content: str = "") -> str:
        """
        Update a message in Mem0
        Args:
            id: The ID of the message to update.
            content: The new content for the message.
        """
        try: 
            global memory
            if memory is None:
                return "Memory system not initialized"
            
            if not id or id.strip() == "" :
                return "Cannot update without an ID"
            
            # Remove the user_id parameter since it's not accepted
            memory.update(id, content)
            return f"Updated message with ID: {id}"
        except Exception as e:
            print(f"Error in update_memory: {e}")
            traceback.print_exc()
            return f"Failed to update message: {str(e)}"
    
    @staticmethod
    @function_tool
    def delete_memory(
        context: RunContextWrapper[Mem0Context],
        id: str = "",
    ) -> str:
        """
        Delete a message from Mem0
        Args:
            id: The ID of the message to delete.
        """
        try:
            global memory
            if memory is None:
                return "Memory system not initialized"
            
            if not id or id.strip() == "":
                return "Cannot delete without an ID"
            # Remove the user_id parameter since it's not accepted
            memory.delete(id)
            return f"Deleted message with ID: {id}"
        except Exception as e:
            print(f"Error in delete_memory: {e}")
            traceback.print_exc()
            return f"Failed to delete message: {str(e)}"

    
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
    
            memory.add(messages, user_id='user')
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
        
