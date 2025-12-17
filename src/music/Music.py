from .scales.ScalesTeacher import ScalesTeacher
from langchain_core.prompts import ChatPromptTemplate
from .chords.Chords import ChordsTeacher
from .chords.intervals.Major import MajorInterval
from .chords.intervals.Interval import Interval
from .visualization.ScaleVisualizer import ScaleVisualizer

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
        default_interval = MajorInterval()
        self.interval_obj = default_interval
        self.interval = default_interval.interval

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
        self.interval_obj = interval  # Store the interval object
        self.interval = interval.interval  # Store the interval array for compatibility
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
        
        ## Determine interval type from the interval object
        interval_type = 'major'  # default
        if hasattr(self.interval_obj, '__class__'):
            if 'Minor' in self.interval_obj.__class__.__name__:
                interval_type = 'minor'
            elif 'Major' in self.interval_obj.__class__.__name__:
                interval_type = 'major'

        ## loading the variable at music class level
        self.notes = self.scaleTeacher.getNotesFromTune(self.tune, interval_type)

        return self.notes

    ## Getting notes from scale
    def getChords(self) -> list[str]:

        ## getting chords based on the notes we have
        self.chords = self.chordsTeacher.getChords(self.notes)

        return self.chords
    
    ## Getting borrowed chords from parallel minor scale
    def getBorrowedChords(self) -> list[str]:
        
        ## getting borrowed chords from parallel minor scale
        borrowedChords = self.scaleTeacher.getBorrowedChords(self.chords, self.interval_obj)

        return borrowedChords
    
    def getSeventhNoteToIt(self, chord_index: int = None) -> list[str] | str:
        """
        Gets the dominant seventh chord that resolves TO each chord in the current key.
        This returns secondary dominants (V7/x chords).
        If chord_index is provided, returns the seventh that goes to that specific chord.
        """
        if not self.chords or not self.notes:
            raise ValueError("Please generate chords first using getChords()")
        
        # Chromatic circle for calculating fifths
        chromatic_notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
        
        def getSeventhToNote(target_note: str) -> str:
            """Helper function to get the dominant 7th that resolves to a target note"""
            # Clean the note (remove chord suffixes like 'm', 'dim')
            clean_note = target_note
            if len(target_note) > 1:
                if target_note[1] in ['#', 'b']:
                    clean_note = target_note[:2]  # Keep sharp/flat
                else:
                    clean_note = target_note[0]   # Remove suffix
            
            # Handle flats by converting to sharps for easier calculation
            note_map = {
                'Bb': 'A#', 'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#'
            }
            if clean_note in note_map:
                clean_note = note_map[clean_note]
            
            # Find the note in chromatic circle
            if clean_note in chromatic_notes:
                target_index = chromatic_notes.index(clean_note)
                # Go back 7 semitones (perfect fifth down) to find the dominant
                dominant_index = (target_index - 7) % 12
                dominant_note = chromatic_notes[dominant_index]
                return f"{dominant_note}7"
            
            return f"{clean_note}7"  # Fallback
        
        if chord_index is not None:
            # Return seventh that goes to specific chord
            if 0 <= chord_index < len(self.chords):
                target_chord = self.chords[chord_index]
                return getSeventhToNote(target_chord)
            else:
                raise IndexError("Chord index out of range")
        
        # Return all sevenths that go to each chord
        seventh_chords = []
        for chord in self.chords:
            seventh_chords.append(getSeventhToNote(chord))
        
        return seventh_chords
    
    # Add these methods to expand musical functionality
    def getChordProgressions(self) -> dict[str, list[str]]:
        """
        Returns common chord progressions in the current key
        """
        if not self.chords:
            raise ValueError("Please generate chords first using getChords()")
        
        progressions = {
            "I-V-vi-IV": [self.chords[0], self.chords[4], self.chords[5], self.chords[3]],
            "vi-IV-I-V": [self.chords[5], self.chords[3], self.chords[0], self.chords[4]], 
            "I-vi-ii-V": [self.chords[0], self.chords[5], self.chords[1], self.chords[4]],
            "I-IV-vi-V": [self.chords[0], self.chords[3], self.chords[5], self.chords[4]],
            "ii-V-I": [self.chords[1], self.chords[4], self.chords[0]]
        }
        
        return progressions

    # Helper method to convert scale degree to Roman numeral
    def _getRomanNumeral(self, degree: int) -> str:

        roman_numerals = ["I", "ii", "iii", "IV", "V", "vi", "vii°"]
        return roman_numerals[degree] if degree < len(roman_numerals) else str(degree + 1)

    # Returns available tensions for a given chord
    def getTensions(self, chord_index: int) -> list[str]:

        if chord_index >= len(self.chords):
            raise IndexError("Chord index out of range")
        
        # Common tensions by scale degree
        tensions_map = {
            0: ["9", "11", "13"],      # I maj7
            1: ["9", "11", "13"],      # ii m7  
            2: ["11", "13"],           # iii m7
            3: ["9", "11", "13"],      # IV maj7
            4: ["9", "13"],            # V7 (avoid 11)
            5: ["9", "11"],            # vi m7
            6: ["11", "b13"]           # vii m7b5
        }
        
        return tensions_map.get(chord_index, [])

    # Display a comprehensive visual representation of the current scale.
    # Shows piano keyboard, scale degrees, circle of fifths, and guitar fretboard.
    def getScale(self, interval) -> None:  
        
        if not self.notes or not self.chords:
            print("Please generate notes and chords first using getNotesFromTune() and getChords()")
            return
        
        # Get secondary dominants
        sevenths = self.getSeventhNoteToIt()
        
        # Create visualizer and display complete analysis
        visualizer = ScaleVisualizer()
        scale_name = f"{self.tune} Major Scale"
        
        visualizer.display_fretboard(self.notes, self.tune)
        

