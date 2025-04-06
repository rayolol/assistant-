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
import default_tools as DT
import json 
import prompts as P
from colorama import init
import traceback

# Disable colorama to avoid Windows handle errors
os.environ["NO_COLOR"] = "1"
init(autoreset=True, convert=False)

API_KEY = os.getenv("API_KEY")
MODEL_NAME = os.getenv("MODEL_NAME")
BASE_URL = os.getenv("BASE_URL")
os.environ["TOGETHER_API_KEY"] ="dc28e010b5bec5dd6f4ec88878e0cd1edb52f3d6efe132892333f2bb835ef935"


#load user.json & config.json
try: 
    with open("config.json", "r") as f:
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

def build_system_prompt(user_message: str, user_id: str = "user") -> str:
    """
    Retrieve relevant memories from mem0 for the given query
    and return a system prompt string to provide context.
    """
    try:
        if not memory:
            return "Memory system unavailable."
            
        search_result = memory.search(query=user_message, user_id=user_id, limit=10)
        if not search_result or "results" not in search_result:
            return "No relevant memories found."
            
        memories = search_result.get("results", [])
        if not memories:
            return "No relevant memories found."
            
        memories_str = ""
        for entry in memories:
            if isinstance(entry, dict) and "memory" in entry:
                memories_str += f"- {entry['memory']}\n id: {entry['id']}\n\n"
                
        history_str = ""
        if conversation_history:
            last_entries = conversation_history[-3:] if len(conversation_history) > 3 else conversation_history
            for entry in last_entries:
                history_str += f"User: {entry['user']}\nAssistant: {entry['assistant']}\n"
        
        system_prompt = f"Recent conversation:\n{history_str}\n\nRelevant memories:\n{memories_str}"
        return system_prompt
    except Exception as e:
        print(f"Error in build_system_prompt: {e}")
        traceback.print_exc()
        return "Error retrieving memories."


    
async def main():
    global conversation_history
    conversation_history = []
    agents = At()
    
    print("Memory Assistant initialized. Type 'exit' or 'quit' to end the conversation.")
    print("Type 'history' to see conversation history.")

    while True:
        try:
            user_input = input("You: ")
            if user_input.lower() in ["exit", "quit"]:
                break
            elif user_input.lower() == "history":
                print_conversation_history()
                continue
            
            # Get system prompt with relevant memories
            try:
                full_prompt = build_system_prompt(user_input, user_id="user")
                print("System prompt:", full_prompt)
            except Exception as e:
                print(f"Error building system prompt: {e}")
                full_prompt = user_input
            
            # Create context object with user_id
            context = DT.Mem0Context(user_id="user")
            
            # Run the agent with proper context
            try:
                # Create a run config to ensure consistent settings across handoffs
                run_config = RunConfig(
                    workflow_name="Memory Assistant Workflow",
                    trace_metadata={"user_id": "user"}
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
            except Exception as e:
                print(f"Error during agent run: {e}")
                traceback.print_exc()
                response_text = "Sorry, I encountered an error processing your request."
                print("AI:", response_text)
            
            # Add to conversation history
            entry = {
                "timestamp": datetime.now(),
                "user": user_input,
                "assistant": response_text
            }
            add_to_history(entry)

                
        except KeyboardInterrupt:
            print("\nExiting...")
            break
        except Exception as e:
            print(f"Unexpected error: {e}")
            traceback.print_exc()

def add_to_history(entry: Dict[str, Any]) -> None:
    """Add an entry to conversation history and maintain max length"""
    global conversation_history
    conversation_history.append(entry)
    # Keep only the most recent conversations
    if len(conversation_history) > MAX_HISTORY_LENGTH:
        conversation_history = conversation_history[-MAX_HISTORY_LENGTH:]

def print_conversation_history() -> None:
    """Display the conversation history in a readable format"""
    if not conversation_history:
        print("No conversation history yet.")
        return
    
    print("\n===== CONVERSATION HISTORY =====")
    for i, entry in enumerate(conversation_history):
        time_str = entry["timestamp"].strftime("%H:%M:%S")
        print(f"[{time_str}]")
        print(f"You: {entry['user']}")
        print(f"AI: {entry['assistant']}")
        if i < len(conversation_history) - 1:
            print("-" * 30)
    print("================================\n")

if __name__ == "__main__":
    asyncio.run(main())


