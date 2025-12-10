
from .intervals.Major import MajorInterval

class ChordsTeacher():

    def __init__(self, llm):

        ## getting the llm reference
        self.llm = llm
    
    # Getting notes from a tune
    def getChords(self, notes: list[str]) -> list[str]:
        try:

            ## what we will be returning
            chords = []

            ## loading the interval
            scale_intervals = MajorInterval().interval

            ## notes size
            notesSize = len(notes)

            ## Looping through notes
            for i in range(notesSize):
                ## validating index to avoid overflow
                if i < len(scale_intervals):
                    chords.append(notes[i] + scale_intervals[i])
                else:
                    break

            return chords

        except Exception as e:
            print(f"Unexpected error while getting notes for {notes}: {e}")
            return []