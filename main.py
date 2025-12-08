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
        You are a research assistant that will help generate a research paper.
        Answer the user query and use necessary tools if needed. 
        Provide just the correct output without any commentary.
        For music theory questions, provide accurate information.
        """
    ),
    ("human", "{query}"),
])

## tools
tools = [search_tool, wiki_tool, save_tool]

# Create a simple chain instead of using deprecated AgentExecutor
# This is the updated approach for LangChain 1.1+
chain = prompt | llm

query = "What is the G major scale? Provide notes separated by commas."
## query = input("What can i help you research? ")
raw_response = chain.invoke({"query": query})

print(raw_response.content)

# output = raw_response.get("output")[0]["text"]

# print(output)

# # For structured output, you can use the parser if needed
# try:
#     structured_response = parser.parse(output)
#     print(structured_response)
# except Exception as e:
#     print("Error parsing response", e, "Raw Response - ", raw_response.content)

