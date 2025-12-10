from .scales.ScalesTeacher import ScalesTeacher
from langchain_core.prompts import ChatPromptTemplate
from .chords.Chords import ChordsTeacher
from .chords.intervals.Major import MajorInterval
from .chords.intervals.Interval import Interval

""" 
    Class that will contain things related to music 
    such as scales, chords, progressions, etc. 
"""
class Music:

    def __init__(self, llm):

        # Starting the llm object that we will be using for music-related tasks
        self.llm = llm

        ## starting the tune variable
        self.tune = None

        # Starting notes array
        self.notes = []

        # Starting chords array
        self.chords = []

        ## loading a basic major interval by default
        self.interval = MajorInterval().interval

        ## starting scale teacher object
        self.scaleTeacher = ScalesTeacher(llm)

        ## starting chords teacher object
        self.chordsTeacher = ChordsTeacher(llm)

        ## Setting the prompt template from the scale teacher
        self.prompt = ChatPromptTemplate.from_messages(
            self.scaleTeacher.getPrompt()
        ).partial(
            format_instructions=self.llm.getParser().get_format_instructions()
        )

        ## binding tools to llm
        self.llm.startingChain(self.prompt)
    
    ## Sets the interval
    def setInterval(self, interval: Interval) -> None:
        self.interval = interval
        return self

    """ 
        This method will set the tune, the base of our research begins here,
        after the main note, we can derive scalles, chords, progressions, borrowed chords, etc.
    """
    def setTune(self, tune: str) -> None:
        self.tune = tune
        return self
    
    ## Getting notes from scale
    def getNotesFromTune(self) -> list[str]:

        ## loading the variable at music class level
        self.notes = self.scaleTeacher.getNotesFromTune(self.tune)

        return self.notes

    ## Getting notes from scale
    def getChords(self) -> list[str]:

        ## getting chords based on the notes we have
        self.chords = self.chordsTeacher.getChords(self.notes)

        return self.chords
    
    ## Getting borrowed chords from parallel minor scale
    def getBorrowedChords(self) -> list[str]:
        
        ## getting borrowed chords from parallel minor scale
        borrowedChords = self.scaleTeacher.getBorrowedChords(self.chords, self.interval)

        return borrowedChords
    
