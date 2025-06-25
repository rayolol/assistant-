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

from settings.settings import MEMORY_Config as memory_config, Model
from typing import Callable, Literal, Optional
from pydantic import BaseModel
from prompts.prompt_builder import format_prompt
from services.uploadFileService import uploadService
from modules.prompt_preprocessor import PromptBuilder

import json
from core.Multimodal import build_multimodal_input
from prompts.prompt_builder import PromptStructure
from services.appContext import AppContext



class Step(BaseModel):
    step_number: int
    step_description: str
    NextAgent: Literal["main_agent", "coding_agent", "tutor_agent", "none"]
class PlannerOutput(BaseModel):
    steps: list[Step]
    conversation_name: Optional[str] | None = None

class PromptInput(BaseModel):
    planner: PlannerOutput | None = None
    is_multimodal: bool
    context: PromptStructure


async def Streamed_agent_response(app_context: AppContext, context: Mem0Context, user_input: str, hooks: dict[str, Callable] | None = None):
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
        
        # Find the last assistant message in this conversation
        print("starting streaming")
        history = await app_context.chatService.load_chat_history(context.conversation_id, context.user_id)
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
            user_id=context.user_id,
            session_id=context.session_id,
            conversation_id=context.conversation_id,
            role="user",
            file_id=context.file_id,
            content=user_input,
            metadata={"current_agent": context.current_agent}  # Store current agent in user message too
        )
        # Add to Redis cache
        new_message = await app_context.chatService.add_message(user_message)
        if context.file_id:
            try:
                await app_context.uploadService.finalize_upload(
                    context.user_id,
                    context.conversation_id,
                    new_message.id,
                    context.file_id
                    )
            except Exception as e:
                print("error while finalizing upload: ", e)

        userdescription = await app_context.userService.get_user_prompt_settings(context.user_id)

        starting_agent = agent_selector(context.current_agent, app_context.agents, userdescription)

        memories = await asyncio.to_thread(
            app_context.memory.search,
            query=user_input,
            user_id=context.user_id,
            agent_id=context.current_agent,
            run_id=context.session_id,
            limit=10
        )

        full_prompt = build_full_prompt(history, memories,context.conversation_id, user_input, userdescription.__str__())
        formatted_prompt = format_prompt(full_prompt)
        process = PromptBuilder() 
        process.add_system(formatted_prompt)


        if context.file_id:
            await process.add_image_from_disk(user_input, context.file_id, app_context.uploadService, detail="auto")
        else: 
            process.add_text(user_input)



        full_prompt = process.build()
        run_config = RunConfig(
                workflow_name="Memory Assistant Workflow",
                trace_metadata={"user_id": context.user_id}
            )
                
        print("Starting streamed run...")
        result = Runner.run_streamed(
            starting_agent=starting_agent,
            input= full_prompt,
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

        await app_context.chatService.add_message(assistant_message)

        yield "\n(Response complete)"

    except Exception as e:
        error_msg = f"Error in Streamed_agent_response: {str(e)}"
        print(error_msg)
        import traceback
        traceback.print_exc()
        yield f"\nError: {error_msg}"


async def planner(context: Mem0Context, user_message: str, hasAttachment: bool = False):
    return await Runner.run(
        starting_agent=Agent[Mem0Context](
            name="Planner Agent",
            instructions="""You are a planner agent. You are responsible for planning the response of the agent.
                                You will have to make sure the agent doesn't repeat itself when talking to the user.
                                You will be given a conversation history and a user message.
                                You will need to plan the next step for the agent.
                                You will need to decide which agent to hand off to.
                                You will need to decide which handoff to use.
                                You will need to decide the name of the conversation. If not clear, set none.
                """,
            model=Model,
            output_type=PlannerOutput
        ),
        input=user_message + f"\n user uploaded attachment ",
        context=context
    )       


def agent_selector(current_agent:str, agent, userdescription):
    if current_agent == "tutor_agent":
        return agent.tutor_agent(instructions=userdescription.__str__())
    elif current_agent == "coding_agent":
        return agent.coding_agent(instructions=userdescription.__str__())
    else:
        return agent.Main_agent(instructions=userdescription.__str__())



def format_sse(data: Any, event: str = None):
    msg = ""
    if event:
        msg += f"event: {event}\n"
    msg += f"data: {json.dumps(data)}\n\n"
    return msg
