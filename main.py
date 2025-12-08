from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import PydanticOutputParser
from langchain.agents import create_tool_calling_agent, AgentExecutor
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

## Creating the prompt template for agents
prompt_template = ChatPromptTemplate.from_messages([
    ("system", """
    You are a research assistant that will help generate a research paper.
    Answer the user's question and format your response as JSON with the following structure:
    {format_instructions}
    
    You have access to the following tools: {tools}
    Use the following format:
    Question: the input question you must answer
    Thought: you should always think about what to do
    Action: the action to take, should be one of [{tool_names}]
    Action Input: the input to the action
    Observation: the result of the action
    ... (this Thought/Action/Action Input/Observation can repeat N times)
    Thought: I now know the final answer
    Final Answer: the final answer to the original input question formatted as JSON
    """),
    ("placeholder", "{chat_history}"),
    ("human", "{input}"),
    ("placeholder", "{agent_scratchpad}")
]).partial(format_instructions=parser.get_format_instructions())

# Define empty tools for now (you can add actual tools later)
tools = []

## Create the agent
agent = create_tool_calling_agent(
    llm=llm,
    tools=tools,
    prompt=prompt_template
)

## Create the agent executor with verbose=True
agent_executor = AgentExecutor(
    agent=agent,
    tools=tools,
    verbose=True,
    handle_parsing_errors=True,
    return_intermediate_steps=True
)

## Invoking the agent executor
response = agent_executor.invoke({
    "input": "What is the G major scale? Provide notes separated by commas."
})

## Printing the response
print("=== FINAL RESPONSE ===")
print(response)
