from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import PydanticOutputParser
from pydantic import BaseModel

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
prompt_template = ChatPromptTemplate.from_messages([
    ("system", """
    You are a research assistant that will help generate a research paper.
    Answer the user's question and format your response as JSON with the following structure:
    {format_instructions}
    """),
    ("human", "{query}")
]).partial(format_instructions=parser.get_format_instructions())

## Create a chain with the custom prompt
chain = prompt_template | llm | parser

## Invoking the chain
response = chain.invoke({
    "query": "What is the G major scale? Provide notes separated by commas."
})

## Printing the response
print(response)
