from agents import function_tool, RunContextWrapper
from models.models import ToolUsageRecord
from settings.settings import MEMORY_Config
from typing import List, Dict, Any
from pydantic import BaseModel
from mem0 import Memory
import traceback
import asyncio



class SearchTool: 
    