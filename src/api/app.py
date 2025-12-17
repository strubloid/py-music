from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
import sys
import os

# Add the parent directory to sys.path so we can import from src
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))

from src.music.chords.intervals.Major import MajorInterval
from src.music.chords.intervals.Minor import MinorInterval
from src.llm.ChatGPT import ChatGPT
from src.music.Music import Music

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Initialize the music system like in main.py
llm = None
try:
    print("🔄 Initializing LLM...")
    llm = ChatGPT()
    print("✅ LLM initialized successfully")
except Exception as e:
    print(f"⚠️  LLM initialization failed: {e}. Using simplified mode.")
    llm = None

# Available interval types
INTERVALS = {
    'major': MajorInterval,
    'minor': MinorInterval
}

def get_roman_numeral(degree, interval_type):
    """Get Roman numeral based on degree and interval type"""
    if interval_type == 'major':
        roman_numerals = ["I", "ii", "iii", "IV", "V", "vi", "vii°"]
    else:  # minor
        roman_numerals = ["i", "ii°", "III", "iv", "v", "VI", "VII"]
    
    return roman_numerals[degree] if degree < len(roman_numerals) else str(degree + 1)

def get_function_name(degree):
    """Get function name for scale degree"""
    functions = ["Tonic", "Supertonic", "Mediant", "Subdominant", 
                "Dominant", "Submediant", "Leading Tone"]
    return functions[degree] if degree < len(functions) else "Extended"

# Simple music theory class for basic functionality (fallback)
class SimplifiedMusic:
    def __init__(self):
        self.tune = None
        self.notes = []
        self.chords = []
        self.interval_type = 'major'
    
    def setTune(self, tune):
        self.tune = tune
        return self
    
    def setInterval(self, interval):
        # Detect interval type from class name or use major as default
        if hasattr(interval, '__class__'):
            self.interval_type = 'minor' if 'Minor' in interval.__class__.__name__ else 'major'
        else:
            # If it's just a string, use it directly
            self.interval_type = str(interval).lower()
        return self
    
    def getNotesFromTune(self):
        # Generate scale based on interval type
        chromatic = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
        if self.tune in chromatic:
            start_index = chromatic.index(self.tune)
            if self.interval_type == 'major':
                scale_intervals = [0, 2, 4, 5, 7, 9, 11]  # Major scale intervals (W-W-H-W-W-W-H)
            else:  # minor (natural minor)
                scale_intervals = [0, 2, 3, 5, 7, 8, 10]  # Natural minor scale intervals (W-H-W-W-H-W-W)
            self.notes = [chromatic[(start_index + interval) % 12] for interval in scale_intervals]
        return self.notes
    
    def getChords(self):
        # Simple chord generation based on scale degrees and interval type
        if self.notes:
            if self.interval_type == 'major':
                chord_types = ['', 'm', 'm', '', '', 'm', 'dim']  # Major scale triads: I ii iii IV V vi vii°
            else:  # minor (natural minor)
                chord_types = ['m', 'dim', '', 'm', 'm', '', '']  # Natural minor triads: i ii° III iv v VI VII
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

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy", 
        "llm_available": llm is not None,
        "intervals_available": list(INTERVALS.keys())
    })

@app.route('/api/intervals', methods=['GET'])
def get_available_intervals():
    """Get list of available intervals"""
    return jsonify({
        "intervals": [
            {"key": "major", "name": "Major"},
            {"key": "minor", "name": "Minor"}
        ]
    })

@app.route('/api/music-config', methods=['GET'])
def get_music_config():
    """Get music display configuration for consistent UI rendering"""
    return jsonify({
        "guitarStringOrder": ["E", "A", "D", "G", "B", "E"],  # Low to High (6th to 1st string)
        "pianoKeyOrder": ["C", "D", "E", "F", "G", "A", "B"],
        "blackKeyOrder": ["C#", "D#", "F#", "G#", "A#"],
        "chordDisplayOrder": "ascending",  # or 'descending'
        "noteNamingConvention": "sharp",  # or 'flat'
        "fretboardDirection": "leftToRight"  # or 'rightToLeft'
    })

@app.route('/api/scale/<key>', methods=['GET'])
def get_scale_analysis(key):
    """Get complete scale analysis for a given key and interval"""
    try:
        # Get interval from query parameter, default to major
        interval_type = request.args.get('interval', 'major').lower()
        
        if interval_type not in INTERVALS:
            return jsonify({"error": f"Invalid interval type. Available: {list(INTERVALS.keys())}"}), 400
        
        # Use real Music class if LLM available, otherwise fallback
        if llm:
            # Initialize Music system exactly like main.py
            music = Music(llm)
            
            # Set the tune
            music.setTune(key.upper())
            
            # Set the interval
            interval = INTERVALS[interval_type]()
            music.setInterval(interval)
            
            # Get all the musical data exactly like main.py
            notes = music.getNotesFromTune()
            chords = music.getChords()
            borrowed_chords = music.getBorrowedChords()
            sevenths = music.getSeventhNoteToIt()
            progressions = music.getChordProgressions()
        else:
            # Fallback to simplified music
            music = SimplifiedMusic()
            music.setTune(key.upper())
            music.setInterval(interval_type)  # Use setInterval method
            notes = music.getNotesFromTune()
            chords = music.getChords()
            borrowed_chords = music.getBorrowedChords()
            sevenths = music.getSeventhNoteToIt()
            progressions = music.getChordProgressions()
        
        # Format the response
        response = {
            "key": key.upper(),
            "interval_type": interval_type,
            "scale_name": f"{key.upper()} {interval_type.title()} Scale",
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
                    "roman": get_roman_numeral(i, interval_type),
                    "note": notes[i] if i < len(notes) else "",
                    "chord": chords[i] if i < len(chords) else "",
                    "function": get_function_name(i)
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
    """Get chord progressions for a specific key and interval"""
    try:
        interval_type = request.args.get('interval', 'major').lower()
        
        if interval_type not in INTERVALS:
            return jsonify({"error": f"Invalid interval type. Available: {list(INTERVALS.keys())}"}), 400
        
        if llm:
            music = Music(llm)
            music.setTune(key.upper())
            interval = INTERVALS[interval_type]()
            music.setInterval(interval)
            music.getNotesFromTune()
            music.getChords()
            progressions = music.getChordProgressions()
        else:
            music = SimplifiedMusic()
            music.setTune(key.upper())
            music.getNotesFromTune()
            music.getChords()
            progressions = music.getChordProgressions()
        
        return jsonify({
            "key": key.upper(),
            "interval_type": interval_type,
            "progressions": progressions
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/secondary-dominants/<key>', methods=['GET'])
def get_secondary_dominants(key):
    """Get secondary dominants for a specific key and interval"""
    try:
        interval_type = request.args.get('interval', 'major').lower()
        
        if interval_type not in INTERVALS:
            return jsonify({"error": f"Invalid interval type. Available: {list(INTERVALS.keys())}"}), 400
        
        if llm:
            music = Music(llm)
            music.setTune(key.upper())
            interval = INTERVALS[interval_type]()
            music.setInterval(interval)
            music.getNotesFromTune()
            chords = music.getChords()
            sevenths = music.getSeventhNoteToIt()
        else:
            music = SimplifiedMusic()
            music.setTune(key.upper())
            music.getNotesFromTune()
            chords = music.getChords()
            sevenths = music.getSeventhNoteToIt()
        
        return jsonify({
            "key": key.upper(),
            "interval_type": interval_type,
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
    strings = ['E', 'B', 'G', 'D', 'A', 'E']  # 1st, 2nd, 3rd, 4th, 5th, 6th string
    chromatic_notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    frets = 12
    
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

if __name__ == '__main__':
    print("🎵 Starting Music Theory API...")
    print(f"🤖 LLM Available: {llm is not None}")
    print(f"🎼 Available Intervals: {list(INTERVALS.keys())}")
    print("🌐 Server running on http://localhost:5000")
    print("")
    print("📖 Example requests:")
    print("  http://localhost:5000/api/scale/G?interval=major")
    print("  http://localhost:5000/api/scale/G?interval=minor")
    print("")
    app.run(debug=False, host='0.0.0.0', port=5000)