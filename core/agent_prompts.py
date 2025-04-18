"""Agent prompts and response handling for the chatbot"""
import asyncio
from models import ChatMessage, Mem0Context
from memory.redisCache import RedisCache
from memory.MongoDB import MongoDB
from MemoryConfig import config
from mem0 import Memory

# Initialize memory
memory = Memory.from_config(config)

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
        # Add the user message to the context
        user_message = ChatMessage(
            conversation_id=context.conversation_id,
            role="user",
            content=user_input,
        )

        # Add to Redis cache
        await cache.add_message(db, context.to_chat_session(), user_message)

        # Process the message (this would typically involve calling an LLM)
        # For now, we'll just echo the message back with a prefix
        response_text = f"I received your message: {user_input}"

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
