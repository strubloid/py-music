from ..notes.Notes import Notes
from ..chords.intervals import Interval
from ..chords.intervals.Major import MajorInterval
from ..chords.intervals.Minor import MinorInterval

class ScalesTeacher():

    def __init__(self, llm):

        ## getting the llm reference
        self.llm = llm

        ## starting notes array
        self.notes_array = []

        ## This is the way the teacher works
        self.prompt = [
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
        ]
    
    ## This will get the basic template of how the teacher works
    def getPrompt(self):
        return self.prompt
    
    # Getting notes from a tune
    def getNotesFromTune(self, tune: str = None) -> list[str]:
        try:

            ## Basic validation
            if tune is None:
                raise ValueError("Please provide a tune")
            
            ## TODO: Later add the major, minor, modal scales, etc.
            query = "What is the " + tune + " major scale? "

            # This will return a BasicAIResponse object directly
            structured_response = self.llm.chain.invoke({"query": query})

            ## Extracting the summary which contains the notes
            summary = structured_response.summary

            # Check if summary contains valid notes
            if not summary or summary.strip() == "":
                raise ValueError(f"Empty response received getNotesFromTune")
            
            ## Splitting the notes into an array
            self.notes_array = [n.strip() for n in summary.split(",")]

            return self.notes_array

        except ValueError as ve:
            print(f"ValueError: {ve}")
            return []
        except Exception as e:
            print(f"Unexpected error while getting notes for {tune}: {e}")
            return []
        
    ## Getting borrowed chords from tune, notes and chords
    def getBorrowedChords(self, chords: list[str], interval: Interval) -> list[str]:
        try:
            ## Basic validation
            if chords is None or len(chords) == 0:
                raise ValueError("Missing or empty chords!")
            if interval is None:
                raise ValueError("Missing interval!")
            
            ## loading notes object
            notesObject = Notes()
            borrowedChords = []
            intervalPatternToRun = None  # Initialize outside match
            
            ## Loading the interval pattern to run based on current interval
            match interval:
                case MajorInterval():
                    ## In the major interval we will run to get the minor
                    minor_interval = MinorInterval()
                    intervalPatternToRun = minor_interval.interval
                    # print("Getting borrowed chords from parallel minor scale...")

                case MinorInterval():
                    ## In the minor interval we will run to get the major
                    major_interval = MajorInterval()
                    intervalPatternToRun = major_interval.interval
                    # print("Getting borrowed chords from parallel major scale...")
                
                case _:  # Default case
                    raise ValueError(f"Unsupported interval type: {type(interval)}")
            
            # Validate intervalPatternToRun
            if intervalPatternToRun is None:
                raise ValueError("Failed to load interval pattern")
            
            if len(intervalPatternToRun) == 0:
                raise ValueError("Interval pattern is empty")

            # Ensure we don't exceed array bounds
            max_iterations = min(len(chords), len(intervalPatternToRun))

            # Looping through chords
            for i in range(max_iterations):
                chordToCheck = chords[i]

                ## getting the root note
                rootNote = notesObject.extractRootNote(chordToCheck)
                
                if rootNote is None or rootNote == "":
                    print(f"Warning: Could not extract root note from chord: {chordToCheck}")
                    continue
            
                ## Checking if is a major or minor scale
                match interval:
                    case MajorInterval():
                        # Major to Minor: flatten certain degrees 
                        if i == 2: # Third degree (B → Bb) 
                            rootNote = notesObject.flattenNote(rootNote) 
                        elif i == 5: # Sixth degree (E → Eb) 
                            rootNote = notesObject.flattenNote(rootNote) 
                        elif i == 6: # Seventh degree (F# → F) 
                            rootNote = notesObject.removeSharp(rootNote)

                    case MinorInterval():
                        if i == 2: # Third degree (Bb → B) 
                            rootNote = notesObject.sharpenNote(rootNote) 
                        elif i == 5: # Sixth degree (Eb → E) 
                            rootNote = notesObject.sharpenNote(rootNote) 
                        elif i == 6: # Seventh degree (F → F#) 
                            rootNote = notesObject.sharpenNote(rootNote)

                # Validate before appending
                chord_suffix = intervalPatternToRun[i]
                if chord_suffix is None:
                    chord_suffix = ""  # Default to empty string if None
                    
                # Appending the borrowed chord
                borrowedChords.append(rootNote + chord_suffix)

            return borrowedChords

        except ValueError as ve:
            print(f"ValueError: {ve}")
            return []
        except IndexError as ie:
            print(f"IndexError: {ie} - Array bounds exceeded")
            return []
        except Exception as e:
            print(f"Unexpected error while getting borrowed chords: {e}")
            return []
