from abc import ABC, abstractmethod

class LLM(ABC):

    @abstractmethod
    def connect(self):
        """This will connect to the LLM service."""
        pass

    @abstractmethod
    def getLLM(self):
        """This will connect to the LLM service."""
        pass

    @abstractmethod
    def startParser(self):
        """This will start the Parser."""
        pass

    @abstractmethod
    def setTools(self):
        """This will set the tools."""
        pass
