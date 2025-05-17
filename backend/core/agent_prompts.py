"""Agent prompts and response handling for the chatbot"""
import asyncio
import sys
import os
from prompts.prompt_builder import build_full_prompt
from agents import Runner, RunConfig
from openai.types.responses import ResponseTextDeltaEvent
from models.models import ChatMessage, Mem0Context
from memory.redisCache import RedisCache
from memory.MongoDB import MongoDB
from settings.settings import MEMORY_Config as memory_config
from mem0 import Memory
from agents.agent import Agents

async def Streamed_agent_response(db: MongoDB, cache: RedisCache, context: Mem0Context, user_input: str):
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
        print(f"Starting Streamed_agent_response with input: {user_input}")
        agent = Agents()
        # Add the user message to the context
        user_message = ChatMessage(
            conversation_id=context.conversation_id,
            role="user",
            content=user_input,
        )
        memory = Memory.from_config(memory_config)

        # Add to Redis cache
        await cache.add_message(db, context.to_chat_session(), user_message)

        # Process the message (this would typically involve calling an LLM)
        # For now, we'll just echo the message back with a prefix
        history = await cache.get_chat_history(db, context.to_chat_session())
        if not history:
            history = await cache.load_from_db(context.to_chat_session(), db)

        memories = memory.search(
            query=user_input,
            user_id=context.user_id,
            agent_id=context.current_agent,
            run_id=context.session_id,
            limit=10
        )

        full_prompt = build_full_prompt(history, memories,context.conversation_id, user_input)
        print(f"Full prompt built: {full_prompt}")
        run_config = RunConfig(
                workflow_name="Memory Assistant Workflow",
                trace_metadata={"user_id": context.user_id}
            )

        # Yield a test message to verify streaming is working
        yield "Starting to process your message...\n"

        # Run the memory agent with the context
        print("Starting streamed run...")
        result = Runner.run_streamed(
            starting_agent=agent.memory_agent(),
            input=full_prompt,
            context=context,
            run_config=run_config
            )

        print("Stream run initiated, processing events...")
        response_text = ""
        async for event in result.stream_events():
            if event.type == "raw_response_event" and isinstance(event.data, ResponseTextDeltaEvent):
                response_text += event.data.delta
                yield event.data.delta
            else:
                print(f"Non-delta event received: {event.type}")

        print(f"Finished streaming, total response length: {len(response_text)}")

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

        # Yield a final message to indicate completion
        yield "\n(Response complete)"

    except Exception as e:
        error_msg = f"Error in Streamed_agent_response: {str(e)}"
        print(error_msg)
        import traceback
        traceback.print_exc()
        yield f"\nError: {error_msg}"
