from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import PydanticOutputParser
from ..tools import save_tool
from ..response.BasicAIResponse import BasicAIResponse

class ScalesBase:

    def __init__(self, llm):
        
        ## Setting up the output parser
        self.parser = PydanticOutputParser(pydantic_object=BasicAIResponse)

        ## storing llm
        self.llm = llm

        ## tools
        toolsToBind = [save_tool]

        ## Creating the prompt template
        self.prompt = ChatPromptTemplate.from_messages([
            (
                "system",
                """
                You are a music theory assistant.
                When asked about scales, respond with ONLY the note names separated by commas in the summary field.
                Do not include any descriptions, explanations, or additional text.
                
                For example:
                - For C major scale, summary should be: "C, D, E, F, G, A, B"
                - For G major scale, summary should be: "G, A, B, C, D, E, F#"
                
                The summary field must contain ONLY the comma-separated note names, nothing else.
                
                Wrap the output in the exact format specified here: {format_instructions}
                """
            ),
            ("human", "{query}"),
        ]).partial(format_instructions=self.parser.get_format_instructions())

        # Bind tools to the LLM
        llm_with_tools = self.llm.bind_tools(toolsToBind)

        # This will return a BasicAIResponse object directly
        self.structured_llm = llm_with_tools.with_structured_output(BasicAIResponse)

        # Create the chain properly
        self.chain = self.prompt | self.structured_llm

    ## Setting the note for the scale
    def setNote(self, note : str) -> None:
        self.note = note
        return self
        

    def getNotes(self, note: str = None) -> list[str]:

        try:
            
            # Use self.note if no note is passed, otherwise use the passed note
            if note is None:
                if hasattr(self, 'note'):
                    note = self.note
                else:
                    raise ValueError("No note specified. Either pass a note or use setNote() first.")
            
            query = "What is the " + note + " major scale? "

            print(f"Querying for scale notes: {query}")
            
            # This will return a BasicAIResponse object directly
            structured_response = self.chain.invoke({"query": query})

            ## Extracting the summary which contains the notes
            summary = structured_response.summary

            # print(f"Structured response: {structured_response}")
            print(f"Summary: {summary}")

            # Check if summary contains valid notes
            if not summary or summary.strip() == "":
                raise ValueError(f"Empty response received for {note} major scale")

            self.notes_array = [n.strip() for n in summary.split(",")]

            # Validate that we got actual notes (basic check)
            if len(self.notes_array) == 0:
                raise ValueError(f"No notes found in response: {summary}")

            return self.notes_array

        except ValueError as ve:
            print(f"ValueError: {ve}")
            return []
        except Exception as e:
            print(f"Unexpected error while getting notes for {note}: {e}")
            return []

    def getChords(self) -> list[str]:

        chords = []
        note_list = self.notes_array
        scale_intervals = ["", "m", "m", "", "", "m", "dim"]

        ## constructing chords based on the notes in the interval
        for i in range(len(note_list)):
            chords.append(note_list[i] + scale_intervals[i])

        return chords   

    # def getBorrowedNotes(self, note : str) -> list[str]:
    #     """Get borrowed notes for a given scale (to be implemented)"""
    #     pass