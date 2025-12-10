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
