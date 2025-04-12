import sys
from mem0 import Memory
import os
import asyncio
from datetime import datetime
from typing import List, Dict, Any
from agents import (
    Runner,
    RunConfig,
) 
from agent import Agents as At
from agents import RunContextWrapper
import default_tools as DT
import json 
import prompts as P
# Remove colorama imports and initialization
import traceback
from dotenv import load_dotenv

if not load_dotenv():
    print("Failed to load environment variables from .env file.")
    sys.exit(1)

# Remove colorama init and deinit calls

API_KEY = os.getenv("API_KEY")
MODEL_NAME = os.getenv("MODEL_NAME")
BASE_URL = os.getenv("BASE_URL")

print(MODEL_NAME, BASE_URL)


#load user.json & config.json
try: 
    with open("MemoryConfig.json", "r") as f:
        if not f: 
            raise FileNotFoundError("config.json not found")
        config = json.load(f)
        
    with open("user.json", "r") as f:
        if not f: 
            raise FileNotFoundError("user.json not found")
        user_description = json.load(f)
        
except Exception as e:
    print(f"Error loading user.json: {e}")
    user_description = {}
        

# Initialize memory
try:
    memory = Memory.from_config(config)
    print("Memory initialized successfully")
    
    DT.set_memory(memory)
except Exception as e:
    print(f"Error initializing memory: {e}")
    traceback.print_exc()
    memory = None

# Add conversation history list
conversation_history = []
MAX_HISTORY_LENGTH = 10  # Adjust as needed

def build_system_prompt(context: DT.Mem0Context, user_message: str) -> str:
    """
    Retrieve relevant memories from mem0 for the given query
    and return a system prompt string to provide context.
    """
    try:
        if not memory:
            return "Memory system unavailable."
            
        search_result = memory.search(
            query=user_message,
            user_id=context.user_id,
            agent_id=context.current_agent,
            run_id=context.session_id,
            limit=10)
        if not search_result or "results" not in search_result:
            return "No relevant memories found."
            
        memories = search_result.get("results", [])
        if not memories:
            return "No relevant memories found."
        
        context_memory = []
        memories_str = ""
        for i, entry in enumerate(memories):
            if isinstance(entry, dict) and "memory" in entry:
                memories_str += f"ref: {i + 1};\n memory: {entry['memory']};\n\n"
                context_memory.append({"ref": i + 1, "id": entry['id'], "memory": entry['memory']})
        
        print(context_memory.__str__())
        context.recent_memories = context_memory
            
                
        history_str = ""
        if context.chat_history:
            for entry in context.chat_history:
                if len(entry) == 0:
                    print("no coneverstation yet")
                history_str += f"role: {entry.role}\ncontent: {entry.content}\n"
        
        system_prompt = f"Recent conversation:\n{history_str}\n\nRelevant memories:\n{memories_str}"
        return system_prompt
    except Exception as e:
        print(f"Error in build_system_prompt: {e}")
        traceback.print_exc()
        return "Error retrieving memories."


    
async def main():
    agents = At()
    
    print("Memory Assistant initialized. Type 'exit' or 'quit' to end the conversation.")
    print("Type 'history' to see conversation history.")

    # Create a persistent context for the session
    context = DT.Mem0Context(
        user_id="user",
        session_id="1234567890",
        session_start_time=datetime.now(),
        conversation_id="1234567890",
        current_agent="memory_agent"
    )

    while True:
        try:
            user_input = input("You: ")
            if user_input.lower().strip() in ["exit", "quit"]:
                break
            elif user_input.lower() == "history":
                print_conversation_history(context.chat_history)
                continue
                
            # Get system prompt with relevant memories
            try:
                full_prompt = build_system_prompt(context=context, user_message=user_input)
                print("System prompt:", full_prompt)
            except Exception as e:
                print(f"Error building system prompt: {e}")
                full_prompt = user_input
            
            # Run the agent with proper context
            try:
                # Create a run config
                run_config = RunConfig(
                    workflow_name="Memory Assistant Workflow",
                    trace_metadata={"user_id": context.user_id}
                )
                
                
                # Run the memory agent with the context
                result = await Runner.run(
                    starting_agent=agents.memory_agent(),
                    input=user_input,
                    context=context,
                    run_config=run_config
                )
                
                response_text = result.final_output if hasattr(result, 'final_output') else "No response generated."
                print("AI:", response_text)
                
                # Add to conversation history in context
                context.add_to_history(user_input, response_text)
                
            except Exception as e:
                print(f"Error during agent run: {e}")
                traceback.print_exc()
                response_text = "Sorry, I encountered an error processing your request."
                print("AI:", response_text)
                
        except KeyboardInterrupt:
            print("\nExiting...")
            break
        except Exception as e:
            print(f"Unexpected error: {e}")
            traceback.print_exc()

def print_conversation_history(history: List[DT.ChatMessage]) -> None:
    """Display the conversation history in a readable format"""
    if not history:
        print("No conversation history yet.")
        return
    
    print("\n===== CONVERSATION HISTORY =====")
    for i, entry in enumerate(history):
        time_str = entry.timestamp.strftime("%H:%M:%S")
        print(f"[{time_str}]")
        print(f"You: {entry.user}")
        print(f"AI: {entry.assistant}")
        if i < len(history) - 1:
            print("-" * 30)
    print("================================\n")

if __name__ == "__main__":
    asyncio.run(main())


