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
from src.music.Music import Music, get_roman_numeral, get_function_name, generate_fretboard_data

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Initialize the music system like in main.py
llm = None
music_system = None
try:
    print("🔄 Initializing LLM...")
    llm = ChatGPT()
    print("✅ LLM initialized successfully")
    # Initialize the main music system with LLM
    music_system = Music(llm)
    print("✅ Music system initialized with LLM")
except Exception as e:
    print(f"⚠️  LLM initialization failed: {e}. Using simplified mode.")
    llm = None
    music_system = None


# Available interval types
INTERVALS = {
    'major': MajorInterval,
    'minor': MinorInterval
}





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
        "guitarStringOrder": ["E", "B", "G", "D", "A", "E"],  # Display order: 1st to 6th string (high to low)
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
        
        # Use Music class for all scale analysis
        if music_system:
            response = music_system.getCompleteScaleAnalysis(key, interval_type)
        else:
            # Fallback: create a temporary Music instance with mock LLM
            class MockLLM:
                def getParser(self):
                    class MockParser:
                        def get_format_instructions(self):
                            return ''
                    return MockParser()
                def startingChain(self, prompt):
                    pass
            
            music = Music(MockLLM())
            response = music.getCompleteScaleAnalysis(key, interval_type)
        
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
        
        if music_system:
            music_system.setTune(key.upper())
            interval = INTERVALS[interval_type]()
            music_system.setInterval(interval)
            music_system.getNotesFromTune()
            music_system.getChords()
            progressions = music_system.getChordProgressions()
        else:
            # Fallback: create a temporary Music instance
            class MockLLM:
                def getParser(self):
                    class MockParser:
                        def get_format_instructions(self):
                            return ''
                    return MockParser()
                def startingChain(self, prompt):
                    pass
            
            music = Music(MockLLM())
            music.setTune(key.upper())
            interval = INTERVALS[interval_type]()
            music.setInterval(interval)
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
        
        # Use Music class for consistent results
        if music_system:
            music_system.setTune(key.upper())
            interval = INTERVALS[interval_type]()
            music_system.setInterval(interval)
            music_system.getNotesFromTune()
            chords = music_system.getChords()
            sevenths = music_system.getSeventhNoteToIt()
        else:
            # Fallback: create a temporary Music instance
            class MockLLM:
                def getParser(self):
                    class MockParser:
                        def get_format_instructions(self):
                            return ''
                    return MockParser()
                def startingChain(self, prompt):
                    pass
            
            music = Music(MockLLM())
            music.setTune(key.upper())
            interval = INTERVALS[interval_type]()
            music.setInterval(interval)
            music.getNotesFromTune()
            chords = music.getChords()
            sevenths = music.getSeventhNoteToIt()
        
        return jsonify({
            "key": key.upper(),
            "interval_type": interval_type,
            "secondary_dominants": [
                {"target_chord": chord, "dominant_seventh": seventh}
                for chord in chords
            ]
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500



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