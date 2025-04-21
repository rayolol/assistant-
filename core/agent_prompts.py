"""Agent prompts and response handling for the chatbot"""
import asyncio
import sys
import os

# Add the parent directory to sys.path to allow imports from the root directory
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from agents import Runner, RunConfig
from models import ChatMessage, Mem0Context
from memory.redisCache import RedisCache
from memory.MongoDB import MongoDB
from MemoryConfig import config
from mem0 import Memory
from core.agent import Agents

# Initialize memory

async def agent_response(db: MongoDB, cache: RedisCache, context: Mem0Context, user_input: str) -> str:
    """
    Process a user message through the agent and return the response

    Args:
        db: MongoDB instance
        cache: RedisCache instance
        context: Mem0Context containing conversation context
        user_input: The user's message

    Returns:
        The agent's response as a string
    """
    try:
        agent = Agents()
        # Add the user message to the context
        user_message = ChatMessage(
            conversation_id=context.conversation_id,
            role="user",
            content=user_input,
        )
        memory = Memory.from_config(config)

        # Add to Redis cache
        await cache.add_message(db, context.to_chat_session(), user_message)

        # Process the message (this would typically involve calling an LLM)
        # For now, we'll just echo the message back with a prefix
        full_prompt = await build_full_prompt(memory, cache, db, context, user_input)
        print( full_prompt)

        run_config = RunConfig(
                workflow_name="Memory Assistant Workflow",
                trace_metadata={"user_id": context.user_id}
            )

        # Run the memory agent with the context
        result = await Runner.run(
            starting_agent=agent.memory_agent(),
            input=full_prompt,
            context=context,
            run_config=run_config
            )

        response_text = result.final_output if hasattr(result, 'final_output') else "No response generated."
        print("AI:", response_text)




        # Create the assistant's response
        assistant_message = ChatMessage(
            conversation_id=context.conversation_id,
            role="assistant",
            content=response_text,
        )

        # Add to Redis cache
        await cache.add_message(db, context.to_chat_session(), assistant_message)

        # Add both messages to the context's chat history
        context.chat_history.append(user_message)
        context.chat_history.append(assistant_message)

        return response_text

    except Exception as e:
        print(f"Error in agent_response: {e}")
        import traceback
        traceback.print_exc()
        return f"Sorry, I encountered an error: {str(e)}"



async def build_full_prompt(memory: Memory, cache: RedisCache, db: MongoDB, context: Mem0Context, user_input: str) -> str:
    """build the prompt of the assistant"""
    try:
        memories = memory.search(query = user_input,
                    user_id=context.user_id,
                    agent_id=context.current_agent,
                    run_id= context.session_id,
                    limit=10
                    )
        results = memories.get("results", [])
        memory_str = ''

        for memory in results:
            memory_str += f"Memory: {memory['memory']}\n"

        history = await cache.get_chat_history(db, context.to_chat_session())
        if not history:
            history = await cache.load_from_db(context.to_chat_session(), db)

        history_str = ''
        if history:
            for msg in history:
                if msg.conversation_id == context.conversation_id:
                    history_str += f"Role: {msg.role}\nContent: {msg.content}\n"


        full_prompt = f"""
        System:
        
        ##current user message:
            {user_input}
        ##recent conversation:
            {history_str if history_str else 'No conversation history yet.'}
        ##relevant memories:
            {memory_str if memory_str else 'No memories found.'}
        """

        # Make sure to return the full_prompt
        return full_prompt

    except Exception as e:
        print(f"Error in build_full_prompt: {e}")
        import traceback
        traceback.print_exc()
        return f"Sorry, I encountered an error: {str(e)}"
