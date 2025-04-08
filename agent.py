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


import os
from default_tools import DefaultToolBox as DT, Mem0Context
import prompts as P
from dotenv import load_dotenv

class Agents:
    """Agents for the chatbot"""
    def __init__(self):
        load_dotenv()
        self.MODEL_NAME = os.getenv("MODEL_NAME") or ""
        self.API_KEY = os.getenv("API_KEY") or ""
        self.BASE_URL = os.getenv("BASE_URL") or ""
        if not self.MODEL_NAME or not self.API_KEY or not self.BASE_URL:
            raise ValueError("MODEL_NAME, API_KEY, and BASE_URL must be set in the environment variables.")
        self.client = AsyncOpenAI(base_url=self.BASE_URL, api_key=self.API_KEY)
        set_default_openai_client(client=self.client, use_for_tracing=False)
        set_default_openai_api("chat_completions")
        set_tracing_disabled(disabled=True)
        self.settings = ModelSettings(tool_choice = "auto", parallel_tool_calls = True)
        
        self.agent_tools = [DT.add_to_memory, DT.search_memory, DT.get_all_memory, DT.update_memory, DT.delete_memory]
        
        self.back_to_main = None
        self.tutor_handoff = None
        self.coding_handoff = None
        
        # Initialize handoff functions first without agent instances.
        self._initialize_handoff_functions()
    
    def _initialize_handoff_functions(self):
        """Initialize handoff functions without creating agent instances"""
        # Create handoff functions with lazy agent resolution
        self.back_to_main = handoff(
            agent= Agent[Mem0Context](
               name="Main Memory Assistant",
               instructions=P.AGENT_DEFAULT_PROMPT,
               model=self.MODEL_NAME,
               tools=[],
               handoffs=[],
               model_settings=self.settings
           ), 
            tool_name_override="back_to_main",
            tool_description_override="Transfer back to the main Memory Assistant when the user asks implicitly about non-coding topics.",
            on_handoff=self.custom_on_handoff,
            input_type=str
        )
        
        self.tutor_handoff = handoff(
            agent= Agent[Mem0Context](
               name="Tutor Agent",
               instructions=P.TUTOR_AGENT_INSTRUCTIONS,
               model=self.MODEL_NAME,
               tools=[],
               handoffs=[],
               model_settings=self.settings
           ), 
            tool_name_override="transfer_to_tutor_assistant",
            tool_description_override="Transfer to the Tutor Assistant when the user asks about tutoring.",
            on_handoff=self.custom_on_handoff,
            input_type=str
        )
        
        self.coding_handoff = handoff(
            agent=Agent[Mem0Context](
               instructions=P.CODING_AGENT_INSTRUCTIONS,
               name="Coding Assistant",
               model=self.MODEL_NAME,
               tools=[],
               handoffs=[],
               model_settings=self.settings
           ),
            tool_name_override="transfer_to_coding_assistant",
            tool_description_override="Transfer to the Coding Assistant when the user asks about coding, programming, or development.",
            on_handoff=self.custom_on_handoff,
            input_type=str
        )

    def custom_on_handoff(self, ctx: RunContextWrapper, input_data: str | None = None) -> str:
        # If no input data is provided, return an empty JSON object.
        return input_data if input_data else "{}"


    def coding_agent(self) -> Agent[Mem0Context]:
        """Coding agent with handoffs"""
        # Check if handoffs are initialized
        if self.back_to_main is None or self.tutor_handoff is None:
            raise ValueError("Handoffs must be initialized before calling coding_agent()")

        return Agent[Mem0Context](
               instructions=P.CODING_AGENT_INSTRUCTIONS,
               name="Coding Assistant",
               model=self.MODEL_NAME,
               tools= [DT.add_to_memory, DT.search_memory, DT.get_all_memory, DT.update_memory, DT.delete_memory],
               handoffs=[self.back_to_main, self.tutor_handoff],
               model_settings=self.settings
           )

    def memory_agent(self) ->  Agent[Mem0Context]:
        """Main memory agent with handoffs"""
        # Check if handoffs are initialized
        if self.coding_handoff is None or self.tutor_handoff is None:
            raise ValueError("Handoffs must be initialized before calling memory_agent()")

        return Agent[Mem0Context](
               name="Main Memory Assistant",
               instructions=P.AGENT_DEFAULT_PROMPT,
               model=self.MODEL_NAME,
               tools= [DT.add_to_memory, DT.search_memory, DT.get_all_memory, DT.update_memory, DT.delete_memory],
               handoffs=[self.coding_handoff, self.tutor_handoff],
               model_settings=self.settings
           )

    def tutor_agent(self) -> Agent[Mem0Context]:
        """Tutor agent with handoffs"""
        # Check if handoffs are initialized
        if self.back_to_main is None or self.coding_handoff is None:
            raise ValueError("Handoffs must be initialized before calling tutor_agent()")

        return Agent[Mem0Context](
            name="Tutor Agent",
            instructions=P.TUTOR_AGENT_INSTRUCTIONS,
            model=self.MODEL_NAME,
            tools= [DT.add_to_memory, DT.search_memory, DT.get_all_memory, DT.update_memory, DT.delete_memory],
            handoffs=[self.back_to_main, self.coding_handoff],
            model_settings=self.settings
        )



