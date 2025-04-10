"""Default tools for the agent"""
from agents import function_tool, RunContextWrapper
import traceback
from pydantic import BaseModel
from typing import Dict, Any, List, Literal, Optional
from datetime import datetime

memory = None

def set_memory(mem_instance):
    global memory
    memory = mem_instance
    
class ChatMessage(BaseModel):
    timestamp: datetime | None = None
    role: str
    content: str
    def __init__(self, **data):
        if 'timestamp' not in data:
            data['timestamp'] = datetime.now()
        super().__init__(**data)

class ToolUsageRecord(BaseModel):
    tool_name: str
    timestamp: datetime = None
    inputs: Dict[str, Any] = {}
    success: bool = True
    output_summary: str = ""
    
    def __init__(self, **data):
        if 'timestamp' not in data:
            data['timestamp'] = datetime.now()
        super().__init__(**data)

class Mem0Context(BaseModel):
    recent_memories: List[Dict[str, Any]] | None = None
    user_id: str | None = None
    session_id: str | None = None
    session_start_time: datetime | None = None
    conversation_id: str | None = None
    current_agent: str | None = None
    previous_agent: str | None = None
    tool_usage_history: List[ToolUsageRecord] = []
    response_metrics: Dict[str, Any] = {}
    chat_history: List[ChatMessage] = []  # Add conversation history directly to context
    
    def add_to_history(self, user_message: str, assistant_response: str) -> None:
        """Add a conversation entry to the history"""
        user_entry = ChatMessage(
            timestamp=datetime.now(),
            role="user",
            content=user_message
        )
        self.chat_history.append(user_entry)
        
        assistant_entry = ChatMessage(
            timestamp=datetime.now(),
            role="assistant",
            content=assistant_response
        )
        self.chat_history.append(assistant_entry)
        
        # Maintain reasonable history length
        MAX_HISTORY_LENGTH = 10
        if len(self.chat_history) > MAX_HISTORY_LENGTH:
            self.chat_history = self.chat_history[-MAX_HISTORY_LENGTH:]
    
    
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
                        context.context.tool_usage_history.append(ToolUsageRecord(
                                                                                tool_name="update_memory",
                                                                                inputs={"ref": existing_memory_ref, "content": updated_content},
                                                                                success=True,
                                                                                output_summary=f"Updated memory from '{entry['memory']}' to '{updated_content}'")
                                                                  )
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
                        memory.delete(entry["id"], )
                        context.context.tool_usage_history.append(ToolUsageRecord(
                                                                                  tool_name="delete_memory", 
                                                                                  inputs={"ref": existing_memory_ref},
                                                                                  success=True,
                                                                                  output_summary=f"Deleted memory: '{entry['memory']}'"))
                        return f"Successfully deleted memory: '{entry['memory']}'"
                return f"No memory found with reference number {existing_memory_ref}"
            else:
                return "No memories available to delete"
        
        except Exception as e:
            print(f"Error in delete_memory: {e}")
            traceback.print_exc()
            context.context.tool_usage_history.append(ToolUsageRecord(
                                                                      tool_name="delete_memory", 
                                                                      inputs={"ref": existing_memory_ref},
                                                                      success=False,
                                                                      output_summary=f"Failed to delete memory: {str(e)}"))
            return f"Failed to delete memory: {str(e)}"

    
    @staticmethod
    @function_tool
    def add_to_memory(
        context: RunContextWrapper[Mem0Context],
        content: str = "",
        memory_type: Optional[Literal["procedural_memory", None]] = None,
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
    
            memory.add(messages,
                       user_id=context.context.user_id or "user",
                       agent_id = context.context.current_agent,
                       run_id = context.context.session_id,
                       memory_type = memory_type, 
            )
            context.context.tool_usage_history.append(
                ToolUsageRecord(
                tool_name="add_to_memory",
                inputs={"content": content},
                success=True,
                output_summary=f"Stored message: {content}"
            ))
            print("memory updated")
            return f"Stored message: {content}"
        except Exception as e:
            print(f"Error in add_to_memory: {e}")
            traceback.print_exc()
            
            context.context.tool_usage_history.append(
                ToolUsageRecord(
                tool_name="add_to_memory",
                inputs={"content": content},
                success=False,
                output_summary=f"Failed to store message: {str(e)}"
            ))
            return f"Failed to store message: {str(e)}"
        
        
#TODO: make context storing on the search

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
            
            memories = memory.search(
                query,
                user_id=context.context.user_id or "user",
                agent_id = context.context.current_agent,
                run_id = context.context.session_id,
                limit=10
            )
            context.context.tool_usage_history.append(ToolUsageRecord(
                tool_name="search_memory",
                inputs={"query": query},
                success=True,
                output_summary=f"Searched for: {query}"
            ))
            
            if not memories or "results" not in memories or not memories["results"]:
                return "No memories found matching your query."
            
            results = '\n'.join([result["memory"] for result in memories["results"] if "memory" in result])
            return results or "No readable memories found."
        except Exception as e:
            print(f"Error in search_memory: {e}")
            traceback.print_exc()
            context.context.tool_usage_history.append(ToolUsageRecord(
                tool_name="search_memory",
                inputs={"query": query},
                success=False,
                output_summary=f"Failed to search memory: {str(e)}"
            ))
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
        
            memories = memory.get_all(user_id=context.context.user_id or "user")
            context.context.tool_usage_history.append(ToolUsageRecord(
                tool_name="get_all_memory",
                inputs={},
                success=True,
                output_summary=f"Retrieved all memories"
            ))
            
            if not memories or "results" not in memories or not memories["results"]:
                return "No memories found."
                
            results = '\n'.join([result["memory"] for result in memories["results"] if "memory" in result])
            return results or "No readable memories found."
        except Exception as e:
            print(f"Error in get_all_memory: {e}")
            traceback.print_exc()
            
            context.context.tool_usage_history.append(ToolUsageRecord(
                tool_name="get_all_memory",
                inputs={},
                success=False,
                output_summary=f"Failed to retrieve memories: {str(e)}"
            ))
            return f"Failed to retrieve memories: {str(e)}"
        
