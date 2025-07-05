import requests 
import json


API_KEY = "sk-e2c8216edd6945be907260a07fc3cccf"

def websearch(query: str, count: int = 10):
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
            res = resp.json()
            print(json.dumps(res, indent=4))

            return resp.json()
        except Exception as e:
            print("error in websearch tool",e)
            return {"error": "search tool unavailable"}


print(websearch(query="image of the christ statue in brazil", count=1))