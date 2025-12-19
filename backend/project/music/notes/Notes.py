class Notes():

    # Removing sharp from a note
    def removeSharp(self, note: str) -> str:
        if len(note) > 1 and note[1] == '#':
            return note[0]
        return note
    
    ## Sharpening a note
    def sharpenNote(self, note: str) -> str:
        if note == 'Bb':
            return 'B'
        elif note == 'Eb':
            return 'E'
        elif note == 'Ab':
            return 'A'
        elif note == 'Db':
            return 'D'
        elif note == 'Gb':
            return 'G'
        elif note == 'F':
            return 'F#'
        return note
    
    ## Flattening a note
    def flattenNote(self, note: str) -> str:
        if note == 'B':
            return 'Bb'
        elif note == 'E':
            return 'Eb'
        elif note == 'A':
            return 'Ab'
        elif note == 'D':
            return 'Db'
        elif note == 'G':
            return 'Gb'
        elif note == 'C':
            return 'Cb'
        elif note == 'F#':
            return 'F'
        return note
    
    ## Extract the root note from a chord (remove suffixes like 'm', 'dim')
    def extractRootNote(self, chord: str) -> str:
        
        # Handle sharp notes first
        if len(chord) > 1 and chord[1] == '#':
            return chord[:2]  # Return note with sharp (e.g., "F#")
        elif len(chord) > 1 and chord[1] == 'b':
            return chord[:2]  # Return note with flat (e.g., "Bb")
        else:
            return chord[0]   # Return just the root note (e.g., "G")
    