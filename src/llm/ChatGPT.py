from langchain_openai import ChatOpenAI
from .llm import LLM

class ChatGPT(LLM):

    ## Initializing the ChatGPT LLM class
    def __init__(self):
        self.connect()

    ## Connecting to the LLM service
    def connect(self):
        self.llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.7)

    ## Getting the LLM object
    def getLLM(self):
        return self.llm