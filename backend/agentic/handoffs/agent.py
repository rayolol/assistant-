"""Agents for the chatbot"""
from agents import (
    Agent,
    set_default_openai_api,
    set_default_openai_client,
    set_tracing_disabled,
    AsyncOpenAI,
    handoff,
    ModelSettings,
    RunContextWrapper
)
from pydantic import BaseModel
from settings.settings import Model, settings as S

import os
from ..tools.memory.default_tools import MemoryTools as MT, Mem0Context
from prompts import prompts as P
from dotenv import load_dotenv
import inspect

class HandoffInput(BaseModel):
    content: str

class Agents:
    """Agents for the chatbot"""
    def __init__(self):
        self.settings = ModelSettings(tool_choice = "auto", parallel_tool_calls = True)

        # Create a single shared instance of memory tools
        self.memory_tools = [
            MT.add_to_memory,
            MT.search_memory,
            MT.get_all_memory,
            MT.update_memory,
            MT.delete_memory
        ]

        # Initialize handoff functions first
        self._initialize_handoff_functions()

    def _initialize_handoff_functions(self):
        """Initialize handoff functions without creating agent instances"""
        # Create base agents first
        main_agent = Agent[Mem0Context](
            name="Main Memory Assistant",
            instructions=P.AGENT_DEFAULT_PROMPT,
            model=Model,
            tools=self.memory_tools,
            model_settings=self.settings
        )

        coding_agent = Agent[Mem0Context](
            name="Coding Assistant",
            instructions=P.CODING_AGENT_INSTRUCTIONS,
            model=Model,
            tools=self.memory_tools,
            model_settings=self.settings
        )

        tutor_agent = Agent[Mem0Context](
            name="Tutor Agent",
            instructions=P.TUTOR_AGENT_INSTRUCTIONS,
            model=Model,
            tools=self.memory_tools,
            model_settings=self.settings
        )

        # Create handoff functions
        self.back_to_main = handoff(
            agent=main_agent,
            tool_name_override="back_to_main",
            tool_description_override="Transfer back to the main Memory Assistant when the user asks implicitly about non-coding topics.",
            on_handoff=self.custom_on_handoff_Main,
            input_type=HandoffInput
        )

        self.coding_handoff = handoff(
            agent=coding_agent,
            tool_name_override="transfer_to_coding_assistant",
            tool_description_override="Transfer to the Coding Assistant when the user asks about coding, programming, or development.",
            on_handoff=self.custom_on_handoff_Coding,
            input_type=HandoffInput
        )

        self.tutor_handoff = handoff(
            agent=tutor_agent,
            tool_name_override="transfer_to_tutor_assistant",
            tool_description_override="Transfer to the Tutor Assistant when the user asks about tutoring.",
            on_handoff=self.custom_on_handoff_Tutor,
            input_type=HandoffInput
        )

        # Now update each agent with their respective handoffs
        main_agent.handoffs = [self.coding_handoff, self.tutor_handoff]
        coding_agent.handoffs = [self.back_to_main, self.tutor_handoff]
        tutor_agent.handoffs = [self.back_to_main, self.coding_handoff]

    def custom_on_handoff_Main(self, ctx: RunContextWrapper[Mem0Context], input_data: HandoffInput | None = None) -> str:
        """Custom on_handoff function for Main agent"""
        print("Handoff to Main agent:", input_data)
        ctx.context.previous_agent = ctx.context.current_agent
        ctx.context.current_agent = "main_agent"
        return input_data.content if input_data else "{}"

    def custom_on_handoff_Coding(self, ctx: RunContextWrapper[Mem0Context], input_data: HandoffInput | None = None) -> str:
        """Custom on_handoff function for Coding agent"""
        print("Handoff to Coding agent:", input_data)
        ctx.context.previous_agent = ctx.context.current_agent
        ctx.context.current_agent = "coding_agent"
        return input_data.content if input_data else "{}"

    def custom_on_handoff_Tutor(self, ctx: RunContextWrapper[Mem0Context], input_data: HandoffInput | None = None) -> str:
        """Custom on_handoff function for Tutor agent"""
        print("Handoff to Tutor agent:", input_data)
        ctx.context.previous_agent = ctx.context.current_agent
        ctx.context.current_agent = "tutor_agent"
        return input_data.content if input_data else "{}"

    def coding_agent(self) -> Agent[Mem0Context]:
        """Return the coding agent with handoffs"""
        return Agent[Mem0Context](
            instructions=P.CODING_AGENT_INSTRUCTIONS,
            name="Coding Assistant",
            model=Model,
            tools=self.memory_tools,
            handoffs=[self.back_to_main, self.tutor_handoff],
            model_settings=self.settings
        )

    def Main_agent(self) -> Agent[Mem0Context]:
        """Return the main memory agent with handoffs"""
        return Agent[Mem0Context](
            name="Main Memory Assistant",
            instructions=P.AGENT_DEFAULT_PROMPT,
            model=Model,
            tools=self.memory_tools,
            handoffs=[self.coding_handoff, self.tutor_handoff],
            model_settings=self.settings
        )

    def tutor_agent(self) -> Agent[Mem0Context]:
        """Return the tutor agent with handoffs"""
        return Agent[Mem0Context](
            name="Tutor Agent",
            instructions=P.TUTOR_AGENT_INSTRUCTIONS,
            model=Model,
            tools=self.memory_tools,
            handoffs=[self.back_to_main, self.coding_handoff],
            model_settings=self.settings
        )



