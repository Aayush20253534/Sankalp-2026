from langchain_community.tools.tavily_search import TavilySearchResults
from dotenv import load_dotenv
load_dotenv()
search_tool = TavilySearchResults(k=1)

results = search_tool.run("best courses tutorials learn Python in 2025")
print(results)