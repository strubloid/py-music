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

        ## Use comprehensive scale definitions with proper enharmonic equivalents
        self.notes = self._getScaleNotes(self.tune, interval_type)

        return self.notes
    
    def _getScaleNotes(self, tune: str, interval_type: str) -> list[str]:
        """Get scale notes with comprehensive definitions and proper enharmonic equivalents"""
        
        # Define proper scales with sharps and flats for each key
        major_scales = {
            "C": ["C", "D", "E", "F", "G", "A", "B"],
            "G": ["G", "A", "B", "C", "D", "E", "F#"],
            "D": ["D", "E", "F#", "G", "A", "B", "C#"],
            "A": ["A", "B", "C#", "D", "E", "F#", "G#"],
            "E": ["E", "F#", "G#", "A", "B", "C#", "D#"],
            "B": ["B", "C#", "D#", "E", "F#", "G#", "A#"],
            "F#": ["F#", "G#", "A#", "B", "C#", "D#", "F"],
            "C#": ["C#", "D#", "F", "F#", "G#", "A#", "C"],  # E#→F, B#→C
            "F": ["F", "G", "A", "Bb", "C", "D", "E"],
            "Bb": ["Bb", "C", "D", "Eb", "F", "G", "A"],
            "Eb": ["Eb", "F", "G", "Ab", "Bb", "C", "D"],
            "Ab": ["Ab", "Bb", "C", "Db", "Eb", "F", "G"],
            "Db": ["Db", "Eb", "F", "Gb", "Ab", "Bb", "C"],
            "Gb": ["Gb", "Ab", "Bb", "B", "Db", "Eb", "F"],  # Cb→B
            # Sharp key variants using actual chromatic notes
            "G#": ["G#", "A#", "C", "C#", "D#", "F", "F#"],  # B#→C, E#→F
            "D#": ["D#", "F", "F#", "G#", "A#", "C", "C#"],  # E#→F, B#→C
            "A#": ["A#", "C", "C#", "D#", "F", "F#", "G#"],  # B#→C, E#→F
        }
        
        minor_scales = {
            "C": ["C", "D", "D#", "F", "G", "G#", "A#"],  # Eb→D#, Ab→G#, Bb→A#
            "G": ["G", "A", "A#", "C", "D", "D#", "F"],   # Bb→A#, Eb→D#
            "D": ["D", "E", "F", "G", "A", "A#", "C"],    # Bb→A#
            "A": ["A", "B", "C", "D", "E", "F", "G"],
            "E": ["E", "F#", "G", "A", "B", "C", "D"],
            "B": ["B", "C#", "D", "E", "F#", "G", "A"],
            "F#": ["F#", "G#", "A", "B", "C#", "D", "E"],
            "C#": ["C#", "D#", "E", "F#", "G#", "A", "B"],
            "G#": ["G#", "A#", "B", "C#", "D#", "E", "F#"],
            "D#": ["D#", "F", "F#", "G#", "A#", "B", "C#"],  # E#→F
            "A#": ["A#", "C", "C#", "D#", "F", "F#", "G#"],  # B#→C, E#→F
            "F": ["F", "G", "G#", "A#", "C", "C#", "D#"],    # Ab→G#, Bb→A#, Db→C#, Eb→D#
            # Flat keys converted to sharp equivalents
            "A#": ["A#", "C", "C#", "D#", "F", "F#", "G#"],  # Bb minor → A# minor
            "D#": ["D#", "F", "F#", "G#", "A#", "B", "C#"],  # Eb minor → D# minor  
            "G#": ["G#", "A#", "B", "C#", "D#", "E", "F#"],  # Ab minor → G# minor
            "C#": ["C#", "D#", "E", "F#", "G#", "A", "B"],   # Db minor → C# minor
            "F#": ["F#", "G#", "A", "B", "C#", "D", "E"]     # Gb minor → F# minor
        }
        
        if interval_type == 'major':
            return major_scales.get(tune, major_scales["C"])
        else:  # minor
            return minor_scales.get(tune, minor_scales["C"])

    ## Getting notes from scale
    def getChords(self) -> list[str]:

        ## Use improved chord generation based on scale degrees and interval type
        if self.notes:
            interval_type = 'major'  # default
            if hasattr(self.interval_obj, '__class__'):
                if 'Minor' in self.interval_obj.__class__.__name__:
                    interval_type = 'minor'
            
            if interval_type == 'major':
                chord_types = ['', 'm', 'm', '', '', 'm', 'dim']  # Major scale triads: I ii iii IV V vi vii°
            else:  # minor (natural minor)
                chord_types = ['m', 'dim', '', 'm', 'm', '', '']  # Natural minor triads: i ii° III iv v VI VII
            
            self.chords = [self.notes[i] + chord_types[i] for i in range(len(self.notes))]
        else:
            # Fallback to chordsTeacher if no notes available
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
        
        # Calculate secondary dominants using 3-steps-back rule in the actual scale
        sevenths_and_targets = []
        
        # Generate secondary dominants for ALL scale degrees (I through vii)
        for i, chord in enumerate(self.chords):
            # Special case: vii° (diminished 7th degree) resolves to V chord
            if i == 6:  # 7th degree (0-indexed)
                dominant_index = 4  # V chord (5th degree, 0-indexed as 4)
            else:
                # Regular pattern: count 3 steps back in this scale
                dominant_index = (i - 3 + 7) % 7  # Add 7 to handle negative indices
            
            dominant_note = self.notes[dominant_index]
            
            sevenths_and_targets.append({
                "seventh": f"{dominant_note}7",
                "resolves_to": chord  # Use full chord name (Am, Bm, Em, F#dim)
            })
        
        return sevenths_and_targets
    
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
        

