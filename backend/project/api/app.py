from flask import Flask, jsonify, request, send_from_directory, send_file
from flask_cors import CORS
from dotenv import load_dotenv
import sys
import os
from pathlib import Path

# Add the project root to sys.path (need to go up 3 levels: api -> project -> backend -> root)
project_root = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(project_root))

from backend.project.music.chords.intervals.Major import MajorInterval
from backend.project.music.chords.intervals.Minor import MinorInterval
from backend.project.music.chords.intervals.Ionian import IonianInterval
from backend.project.music.chords.intervals.Dorian import DorianInterval
from backend.project.music.chords.intervals.Phrygian import PhrygianInterval
from backend.project.music.chords.intervals.Lydian import LydianInterval
from backend.project.music.chords.intervals.Mixolydian import MixolydianInterval
from backend.project.music.chords.intervals.Aeolian import AeolianInterval
from backend.project.music.chords.intervals.Locrian import LocrianInterval
from backend.project.llm.ChatGPT import ChatGPT
from backend.project.music.Music import Music, get_roman_numeral, get_function_name, generate_fretboard_data

# Load environment variables
load_dotenv()

# Configure Flask app. Disable Flask's built-in static route so SPA routes like
# /create/my-songs fall through to our catch-all instead of returning a static
# file 404 before the catch-all route can serve index.html.
frontend_dist = project_root / 'frontend' / 'dist'
app = Flask(__name__, static_folder=None)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', f'sqlite:///{project_root}/strubloid.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

CORS(app, supports_credentials=True)  # Enable CORS with credentials for session cookies

# Initialize extensions
from backend.project.models import db, bcrypt
db.init_app(app)
bcrypt.init_app(app)

# Create database tables on startup — critical for production where
# `if __name__ == '__main__'` is never reached (Docker runs `python -m flask run`).
with app.app_context():
    try:
        db.create_all()
        print("✅ Database tables created / verified")
    except Exception as e:
        print(f"⚠️  DB init failed (will retry on first request): {e}")

# Run schema migrations for existing tables
try:
    from backend.project.models.user import run_migrations
    with app.app_context():
        run_migrations()
    print("✅ Schema migrations applied")
except Exception as e:
    print(f"⚠️  Migration failed (will retry on seed): {e}")

from backend.project.auth import auth_bp, login_manager
login_manager.init_app(app)
app.register_blueprint(auth_bp, url_prefix='/api/auth')

from backend.project.api.protected import api_bp
app.register_blueprint(api_bp)

from backend.project.api.daily_challenges import daily_bp
app.register_blueprint(daily_bp)

from backend.project.error_logger import log_error, log_request_error
import threading
import time

# Lazy LLM initialization — start in a background thread so Flask serves
# immediately and Fly.io health checks don't timeout. While the LLM is
# loading, route handlers fall back to MockLLM (already handled in each route).
llm = None
music_system = None
llm_ready = False

def _init_llm_background():
    global llm, music_system, llm_ready
    try:
        print("🔄 Initializing LLM (background)...")
        _llm = ChatGPT()
        _music = Music(_llm)
        llm = _llm
        music_system = _music
        llm_ready = True
        print("✅ LLM initialized successfully (background)")
    except Exception as e:
        print(f"⚠️  LLM initialization failed: {e}. Using simplified mode.")
        llm_ready = True  # mark done so health check reflects failure too

threading.Thread(target=_init_llm_background, daemon=True).start()

# Available interval types — all 7 diatonic modes.
# 'major' and 'minor' are removed (aliases for ionian/aeolian; use those instead).
INTERVALS = {
    'ionian':     IonianInterval,
    'dorian':     DorianInterval,
    'phrygian':   PhrygianInterval,
    'lydian':     LydianInterval,
    'mixolydian': MixolydianInterval,
    'aeolian':    AeolianInterval,
    'locrian':    LocrianInterval,
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
    """Get list of available scale modes"""
    modes = []
    for key, cls in INTERVALS.items():
        instance = cls()
        modes.append({
            "key": key,
            "name": getattr(instance, 'name', key.title()),
            "description": getattr(instance, 'description', ''),
            "mode": getattr(instance, 'mode', key)
        })
    return jsonify({"intervals": modes})

@app.route('/api/music-config', methods=['GET'])
def get_music_config():
    """Get music display configuration for consistent UI rendering"""
    return jsonify({
        "guitarStringOrder": ["E", "B", "G", "D", "A", "E"],
        "pianoKeyOrder": ["C", "D", "E", "F", "G", "A", "B"],
        "blackKeyOrder": ["C#", "D#", "F#", "G#", "A#"],
        "chordDisplayOrder": "ascending",
        "noteNamingConvention": "sharp",
        "fretboardDirection": "leftToRight"
    })

@app.route('/api/scale/<key>', methods=['GET'])
def get_scale_analysis(key):
    """Get complete scale analysis for a given key and interval"""
    try:
        interval_type = request.args.get('interval', 'major').lower()
        octaves = max(1, min(4, int(request.args.get('octaves', 1))))

        if interval_type not in INTERVALS:
            return jsonify({"error": f"Invalid interval type. Available: {list(INTERVALS.keys())}"}), 400

        if music_system:
            response = music_system.getCompleteScaleAnalysis(key, interval_type, octaves=octaves)
        else:
            class MockLLM:
                def getParser(self):
                    class MockParser:
                        def get_format_instructions(self):
                            return ''
                    return MockParser()
                def startingChain(self, prompt):
                    pass

            music = Music(MockLLM())
            response = music.getCompleteScaleAnalysis(key, interval_type, octaves=octaves)

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

        if music_system:
            music_system.setTune(key.upper())
            interval = INTERVALS[interval_type]()
            music_system.setInterval(interval)
            music_system.getNotesFromTune()
            chords = music_system.getChords()
            sevenths = music_system.getSeventhNoteToIt()
        else:
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
                for chord, seventh in zip(chords, sevenths) if isinstance(sevenths, list)
            ]
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/log-error', methods=['POST'])
def log_client_error():
    """Receive and log client-side errors from the frontend."""
    data = request.get_json() or {}
    category = data.get('category', 'FRONTEND')
    message = data.get('message', 'Unknown client error')
    details = data.get('details')
    log_error(category, message, details=details)
    return jsonify({"logged": True}), 201

@app.route('/api/keys', methods=['GET'])
def get_available_keys():
    """Get list of available keys"""
    keys = ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B']
    return jsonify({"keys": keys})

# Serve static files from frontend/dist
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    """Serve frontend static files and handle SPA routing"""
    if path.startswith('api/'):
        return jsonify({"error": "API endpoint not found"}), 404

    requested_file = frontend_dist / path if path else None
    if requested_file and requested_file.exists() and requested_file.is_file():
        return send_from_directory(frontend_dist, path)

    return send_file(str(frontend_dist / 'index.html'))


# ─── Database initialization ────────────────────────────────────────────────────

def init_db():
    """Create all database tables."""
    with app.app_context():
        db.create_all()
        print("✅ Database tables created")


if __name__ == '__main__':
    init_db()
    print("🎵 Starting Music Theory API...")
    print(f"🤖 LLM Available: {llm is not None}")
    print(f"🎼 Available Intervals: {list(INTERVALS.keys())}")
    print("🌐 Server running on http://localhost:5000")
    print(f"📁 Serving frontend from: {frontend_dist}")
    print("")
    print("📖 Example requests:")
    print("  http://localhost:5000/api/scale/G?interval=major")
    print("  http://localhost:5000/api/scale/G?interval=minor")
    print("  http://localhost:5000/ (frontend)")
    print("")
    app.run(debug=False, host='0.0.0.0', port=5000)
