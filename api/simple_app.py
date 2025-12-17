from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Simple music theory class for basic functionality
class SimplifiedMusic:
    def __init__(self):
        self.tune = None
        self.notes = []
        self.chords = []
    
    def setTune(self, tune):
        self.tune = tune
        return self
    
    def setInterval(self, interval):
        return self
    
    def getNotesFromTune(self):
        # Simple major scale generation
        chromatic = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
        if self.tune in chromatic:
            start_index = chromatic.index(self.tune)
            major_intervals = [0, 2, 4, 5, 7, 9, 11]  # Major scale intervals
            self.notes = [chromatic[(start_index + interval) % 12] for interval in major_intervals]
        return self.notes
    
    def getChords(self):
        # Simple chord generation based on scale degrees
        if self.notes:
            chord_types = ['', 'm', 'm', '', '', 'm', 'dim']
            self.chords = [self.notes[i] + chord_types[i] for i in range(len(self.notes))]
        return self.chords
    
    def getBorrowedChords(self):
        # Simple borrowed chords
        if self.notes:
            return [note + 'm' if i in [0, 3, 4] else note + '' for i, note in enumerate(self.notes)]
        return []
    
    def getSeventhNoteToIt(self):
        # Simple secondary dominants
        if self.chords:
            chromatic = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
            sevenths = []
            for chord in self.chords:
                root = chord.replace('m', '').replace('dim', '') if chord else 'C'
                if root in chromatic:
                    root_index = chromatic.index(root)
                    fifth_down = chromatic[(root_index - 7) % 12]
                    sevenths.append(fifth_down + '7')
                else:
                    sevenths.append('C7')
            return sevenths
        return []
    
    def getChordProgressions(self):
        if self.chords and len(self.chords) >= 6:
            return {
                "I-V-vi-IV": [self.chords[0], self.chords[4], self.chords[5], self.chords[3]],
                "vi-IV-I-V": [self.chords[5], self.chords[3], self.chords[0], self.chords[4]], 
                "I-vi-ii-V": [self.chords[0], self.chords[5], self.chords[1], self.chords[4]],
                "I-IV-vi-V": [self.chords[0], self.chords[3], self.chords[5], self.chords[4]],
                "ii-V-I": [self.chords[1], self.chords[4], self.chords[0]]
            }
        return {}

# Initialize the music system
music = SimplifiedMusic()

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "mode": "simplified"})

@app.route('/api/scale/<key>', methods=['GET'])
def get_scale_analysis(key):
    """Get complete scale analysis for a given key"""
    try:
        # Set the tune
        music.setTune(key.upper())
        
        # Get all the musical data
        notes = music.getNotesFromTune()
        chords = music.getChords()
        borrowed_chords = music.getBorrowedChords()
        sevenths = music.getSeventhNoteToIt()
        progressions = music.getChordProgressions()
        
        # Format the response
        response = {
            "key": key.upper(),
            "scale_name": f"{key.upper()} Major Scale",
            "notes": notes,
            "chords": chords,
            "borrowed_chords": borrowed_chords,
            "secondary_dominants": sevenths,
            "chord_sevenths": [
                {"chord": chord, "resolves_from": seventh}
                for chord, seventh in zip(chords, sevenths)
            ],
            "progressions": progressions,
            "scale_degrees": [
                {
                    "degree": i + 1,
                    "roman": ["I", "ii", "iii", "IV", "V", "vi", "vii°"][i],
                    "note": notes[i],
                    "chord": chords[i],
                    "function": ["Tonic", "Supertonic", "Mediant", "Subdominant", 
                               "Dominant", "Submediant", "Leading Tone"][i]
                }
                for i in range(len(notes))
            ],
            "keyboard_data": {
                "white_keys": ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
                "black_keys": ['C#', 'D#', None, 'F#', 'G#', 'A#', None],
                "scale_notes": notes,
                "root_note": key.upper()
            },
            "fretboard_data": generate_fretboard_data(notes, key.upper())
        }
        
        return jsonify(response)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/chord-progressions/<key>', methods=['GET'])
def get_chord_progressions(key):
    """Get chord progressions for a specific key"""
    try:
        music.setTune(key.upper())
        music.getNotesFromTune()
        music.getChords()
        
        progressions = music.getChordProgressions()
        
        return jsonify({
            "key": key.upper(),
            "progressions": progressions
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/secondary-dominants/<key>', methods=['GET'])
def get_secondary_dominants(key):
    """Get secondary dominants for a specific key"""
    try:
        music.setTune(key.upper())
        music.getNotesFromTune()
        chords = music.getChords()
        sevenths = music.getSeventhNoteToIt()
        
        return jsonify({
            "key": key.upper(),
            "secondary_dominants": [
                {"target_chord": chord, "dominant_seventh": seventh}
                for chord, seventh in zip(chords, sevenths)
            ]
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def generate_fretboard_data(notes, root_note):
    """Generate fretboard data for React component"""
    # Guitar strings from 1st (high E) to 6th (low E) - CORRECT visual order for display
    # This is how they should appear from top to bottom on screen
    strings = ['E', 'B', 'G', 'D', 'A', 'E']  # 1st, 2nd, 3rd, 4th, 5th, 6th string
    chromatic_notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    frets = 12
    
    print(f"DEBUG: String order being used: {strings}")  # Debug output
    fretboard = []
    
    for string_note in strings:
        string_data = {
            "string": string_note,
            "frets": []
        }
        
        string_index = chromatic_notes.index(string_note)
        
        for fret in range(frets + 1):
            note_index = (string_index + fret) % 12
            current_note = chromatic_notes[note_index]
            
            fret_data = {
                "fret": fret,
                "note": current_note,
                "is_scale_note": current_note in notes,
                "is_root": current_note == root_note
            }
            
            string_data["frets"].append(fret_data)
        
        fretboard.append(string_data)
    
    return fretboard

@app.route('/api/keys', methods=['GET'])
def get_available_keys():
    """Get list of available keys"""
    keys = ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B']
    return jsonify({"keys": keys})

@app.route('/api/intervals', methods=['GET'])
def get_intervals():
    """Get list of available intervals"""
    intervals = [
        {"id": 1, "name": "major", "description": "Major scale intervals"},
        {"id": 2, "name": "minor", "description": "Minor scale intervals"},
        {"id": 3, "name": "dorian", "description": "Dorian mode intervals"},
        {"id": 4, "name": "mixolydian", "description": "Mixolydian mode intervals"}
    ]
    return jsonify({"intervals": intervals})

if __name__ == '__main__':
    print("🎵 Starting Music Theory API (Simplified Mode)...")
    print("🌐 Server running on http://localhost:5000")
    app.run(debug=False, host='0.0.0.0', port=5000)