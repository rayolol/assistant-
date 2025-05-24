"""Agent prompts and response handling for the chatbot"""
import asyncio
import sys
import os
from prompts.prompt_builder import build_full_prompt
from agents import Runner, RunConfig, Agent
from openai.types.responses import ResponseTextDeltaEvent
from models.models import ChatMessage, Mem0Context
from memory.redisCache import RedisCache
from memory.MongoDB import MongoDB 
from settings.settings import MEMORY_Config as memory_config, Model
from mem0 import Memory
from agentic.handoffs.agent import Agents
from typing import Callable, Literal
from pydantic import BaseModel


class Step(BaseModel):
    step_number: int
    step_description: str
    NextAgent: Literal["main_agent", "coding_agent", "tutor_agent", "none"]
class PlannerOutput(BaseModel):
    steps: list[Step]


async def Streamed_agent_response(db: MongoDB, cache: RedisCache, context: Mem0Context, user_input: str, hooks: dict[str, Callable] | None = None):
    """
    Process a user message through the agent and return the response

    Args:
        db: MongoDB instance
        cache: RedisCache instance
        context: Mem0Context containing conversation context
        user_input: The user's message
        hooks: Optional dictionary of event type to handler function mappings

    Returns:
        The agent's response as a string
    """
    try:
        print(f"Starting Streamed_agent_response with input: {user_input}")
        agent = Agents()
        
        history = await cache.get_chat_history(db, context.to_chat_session())
        if not history:
            history = await cache.load_from_db(context.to_chat_session(), db)

        # Find the last assistant message in this conversation
        last_assistant_message = None
        if history and len(history) > 0:
            for msg in reversed(history):
                if (msg.role == "assistant" and 
                    str(msg.conversation_id) == str(context.conversation_id)):
                    last_assistant_message = msg
                    break

        # Restore agent state from the last assistant message in this conversation
        if last_assistant_message and hasattr(last_assistant_message, 'metadata') and 'current_agent' in last_assistant_message.metadata:
            context.current_agent = last_assistant_message.metadata['current_agent']
            print(f"Restored previous agent state for conversation {context.conversation_id}: {context.current_agent}")
        else:
            # Only reset to main agent if this is a completely new conversation
            context.current_agent = "main_agent"
            print(f"Starting new conversation {context.conversation_id} with main agent")

        # Add the user message to the context
        user_message = ChatMessage(
            conversation_id=context.conversation_id,
            role="user",
            content=user_input,
            metadata={"current_agent": context.current_agent}  # Store current agent in user message too
        )
        memory = Memory.from_config(memory_config)

        # Add to Redis cache
        await cache.add_message(db, context.to_chat_session(), user_message)

        if context.current_agent == "tutor_agent":
            starting_agent = agent.tutor_agent()
        elif context.current_agent == "coding_agent":
            starting_agent = agent.coding_agent()
        else:
            starting_agent = agent.Main_agent()

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
        planner_prompt = await Runner.run(
            starting_agent=Agent[Mem0Context](
                name="Planner Agent",
                instructions="""You are a planner agent. You are responsible for planning the response of the agent.
                                You will be given a conversation history and a user message.
                                You will need to plan the next step for the agent.
                                You will need to decide which agent to handoff to.
                                You will need to decide which handoff to use.
                """,
                model=Model,
                output_type=PlannerOutput
            ),
            input=full_prompt,
            context=context,
            run_config=run_config,
            hooks=hooks if hooks else None
        )


        # Yield a test message to verify streaming is working
        yield "Starting to process your message...\n"
        print(f"Planner prompt: {planner_prompt.__str__()}")

        # Run the memory agent with the context
        print("Starting streamed run...")
        result = Runner.run_streamed(
            starting_agent=starting_agent,
            input=full_prompt + "\n System: " + planner_prompt.__str__(),
            context=context,
            run_config=run_config,
            hooks=hooks if hooks else None
            )

        print("Stream run initiated, processing events...")
        response_text = ""
        async for event in result.stream_events():
            if event.type == "raw_response_event" and isinstance(event.data, ResponseTextDeltaEvent):
                response_text += event.data.delta
                yield f"data: {event.data.delta}\n\n"
            elif event.type == "agent_updated_stream_event":
                yield f"data: <Switching to {event.new_agent.name}>\n\n"
            elif event.type == "run_item_stream_event":
                yield f"data: <{event.item.type}>\n\n"
            

        print(f"Finished streaming, total response length: {len(response_text)}")

        # Create the assistant's response
        assistant_message = ChatMessage(
            conversation_id=context.conversation_id,
            role="assistant",
            content=response_text,
            metadata={"current_agent": context.current_agent}  # Store current agent in metadata
        )
        print(f"Assistant: {context.current_agent}")

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
