"""Default tools for the agent"""
from agents import function_tool, RunContextWrapper
import traceback
from models import ToolUsageRecord, Mem0Context

memory = None

def set_memory(mem_instance):
    global memory
    memory = mem_instance
    
class DefaultToolBox:
    def __init__(self):
        
        pass
    
    def error_function_tool(): 
        return 
    
    
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
                    if entry.get("ref") == existing_memory_ref:
                        print(f"Found matching memory: {entry}")
                        found_memory = entry
                        break
                    
                if found_memory:
                    print(f"Updating memory: {entry['memory']} to {updated_content}")   
                    old_content = found_memory.get("memory", "")
                    memory_id = found_memory.get("id")
                    update_result = memory.update(memory_id, updated_content)
                    context.context.tool_usage_history.append(
                        ToolUsageRecord(
                                        tool_name="update_memory",
                                        inputs={"ref": existing_memory_ref, "content": updated_content},
                                        success=True,
                                        output_summary=f"Updated memory from '{old_content}' to '{updated_content}, {update_result}'")
                    )
                    if not memory_id:
                        return "Memory reference {existing_memory_ref} found but has no vaild id"
                   
                    return f"Successfully updated memory: '{entry['memory']}' to '{updated_content}'"
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
        Delete a memory from Mem0 using its reference number.
        
        Args:
            existing_memory_ref: The reference number (ref) of the memory to delete. Must be an integer.
        
        Returns:
            A confirmation message or error message.
        
        Example:
            delete_memory(1) - Deletes the memory with reference number 1
        """
        try:
            global memory
            if memory is None:
                return "Memory system not initialized"
            
            # Handle None or empty input
            if existing_memory_ref is None:
                return "Error: No memory reference provided. Please specify which memory to delete by its reference number."
            
            # Validate input - ensure it's an integer
            try:
                memory_ref = int(existing_memory_ref)
            except (TypeError, ValueError):
                return f"Error: '{existing_memory_ref}' is not a valid memory reference. Please provide a numeric reference number."
            
            print(f"Attempting to delete memory with ref: {memory_ref}")
            
            # Check if we have memories loaded
            if not context.context.recent_memories:
                return "No memories available to delete. Please use search_memory first to load memories."
            
            print(f"Available memories: {context.context.recent_memories}")
                
            # Find the memory with the matching reference number
            found_memory = None
            for entry in context.context.recent_memories:
                if entry.get("ref") == memory_ref:
                    found_memory = entry
                    break
                    
            if found_memory:
                memory_id = found_memory.get("id")
                memory_content = found_memory.get("memory", "Unknown content")
                
                if not memory_id:
                    return f"Memory reference {memory_ref} found but has no valid ID"
                    
                # Perform the deletion
                delete_result = memory.delete(memory_id)
                print(f"Delete result: {delete_result}")
                
                # Log the action
                context.context.tool_usage_history.append(
                    ToolUsageRecord(
                        tool_name="delete_memory", 
                        inputs={"ref": memory_ref},
                        success=True,
                        output_summary=f"Deleted memory: '{memory_content}'"
                    )
                )
                
                return f"Successfully deleted memory: '{memory_content}'"
            else:
                return f"No memory found with reference number {memory_ref}. Please use search_memory first to load memories."
        
        except Exception as e:
            print(f"Error in delete_memory: {e}")
            traceback.print_exc()
            
            # Safe handling for tool usage record
            safe_ref = str(existing_memory_ref) if existing_memory_ref is not None else "None"
            
            context.context.tool_usage_history.append(
                ToolUsageRecord(
                    tool_name="delete_memory", 
                    inputs={"ref": safe_ref},
                    success=False,
                    output_summary=f"Failed to delete memory: {str(e)}"
                )
            )
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
    
            memory_results = memory.add(messages,
                       user_id=context.context.user_id or "user",
                       agent_id = context.context.current_agent,
                       run_id = context.context.session_id, 
            )
            context.context.tool_usage_history.append(
                ToolUsageRecord(
                tool_name="add_to_memory",
                inputs={"content": content},
                success=True,
                output_summary=f"Stored message: {content}; Memory results: {memory_results}"
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
        
