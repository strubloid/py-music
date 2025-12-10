from langchain_openai import ChatOpenAI
from .BasicAIResponse import BasicAIResponse
from .llm import LLM
from langchain_core.output_parsers import PydanticOutputParser
from .tools.tools import save_tool

class ChatGPT(LLM):

    ## Initializing the ChatGPT LLM class
    def __init__(self):

        ## Calling the parent constructor
        self.connect()

        ## Starting the parser
        self.startParser()

        ## Setting the tools
        self.setTools([save_tool])


    ## Connecting to the LLM service
    def connect(self):
        self.llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.7)

    ## Getting the LLM object
    def getLLM(self):
        return self.llm
    
    ## Setting the Parser
    def startParser(self):
        self.parser = PydanticOutputParser(pydantic_object=BasicAIResponse)

    ## Getting the parser
    def getParser(self):
        return self.parser
    
    ## Setting the tools
    def setTools(self, tools):
        self.tools = tools
    
    ## Binding the tools
    def startingChain(self, prompt:str) -> None:

        ## Creating the prompt template from a teacher prompt
        self.prompt = prompt.partial(
            format_instructions=self.parser.get_format_instructions()
        )

        # Bind tools to the LLM
        llm_with_tools = self.llm.bind_tools(self.tools)

        # This will return a BasicAIResponse object directly
        self.structured_llm = llm_with_tools.with_structured_output(BasicAIResponse)

        # Create the chain properly
        self.chain = self.prompt | self.structured_llm