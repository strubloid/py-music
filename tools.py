"""
Tools for the research assistant
"""

from langchain_core.tools import tool
from langchain_community.tools import WikipediaQueryRun
from langchain_community.utilities import WikipediaAPIWrapper
import json
import os

@tool
def search_tool(query: str) -> str:
    """Search for information using a basic search functionality."""
    # This is a placeholder implementation
    return f"Search results for: {query}. This is a basic search tool implementation."

# Wikipedia tool using LangChain's built-in Wikipedia integration
wikipedia = WikipediaQueryRun(api_wrapper=WikipediaAPIWrapper())

@tool 
def wiki_tool(query: str) -> str:
    """Search Wikipedia for information."""
    try:
        result = wikipedia.run(query)
        return result
    except Exception as e:
        return f"Error searching Wikipedia: {str(e)}"

@tool
def save_tool(content: str, filename: str = "research_output.txt") -> str:
    """Save content to a file."""
    try:
        # Create a research_outputs directory if it doesn't exist
        os.makedirs("research_outputs", exist_ok=True)
        filepath = os.path.join("research_outputs", filename)
        
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)
        
        return f"Content successfully saved to {filepath}"
    except Exception as e:
        return f"Error saving file: {str(e)}"