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
# prompt = ChatPromptTemplate.from_messages([
#     (
#         "system",
#         """
#        You are a music theory assistant.
#        When asked about scales, respond ONLY with the note names separated by commas.
#        Do not provide explanations, descriptions, or any other text.
#        Just return the notes like: C, D, E, F, G, A, B
#         """
#     ),
#     ("human", "{query}"),
# ])

prompt = ChatPromptTemplate.from_messages([
    (
        "system",
        """
        You are a music theory assistant.
        When asked about scales, respond ONLY with the note names separated by commas.
        Do not provide explanations, descriptions, or any other text.
        Just return the notes like: C, D, E, F, G, A, B
        
        Wrap the output in the exact format specified here: {format_instructions}
        """
    ),
    ("human", "{query}"),
]).partial(format_instructions=parser.get_format_instructions())

## tools
tools = [search_tool, wiki_tool, save_tool]

# Create a structured output chain
# This will return a ResearchResponse object directly
structured_llm = llm.with_structured_output(ResearchResponse)

# Create a simple chain instead of using deprecated AgentExecutor
# This is the updated approach for LangChain 1.1+
# chain = prompt | llm
chain = prompt | structured_llm

query = "What is the G major scale? "
## query = input("What can i help you research? ")

# This will return a ResearchResponse object directly
structured_response = chain.invoke({"query": query})

structured_response.summary
notes_array = [note.strip() for note in structured_response.summary.split(",")]
print(f"Notes array: {notes_array}")

# print(f"Type: {type(structured_response)}")
# print(f"Topic: {structured_response.topic}")
# print(f"{structured_response.summary}")
# print(f"Sources: {structured_response.sources}")
# print(f"Tools used: {structured_response.tools_used}")

# raw_response = chain.invoke({"query": query})
# print(f"Type: {type(raw_response)}")
# print(structured_response)



## Convert the response string into an array of notes
# notes_array = [note.strip() for note in raw_response.content.split(",")]
# print("Notes array:", notes_array)


# # For structured output, you can use the parser if needed
# try:
#     structured_response = parser.parse(output)
#     print(structured_response)
# except Exception as e:
#     print("Error parsing response", e, "Raw Response - ", raw_response.content)

