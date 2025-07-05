from typing import Dict, Any
from pydantic import BaseModel
from agents import function_tool, Agent, Runner, RunContextWrapper
from memory.DB.schemas import ChatMessage
from settings.settings import Model
from typing import List, Literal, Optional
from models.models import Mem0Context
import time
import json
import traceback


#TODO: refactor this to be a base class for all tools
class Step(BaseModel):
    step_number: int
    step_description: str
    tool_calls: List[str] | None = None
    NextAgent: Literal["main_agent", "coding_agent", "tutor_agent", "none"]
class PlannerOutput(BaseModel):
    steps: list[Step]
    conversation_name: Optional[str] | None = None

#TODO: make a base Class for all tool (singleton approach)



class BaseTool():
    def __init__(self, tools: List, agents: List):
        BaseTool.tools = tools
        BaseTool.agents = agents
    
    async def execute(self, **kwargs) -> Dict[str, Any]:
        """Execute the tool"""
        raise NotImplementedError
    
    
    @function_tool(description_override="This tool is used to wait for a user feedback. It will send a message to the user and wait for a response. It will return the response to the agent. It will also add the message to the chat history. It will also add the message to the chat history.")
    async def wait_for_user_feedback(context: RunContextWrapper[Mem0Context], message: str | None = None):
            try:
                timer = time.monotonic()
                timeout = 300
                Websocket = context.context._websocket
                endtime = timer + timeout
                if not Websocket:
                    raise RuntimeError("Websocket not found in context")
                
                await Websocket.send_text(json.dumps({
                    "conversation_id": context.context.conversation_id,
                    "type": "event",
                    "event": "wait_for_user",
                    "content": message
                }))
                await Websocket.send_text(json.dumps({
                    "conversation_id": context.context.conversation_id,
                    "type": "chunk",
                    "data": {
                        "chunk": f"\n\n:::event\n{{'title'=\"wait_for_user\", 'content'=\"{message}\"}}\n:::\n\n"
                    }
                }))
                
                while time.monotonic() < endtime:
                    data = await Websocket.receive_text()
                    message_data = json.loads(data)
                    if message_data.get("type") == "user_feedback":
                        message = message_data.get("message")
                        print("submitted message")
                    
                        await context.context._appContext.chatService.add_message(ChatMessage(
                            user_id=context.context.user_id,
                            conversation_id=context.context.conversation_id,
                            session_id=context.context.session_id,
                            role= "system",
                            content= message,
                            metadata={
                                "type" : "event",
                                "event": "wait_for_user",
                                "outcome": "success"
                                }
                            ))
                        print("put the message in chatHistory")
                        
                        return message


                print("timeout execeded")
                await context.context._websocket.send_text(json.dumps({
                    "conversation_id": context.context.conversation_id,
                    "type": "event",
                    "event": "wait_for_user",
                    "content": "timeout (300 seconds)"
                }))
                
                if await context.context._appContext.chatService.add_message(ChatMessage(
                            user_id=context.context.user_id,
                            conversation_id=context.context.conversation_id,
                            session_id=context.context.session_id,
                            role= "system",
                            content= message,
                            metadata={
                                "type" : "event",
                                "event": "wait_for_user",
                                "content": "timeout (300 seconds)"
                                }
                            )):
                    print("stored event feedback")
                return "system: timout execeded continue the task"
            except Exception as e: 
                traceback.print_exc()
                print("error in user Feedback: ", e)
                return "system: wait for user feedback tool failed"
                
    
    @function_tool
    async def planner(context: RunContextWrapper[Mem0Context], goal: str, additionnal_context: str = None,) -> PlannerOutput:
        """
        Create a detailed plan to achieve a given goal by breaking it down into actionable steps.
        
        This function uses an AI planner agent to analyze the goal and create a structured plan
        that specifies which tools and agents should be used for each step of the process.
        
        Args:
            context (RunContextWrapper[Mem0Context]): The execution context containing memory 
                and runtime information for the planning process.
            goal (str): The main objective or goal to be achieved. This should be a clear, 
                descriptive statement of what needs to be accomplished.
            additionnal_context (str, optional): Additional context or constraints that should 
                be considered during planning. Defaults to None.
                
        Returns:
            PlannerOutput: A structured plan containing:
                - steps: List of Step objects, each with step_number, step_description, 
                  tool_calls, and NextAgent
                - conversation_name: Optional name for the conversation (can be None)
            
        Note:
            The planner agent has access to the tools and agents defined in BaseTool.tools 
            and BaseTool.agents class variables, which are set during BaseTool initialization.
        """
        try: 
            await context.context._websocket.send_text(json.dumps({
                    "conversation_id": context.context.conversation_id,
                    "type": "event",
                    "event": "planner",
                    "content": "planner started"
                }))
            print ("planner started")
            plan =  await Runner.run(
                starting_agent=Agent[Mem0Context](
                    name="Planner Agent",
                    instructions=f"""You are a planner agent. You are responsible for planning the response of the agent.
                                        you will need to breakdown complex goals into steps using tools and agents
                                        here are the tools: {BaseTool.tools}
                                        here are the available agents: {BaseTool.agents}
                                        
                                        """,
                    model=Model,
                    output_type=PlannerOutput
                ),
                input=goal + additionnal_context,
                context=context
            )      
            print ("planner ouput", plan)

            await context.context._websocket.send_text(json.dumps({
                    "conversation_id": context.context.conversation_id,
                    "type": "event",
                    "event": "planner",
                    "content": "planner finished"
                }))
            print ("sent websocket")
            if await context.context._appContext.chatService.add_message(ChatMessage(
                            user_id=context.context.user_id,
                            conversation_id=context.context.conversation_id,
                            session_id=context.context.session_id,
                            role= "system",
                            content= plan.__str__(),
                            metadata={
                                "type" : "event",
                                "event": "planner",
                                "content": "planner finished"
                                }
                            )):
                print("stored event planner")

            return plan
        except Exception as e:
            traceback.print_exc()
            print (e)
            return "system: planner failed"
