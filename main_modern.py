from dotenv import load_dotenv
from pydantic import BaseModel
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import PydanticOutputParser
from tools import search_tool, wiki_tool, save_tool

class ResearchResponse(BaseModel):
    topic: str
    summary: str
    sources: list[str]
    tools_used: list[str]

## Loading environment variables
load_dotenv()

## Setting up the language model
llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)

## Setting up the output parser
parser = PydanticOutputParser(pydantic_object=ResearchResponse)

## Creating the prompt template
prompt = ChatPromptTemplate.from_messages([
    (
        "system",
        """
        You are a research assistant that will help generate research responses.
        For music theory questions, provide accurate information.
        
        For the G major scale specifically:
        The G major scale contains the notes: G, A, B, C, D, E, F#
        This follows the pattern: Whole, Whole, Half, Whole, Whole, Whole, Half
        """
    ),
    ("human", "{query}"),
])

## tools available (can be manually called if needed)
tools = [search_tool, wiki_tool, save_tool]

def run_research_query(query: str):
    """Run a research query using simple chain approach"""
    # Create the chain
    chain = prompt | llm
    
    # Execute the query
    result = chain.invoke({"query": query})
    
    print("Research Response:")
    print(result.content)
    
    # Demonstrate tool usage if needed
    if "wikipedia" in query.lower():
        print("\n--- Using Wikipedia Tool ---")
        wiki_result = wiki_tool.invoke({"query": "G major scale"})
        print(f"Wikipedia result: {wiki_result[:200]}...")
    
    return result.content

if __name__ == "__main__":
    query = "What is the G major scale? Provide notes separated by commas."
    ## query = input("What can i help you research? ")
    
    result = run_research_query(query)