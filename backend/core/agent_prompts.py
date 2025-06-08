"""Agent prompts and response handling for the chatbot"""
import asyncio
import sys
import os
import time
from typing import Any
from prompts.prompt_builder import build_full_prompt
from agents import Runner, RunConfig, Agent
from openai.types.responses import ResponseTextDeltaEvent
from models.models import Mem0Context
from memory.DB.schemas import ChatMessage
from memory.Cache.Redis.redisCache import RedisCache
from memory.DB.Mongo.MongoDB import MongoDB 
from settings.settings import MEMORY_Config as memory_config, Model
from mem0 import Memory
from agentic.handoffs.agent import Agents
from typing import Callable, Literal, Optional
from pydantic import BaseModel
from prompts.prompt_builder import format_prompt
import json


class Step(BaseModel):
    step_number: int
    step_description: str
    NextAgent: Literal["main_agent", "coding_agent", "tutor_agent", "none"]
class PlannerOutput(BaseModel):
    steps: list[Step]
    conversation_name: Optional[str] | None = None


async def Streamed_agent_response(memory: Memory, db: MongoDB, cache: RedisCache, context: Mem0Context, user_input: str, hooks: dict[str, Callable] | None = None):
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
        start = time.monotonic()
        print(f"before creating agents: ;{time.monotonic() - start}")
        agent = Agents(memory)
        print(f"after creating agents: ;{time.monotonic() - start}")
        print(f"before get_chat_history: ;{time.monotonic() - start}")
        history = await cache.get_chat_history(db, context.conversation_id, context.user_id)
        print(f"after get_chat_history: ;{time.monotonic() - start}")

        # Find the last assistant message in this conversation
        last_assistant_message = None
        if history and len(history) > 0:
            for msg in reversed(history):
                if (msg.role == "assistant" and 
                    str(msg.conversation_id) == str(context.conversation_id)):
                    last_assistant_message = msg
                    break

        print(f"after finding last assistant message: ;{time.monotonic() - start}")

        # Restore agent state from the last assistant message in this conversation
        if last_assistant_message and hasattr(last_assistant_message, 'metadata') and 'current_agent' in last_assistant_message.metadata:
            context.current_agent = last_assistant_message.metadata['current_agent']
            print(f"Restored previous agent state for conversation {context.conversation_id}: {context.current_agent}")
        else:
            # Only reset to main agent if this is a completely new conversation
            context.current_agent = "main_agent"
            print(f"Starting new conversation {context.conversation_id} with main agent")


        print(f"after restoring agent state: ;{time.monotonic() - start}")

        # Add the user message to the context
        user_message = ChatMessage(
            user_id=context.user_id,
            session_id=context.session_id,
            conversation_id=context.conversation_id,
            role="user",
            content=user_input,
            metadata={"current_agent": context.current_agent}  # Store current agent in user message too
        )
        # Add to Redis cache
        await cache.add_message(db, conversation_id=context.conversation_id , user_id=context.user_id, session_id=context.session_id, message= user_message)
        print(f"after adding user message to cache: ;{time.monotonic() - start}")
        userdescription = await db.prompt_settings.get_by_user_id(context.user_id)

        print(f"after getting user description: ;{time.monotonic() - start}")

        if context.current_agent == "tutor_agent":
            starting_agent = agent.tutor_agent(instructions=userdescription.__str__())
        elif context.current_agent == "coding_agent":
            starting_agent = agent.coding_agent(instructions=userdescription.__str__())
        else:
            starting_agent = agent.Main_agent(instructions=userdescription.__str__())

        print(f"after creating starting agent: ;{time.monotonic() - start}")
        memories = asyncio.to_thread(
            memory.search,
            query=user_input,
            user_id=context.user_id,
            agent_id=context.current_agent,
            run_id=context.session_id,
            limit=10
        )

        print(f"after getting memories: ;{time.monotonic() - start}")
        full_prompt = build_full_prompt(history, memories,context.conversation_id, user_input, userdescription.__str__())
        formatted_prompt = format_prompt(full_prompt)
        print(f"Full prompt built: {full_prompt.__str__()}")
        run_config = RunConfig(
                workflow_name="Memory Assistant Workflow",
                trace_metadata={"user_id": context.user_id}
            )
        
        print(f"after creating run config: ;{time.monotonic() - start}")
        
        yield f"data: {json.dumps({"event": "planning"})}\n\n"
        planner_prompt = await Runner.run(
            starting_agent=Agent[Mem0Context](
                name="Planner Agent",
                instructions="""You are a planner agent. You are responsible for planning the response of the agent.
                                You will be given a conversation history and a user message.
                                You will need to plan the next step for the agent.
                                You will need to decide which agent to handoff to.
                                You will need to decide which handoff to use.
                                you will need to decide the name of the conversation. if not clear set none
                """,
                model=Model,
                output_type=PlannerOutput
            ),
            input=formatted_prompt,
            context=context,
            run_config=run_config,
            hooks=hooks if hooks else None
        )
        yield f"data: {json.dumps({"event": "done planning"})}\n\n"

        print(f"Planner prompt: {formatted_prompt + planner_prompt.__str__()}")

        print("Starting streamed run...")
        result = Runner.run_streamed(
            starting_agent=starting_agent,
            input=formatted_prompt + planner_prompt.__str__(),
            context=context,
            run_config=run_config,
            hooks=hooks if hooks else None
            )

        print("Stream run initiated, processing events...")
        response_text = ""
        async for event in result.stream_events():
            if event.type == "raw_response_event" and isinstance(event.data, ResponseTextDeltaEvent):
                chunk = event.data.delta  # may contain "\n"
                response_text += chunk     # if you still need to build the full response
                yield f"data: {json.dumps({"chunk": chunk})}\n\n"
            

        print(f"Finished streaming, total response length: {len(response_text)}")
        

        # Create the assistant's response
        assistant_message = ChatMessage(
            user_id=context.user_id,
            session_id=context.session_id,
            conversation_id=context.conversation_id,
            role="assistant",
            content=response_text,
            metadata={"current_agent": context.current_agent}  # Store current agent in metadata
        )
        print(f"Assistant: {context.current_agent}")

        print(f"Assistant message: {assistant_message.__str__()}")

        # Add to Redis cache
        await cache.add_message(db, conversation_id=context.conversation_id , user_id=context.user_id, session_id=context.session_id, message= assistant_message)

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


def format_sse(data: Any, event: str = None):
    msg = ""
    if event:
        msg += f"event: {event}\n"
    msg += f"data: {json.dumps(data)}\n\n"
    return msg
