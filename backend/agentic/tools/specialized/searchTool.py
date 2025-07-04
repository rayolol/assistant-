from agents import function_tool, RunContextWrapper
from models.models import ToolUsageRecord
from models.models import Mem0Context
from settings.settings import MEMORY_Config
from typing import List, Dict, Any
from pydantic import BaseModel
from mem0 import Memory
import requests 
import traceback
import asyncio


API_KEY = "sk-e2c8216edd6945be907260a07fc3cccf"
class SearchTool: 
    def __init__(self): 
        pass

    @staticmethod
    @function_tool
    def websearch(context: RunContextWrapper[Mem0Context], query: str, count: int = 2):
        """
        Perform a web search using the LangSearch API.

        Args:
            context (RunContextWrapper[Mem0Context]): The execution context for the tool, including memory and runtime information.
            query (str): The search query string to look up on the web.
            count (int, optional): The maximum number of search results to return. Defaults to 10.

        Returns:
            dict: The JSON response from the LangSearch API containing search results, or an error message if the search fails.

        Example:
            results = SearchTool.websearch(context, "latest AI research", count=5)
        """
        try: 
            print("searching web with query:", query)
            url = "https://api.langsearch.com/v1/web-search"
            headers = {
                "Authorization": f"Bearer {API_KEY}",
                "Content-Type": "application/json"
            }
            payload = {
                "query": query,
                "freshness": "noLimit",
                "summary": True,
                "count": count
            }

            resp = requests.post(url, headers=headers, json= payload)
            resp.raise_for_status()
            print(resp.json())

            return resp.json()
        except Exception as e:
            print("error in websearch tool",e)
            return {"error": "search tool unavailable"}
