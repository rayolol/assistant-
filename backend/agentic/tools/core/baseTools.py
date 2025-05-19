from typing import Dict, Any
from pydantic import BaseModel

class BaseTool(BaseModel):
    """Base class for all tools"""
    name: str
    description: str
    enabled: bool = True
    
    async def execute(self, **kwargs) -> Dict[str, Any]:
        """Execute the tool"""
        raise NotImplementedError
