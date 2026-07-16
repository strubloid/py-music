from flask import Flask, jsonify, request, send_from_directory, send_file, session, current_app
from flask_cors import CORS
from flask_login import current_user, login_required
from dotenv import load_dotenv
from werkzeug.exceptions import HTTPException
from functools import wraps
import sys
import os
import json
import hashlib
from pathlib import Path
from urllib.parse import quote

# Add the project root to sys.path (need to go up 3 levels: api -> project -> backend -> root)
project_root = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(project_root))

from backend.project.extensions import limiter, generate_csrf_token, validate_csrf_token
from backend.project.game_system import sync_user_progression

import threading
import requests
import random
import time
from datetime import datetime, timedelta

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
PIANO_SAMPLE_REMOTE_BASE = 'https://smpldsnds.github.io/sfzinstruments-splendid-grand-piano/samples'
SOUNDFONT_REMOTE_BASE = 'https://gleitz.github.io/midi-js-soundfonts'
AUDIO_CACHE_DIR = project_root / 'backend' / 'project' / 'audio_assets'
_audio_cache_locks = {}
_audio_cache_locks_guard = threading.Lock()

# ─── Security Configuration ────────────────────────────────────────────────────

# SECRET_KEY — fail hard if not set in production
SECRET_KEY = os.getenv('SECRET_KEY')
if not SECRET_KEY:
    if os.getenv('FLASK_ENV') == 'production':
        raise RuntimeError('SECRET_KEY environment variable is required in production')
    SECRET_KEY = 'dev-secret-key-change-in-production'
app.config['SECRET_KEY'] = SECRET_KEY
app.config['E2E_EXPOSE_ANSWERS'] = os.getenv('E2E_EXPOSE_ANSWERS') == '1'

app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', f'sqlite:///{project_root}/strubloid.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['RATELIMIT_ENABLED'] = os.getenv('RATELIMIT_ENABLED', 'true').lower() != 'false'

# Session cookie hardening
IS_PRODUCTION = os.getenv('FLASK_ENV') == 'production' or os.getenv('FLY_APP_NAME') is not None
app.config['SESSION_COOKIE_SECURE'] = IS_PRODUCTION      # HTTPS only in production
app.config['SESSION_COOKIE_HTTPONLY'] = True       # not accessible to JS
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'      # CSRF mitigation
app.config['SESSION_COOKIE_NAME'] = 'py_music_session'  # non-default name

# Session lifetime — force re-login after 30 days of inactivity
app.config['PERMANENT_SESSION_LIFETIME'] = 30 * 24 * 3600  # 30 days in seconds
app.config['SESSION_REFRESH_EACH_REQUEST'] = True

# Request size limit
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16 MB

# CORS — restrict to known frontend origin
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5000')
CORS(app, supports_credentials=True, origins=[FRONTEND_URL])

# Rate limiting — init the shared limiter with this app
limiter.init_app(app)

# ─── HTTPS Redirect Middleware ──────────────────────────────────────────────────

@app.before_request
def enforce_https():
    """Redirect HTTP to HTTPS when behind Fly.io proxy.
    Defense-in-depth: the Fly.io edge already terminates TLS, but this ensures
    the app itself rejects plain HTTP requests.
    """
    if IS_PRODUCTION:
        # Fly.io sets X-Forwarded-Proto; Werkzeug/Flask respects it
        if request.headers.get('X-Forwarded-Proto', 'http') != 'https':
            if request.url.startswith('http://'):
                https_url = request.url.replace('http://', 'https://', 1)
                return jsonify({'error': 'HTTPS required'}), 301, {'Location': https_url}


# ─── CSRF Protection ───────────────────────────────────────────────────────────

@app.before_request
def csrf_protect():
    """Double-submit cookie CSRF protection for state-changing requests.

    On every response, a 'csrf_token' cookie (non-httponly, readable by JS)
    is set via after_request.  For POST/PUT/DELETE/PATCH requests, the
    X-CSRFToken header must match the cookie value.  Exempts auth endpoints
    (login/register use the cookie they just received), GET/HEAD/OPTIONS,
    and testing mode.
    """
    if current_app.config.get('TESTING', False):
        return None
    if request.method in ('POST', 'PUT', 'DELETE', 'PATCH'):
        # Skip CSRF check for auth flows (they establish the session + cookie)
        if request.path.startswith('/api/auth/'):
            return None
        cookie_token = request.cookies.get('csrf_token')
        header_token = request.headers.get('X-CSRFToken')
        if not validate_csrf_token(cookie_token, header_token):
            return jsonify({'error': 'CSRF token missing or invalid'}), 403


@app.after_request
def set_csrf_cookie(response):
    """Set the CSRF token cookie on every response so the SPA always has one."""
    if 'csrf_token' not in session:
        session['csrf_token'] = generate_csrf_token()
    response.set_cookie(
        'csrf_token',
        session['csrf_token'],
        httponly=False,        # must be readable by JS
        samesite='Lax',
        secure=IS_PRODUCTION,
        max_age=86400,          # 24h — refreshed on each request
    )
    return response


# ─── Security Headers ───────────────────────────────────────────────────────────

@app.after_request
def remove_server_header(response):
    """Strip Server header to prevent info disclosure."""
    if 'Server' in response.headers:
        del response.headers['Server']
    return response


@app.after_request
def add_security_headers(response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    response.headers['Permissions-Policy'] = 'geolocation=(), microphone=(), camera=()'
    response.headers['Content-Security-Policy'] = (
        "default-src 'self'; "
        "script-src 'self'; "
        "style-src 'self' 'unsafe-inline'; "
        "img-src 'self' data:; "
        "font-src 'self'; "
        "connect-src 'self'; "
        "form-action 'self'; "
        "frame-ancestors 'none'; "
        "report-uri /api/csp-violation"
    )
    return response


# ─── Global JSON Error Handler ──────────────────────────────────────────────────

@app.errorhandler(400)
@app.errorhandler(401)
@app.errorhandler(403)
@app.errorhandler(404)
@app.errorhandler(405)
@app.errorhandler(413)
@app.errorhandler(415)
@app.errorhandler(429)
def json_client_error(error):
    """Return JSON for client errors instead of HTML."""
    return jsonify({'error': error.description or 'Request error'}), error.code


@app.errorhandler(500)
def json_server_error(error):
    """Return generic JSON for server errors — no stack traces."""
    return jsonify({'error': 'Internal server error'}), 500


# ─── CSP Violation Reporting ──────────────────────────────────────────────────

@app.route('/api/csp-violation', methods=['POST'])
def csp_violation():
    """Receive Content-Security-Policy violation reports from browsers."""
    report = request.get_json(silent=True) or {}
    from backend.project.error_logger import log_error
    log_error('CSP', 'Content Security Policy violation', details=str(report))
    return '', 204


@app.route('/api/audio-proxy/piano/<path:asset_path>', methods=['GET'])
@limiter.exempt
def proxy_piano_asset(asset_path):
    """Serve whitelisted piano sample assets from a same-origin endpoint."""
    safe_path = asset_path.strip('/')
    if not safe_path or '..' in safe_path:
        return jsonify({'error': 'Invalid asset path'}), 400
    if not (safe_path.endswith('.ogg') or safe_path.endswith('.m4a')):
        return jsonify({'error': 'Unsupported asset type'}), 400

    encoded_path = '/'.join(quote(segment, safe='') for segment in safe_path.split('/'))
    remote_url = f'{PIANO_SAMPLE_REMOTE_BASE}/{encoded_path}'
    cache_path = AUDIO_CACHE_DIR / 'piano' / Path(safe_path)
    return _proxy_remote_audio_asset(remote_url, cache_path)


@app.route('/api/audio-proxy/soundfont/<kit>/<instrument>', methods=['GET'])
@limiter.exempt
def proxy_soundfont_asset(kit, instrument):
    """Serve whitelisted soundfont JS payloads from a same-origin endpoint."""
    allowed_kits = {'FluidR3_GM'}
    allowed_instruments = {'acoustic_guitar_steel'}

    if kit not in allowed_kits or instrument not in allowed_instruments:
        return jsonify({'error': 'Unsupported soundfont asset'}), 400

    remote_url = f'{SOUNDFONT_REMOTE_BASE}/{kit}/{instrument}-ogg.js'
    cache_path = AUDIO_CACHE_DIR / 'soundfont' / kit / f'{instrument}-ogg.js'
    return _proxy_remote_audio_asset(remote_url, cache_path)


def _proxy_remote_audio_asset(remote_url, cache_path):
    cache_path = Path(cache_path)

    if cache_path.exists() and cache_path.is_file():
        return send_file(cache_path, conditional=True, max_age=31536000)

    lock = _get_audio_cache_lock(cache_path)
    with lock:
        if cache_path.exists() and cache_path.is_file():
            return send_file(cache_path, conditional=True, max_age=31536000)

        cache_path.parent.mkdir(parents=True, exist_ok=True)

        try:
            upstream = requests.get(remote_url, timeout=15)
            upstream.raise_for_status()
        except requests.RequestException:
            if cache_path.exists() and cache_path.is_file():
                return send_file(cache_path, conditional=True, max_age=31536000)
            return jsonify({'error': 'Failed to load audio asset'}), 502

        temp_path = cache_path.with_suffix(f'{cache_path.suffix}.tmp')
        try:
            temp_path.write_bytes(upstream.content)
            temp_path.replace(cache_path)
        finally:
            if temp_path.exists():
                temp_path.unlink()

    return send_file(cache_path, conditional=True, max_age=31536000)


def _get_audio_cache_lock(cache_path):
    cache_key = str(cache_path)

    with _audio_cache_locks_guard:
        lock = _audio_cache_locks.get(cache_key)
        if lock is None:
            lock = threading.Lock()
            _audio_cache_locks[cache_key] = lock
        return lock


# ─── Content-Type Enforcement ──────────────────────────────────────────────────

def require_json_content_type(f):
    """Decorator to enforce application/json Content-Type on state-changing requests."""
    @wraps(f)
    def decorated(*args, **kwargs):
        if request.method in ('POST', 'PUT', 'PATCH'):
            ct = request.content_type or ''
            if 'application/json' not in ct:
                return jsonify({'error': 'Content-Type must be application/json'}), 415
        return f(*args, **kwargs)
    return decorated


# Initialize extensions
from backend.project.models import db, bcrypt
db.init_app(app)
bcrypt.init_app(app)

# Background DB initialization — defer create_all + migrations so the app starts
# listening immediately.  Fly.io health checks time out if the module-level
# synchronous db.create_all() blocks import for several seconds.
db_ready = False

def _init_db_background():
    global db_ready
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
    db_ready = True

if os.getenv('PYMUSIC_DISABLE_BACKGROUND_INIT') != '1' and __name__ != '__main__':
    threading.Thread(target=_init_db_background, daemon=True).start()

from backend.project.auth import auth_bp, login_manager
login_manager.init_app(app)
app.register_blueprint(auth_bp, url_prefix='/api/auth')

from backend.project.api.protected import api_bp
app.register_blueprint(api_bp)

from backend.project.api.daily_challenges import daily_bp, seed_challenges
app.register_blueprint(daily_bp)

from backend.project.api.living_city import living_city_bp
app.register_blueprint(living_city_bp)

from backend.project.error_logger import log_error, log_request_error
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

if os.getenv('PYMUSIC_DISABLE_BACKGROUND_INIT') != '1':
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

@limiter.limit("30 per minute")
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
        if os.getenv('SEED_CHALLENGES_ON_START', 'false').lower() == 'true':
            seed_challenges(target=200)
        print("✅ Database tables created")


# ─── Scale Path (assessed) ─────────────────────────────────────────────────────

def _build_scale_route(root_key, mode, octaves, fret_count):
    """Generate a playable route of scale notes on the guitar fretboard."""
    NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    MODE_INTERVALS = {
        'ionian': [0, 2, 4, 5, 7, 9, 11],
        'aeolian': [0, 2, 3, 5, 7, 8, 10],
        'dorian': [0, 2, 3, 5, 7, 9, 10],
        'mixolydian': [0, 2, 4, 5, 7, 9, 10],
        'phrygian': [0, 1, 3, 5, 7, 8, 10],
        'lydian': [0, 2, 4, 6, 7, 9, 11],
        'locrian': [0, 1, 3, 5, 6, 8, 10],
    }

    # Keep route generation independent of optional LLM/music-system startup.
    # A Scale Path run must always have a playable, deterministic note set.
    NOTE_TONES = {
        'C': 0, 'C#': 1, 'DB': 1, 'D': 2, 'D#': 3, 'EB': 3,
        'E': 4, 'F': 5, 'F#': 6, 'GB': 6, 'G': 7, 'G#': 8,
        'AB': 8, 'A': 9, 'A#': 10, 'BB': 10, 'B': 11,
    }
    root_tone = NOTE_TONES.get(root_key.upper(), 0)
    scale_notes = [NOTE_NAMES[(root_tone + interval) % 12] for interval in MODE_INTERVALS.get(mode, MODE_INTERVALS['ionian'])]

    # Guitar standard tuning: high E through low E.
    TUNING = [('E', 4), ('B', 3), ('G', 2), ('D', 1), ('A', 0), ('E', -1)]

    def note_to_semitone(note):
        return NOTE_TONES.get(note.upper(), 0)

    # Build all scale-note positions on the fretboard up to fret_count
    positions = []
    for string_note, string_offset in TUNING:
        base_tone = note_to_semitone(string_note)
        for fret in range(fret_count + 1):
            pos_tone = (base_tone + fret) % 12
            if scale_notes:
                # Match by note name (handle sharps)
                matching = [n for n in scale_notes
                            if note_to_semitone(n) == pos_tone]
                if matching:
                    positions.append({
                        'string': string_note,
                        'fret': fret,
                        'note': matching[0],
                        'stringIndex': TUNING.index((string_note, string_offset)),
                        'pitch': pos_tone,
                    })
            else:
                # Fallback: any note matching the mode's expected degrees
                pass

    return positions


def _select_tier1_fragment(positions, root_key, mode, fragment_index=0, seed=0, route_modifier='nearest-position'):
    """Select one deterministic movement with several physically playable choices."""
    if len(positions) < 5:
        return None
    rng = random.Random(seed + fragment_index * 7919)
    playable = [position for position in positions if 0 <= position['fret'] <= 24]
    anchor_index = (seed + fragment_index * 5) % max(1, len(playable) - 1)
    anchor = playable[anchor_index]
    open_midi = [40, 45, 50, 55, 59, 64]
    anchor_midi = open_midi[anchor['stringIndex']] + anchor['fret']
    eligible = [position for position in playable if position != anchor]
    if route_modifier == 'same-string':
        eligible = [position for position in eligible if position['stringIndex'] == anchor['stringIndex']]
    elif route_modifier == 'alternate-strings':
        eligible = [position for position in eligible if position['stringIndex'] != anchor['stringIndex']]
    elif route_modifier == 'ascending':
        eligible = [position for position in eligible if open_midi[position['stringIndex']] + position['fret'] > anchor_midi]
    elif route_modifier == 'descending':
        eligible = [position for position in eligible if open_midi[position['stringIndex']] + position['fret'] < anchor_midi]
    elif route_modifier == 'octave-target':
        eligible = [position for position in eligible if position['pitch'] == anchor['pitch']]
    if not eligible:
        eligible = [position for position in playable if position != anchor]
    eligible.sort(key=lambda position: (
        abs(position['fret'] - anchor['fret']) + abs(position['stringIndex'] - anchor['stringIndex']) * 2,
        position['stringIndex'], position['fret'],
    ))
    choice_window = eligible[:max(1, min(6, len(eligible)))]
    correct_gap = choice_window[(seed + fragment_index) % len(choice_window)]
    suffix_positions = [anchor]

    wrong_options = [
        position for position in playable
        if position != correct_gap and position['pitch'] != correct_gap['pitch']
    ]
    rng.shuffle(wrong_options)
    candidates = [{**correct_gap, 'isCorrect': True}]
    candidates.extend({**option, 'isCorrect': False} for option in wrong_options[:2])
    rng.shuffle(candidates)

    direction = 'left' if correct_gap['string'] == anchor['string'] else 'up'
    root_pitch = {'C': 0, 'C#': 1, 'DB': 1, 'D': 2, 'D#': 3, 'EB': 3, 'E': 4, 'F': 5, 'F#': 6, 'GB': 6, 'G': 7, 'G#': 8, 'AB': 8, 'A': 9, 'A#': 10, 'BB': 10, 'B': 11}.get(root_key.upper(), 0)
    intervals = {
        'ionian': [0, 2, 4, 5, 7, 9, 11], 'dorian': [0, 2, 3, 5, 7, 9, 10],
        'phrygian': [0, 1, 3, 5, 7, 8, 10], 'lydian': [0, 2, 4, 6, 7, 9, 11],
        'mixolydian': [0, 2, 4, 5, 7, 9, 10], 'aeolian': [0, 2, 3, 5, 7, 8, 10],
        'locrian': [0, 1, 3, 5, 6, 8, 10],
    }.get(mode, [0, 2, 4, 5, 7, 9, 11])
    degree = intervals.index((correct_gap['pitch'] - root_pitch) % 12) + 1

    return {
        'root': root_key.upper(),
        'mode': mode,
        'difficulty': 1,
        'anchor': {**anchor},
        'suffix': [{**p} for p in suffix_positions],
        'gap': {**correct_gap} if correct_gap else None,
        'candidates': candidates,
        'direction': direction,
        'degreeClue': str(degree),
    }


def _public_scale_path_fragment(fragment):
    """Remove the server-only answer fields from a playable fragment."""
    return {
        key: value for key, value in fragment.items()
        if key not in {'gap'}
    } | {
        'candidates': [
            {key: value for key, value in candidate.items() if key != 'isCorrect'}
            for candidate in fragment.get('candidates', [])
        ],
    }


@app.route('/api/scale-path/run', methods=['GET'])
@login_required
def get_scale_path_run():
    """Get a seeded Scale Trail run with exactly six or seven movements.

    The server also stores the run so the completion endpoint can validate
    submitted positions without trusting client-supplied correctness.
    """
    try:
        seed_text = request.args.get('seed') or os.urandom(8).hex()
        seed = int(hashlib.sha256(seed_text.encode('utf-8')).hexdigest()[:12], 16)
        rng = random.Random(seed)
        root = request.args.get('root') or rng.choice(['C', 'G', 'D', 'A', 'E', 'F'])
        mode = request.args.get('mode') or rng.choice(['ionian', 'aeolian', 'dorian', 'mixolydian'])
        octaves = max(1, min(3, int(request.args.get('octaves', 1))))
        difficulty = max(1, min(5, int(request.args.get('difficulty', 1))))
        fret_count = {1: 12, 2: 17, 3: 22}.get(octaves, 12)
        move_count = 6 + (seed % 2)
        route_modifier = rng.choice([
            'ascending', 'descending', 'same-string', 'nearest-position',
            'alternate-strings', 'octave-target', 'hidden-labels', 'listen-first',
        ])

        # Build full route for this run
        positions = _build_scale_route(root, mode, octaves, fret_count)

        # Every run is a real multi-step journey. The displayed die result is
        # determined here before its animation starts.
        fragments = []
        for i in range(move_count):
            frag = _select_tier1_fragment(positions, root, mode, i, seed, route_modifier)
            if frag:
                frag['fragmentIndex'] = i
                fragments.append(frag)

        run_id = f'scale-path-{root}-{mode}-{int(time.time())}-{os.urandom(4).hex()}'
        user_id = current_user.id if current_user.is_authenticated else None

        # Persist the run so completion requests can be validated against it.
        # We keep the run for 24h; the request body is small and authoritative.
        from backend.project.models.user import ScalePathRun
        run_row = ScalePathRun(
            run_id=run_id,
            user_id=user_id,
            root=root.upper(),
            mode=mode,
            difficulty=difficulty,
            octaves=octaves,
            fret_count=fret_count,
            fragments_json=json.dumps(fragments),
            positions_json=json.dumps(positions),
            expires_at=datetime.utcnow() + timedelta(hours=24),
        )
        db.session.add(run_row)
        db.session.commit()

        return jsonify({
            'runId': run_id,
            'root': root.upper(),
            'mode': mode,
            'difficulty': difficulty,
            'octaves': octaves,
            'fretCount': fret_count,
            'seed': seed_text,
            'dieResult': move_count,
            'routeModifier': route_modifier,
            'positions': positions[:60],  # Send capped positions for the game
            'fragments': [_public_scale_path_fragment(fragment) for fragment in fragments],
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/scale-path/complete', methods=['POST'])
def complete_scale_path_fragment():
    """Submit a Scale Path fragment result; the server validates correctness
    against the stored run and only awards XP for genuinely correct answers.

    Idempotent per (user, run, fragment) — replays return the original result
    without re-awarding XP.
    """
    try:
        from backend.project.models.user import ScalePathRun, ScalePathAttempt

        if not current_user.is_authenticated:
            return jsonify({
                'authenticated': False,
                'correct': False,
                'xp_awarded': 0,
                'message': 'Sign in to save Scale Path progress.',
            }), 401

        data = request.get_json() or {}
        run_id = data.get('runId', '')
        fragment_index = int(data.get('fragmentIndex', 0))
        submitted_position = data.get('submittedPosition') or {}
        submitted_midi = data.get('submittedMidi')

        run = ScalePathRun.query.filter_by(run_id=run_id).first()
        if not run:
            return jsonify({'error': 'Unknown run. Start a new run before submitting.'}), 400
        if run.user_id != current_user.id:
            return jsonify({'error': 'This run belongs to another account.'}), 403
        if run.expires_at and run.expires_at < datetime.utcnow():
            return jsonify({'error': 'This run has expired. Start a new run before submitting.'}), 410

        fragments = json.loads(run.fragments_json)
        if fragment_index < 0 or fragment_index >= len(fragments):
            return jsonify({'error': 'Fragment index out of range'}), 400
        fragment = fragments[fragment_index]
        correct_gap = fragment.get('gap') or {}

        # The server compares the submitted position against the stored
        # answer. The client cannot mark itself correct.
        guitar_correct = (
            submitted_position.get('string') == correct_gap.get('string')
            and submitted_position.get('fret') == correct_gap.get('fret')
        )
        piano_correct = (
            isinstance(submitted_midi, int)
            and submitted_midi % 12 == correct_gap.get('pitch')
        )
        is_correct = guitar_correct or piano_correct

        # Idempotency: one result per (user, run, fragment).
        existing = ScalePathAttempt.query.filter_by(
            user_id=current_user.id,
            run_id=run_id,
            fragment_index=fragment_index,
        ).first()
        if existing:
            return jsonify({
                'authenticated': True,
                'fragmentIndex': fragment_index,
                'correct': existing.correct,
                'xp_awarded': existing.xp_awarded,
                'correctAnswer': correct_gap,
                'already_recorded': True,
            })

        xp_awarded = 0
        if is_correct:
            xp_awarded = min(50, max(10, 10 * (run.difficulty or 1)))

        attempt = ScalePathAttempt(
            user_id=current_user.id,
            run_id=run_id,
            fragment_index=fragment_index,
            correct=is_correct,
            xp_awarded=xp_awarded,
        )
        db.session.add(attempt)
        if is_correct and xp_awarded:
            current_user.xp = (current_user.xp or 0) + xp_awarded
            current_user.lifetime_points = (current_user.lifetime_points or 0) + xp_awarded
            sync_user_progression(current_user)
        from backend.project.api.daily_challenges import _record_quest_progress
        period_key = datetime.utcnow().strftime('%Y-%m-%d')
        _record_quest_progress(current_user.id, 'play', 'daily', period_key)
        _record_quest_progress(current_user.id, 'play', 'milestone', 'lifetime')
        if is_correct:
            _record_quest_progress(current_user.id, 'correct', 'daily', period_key)
            _record_quest_progress(current_user.id, 'correct', 'milestone', 'lifetime')
        db.session.commit()

        return jsonify({
            'authenticated': True,
            'fragmentIndex': fragment_index,
            'correct': is_correct,
            'xp_awarded': xp_awarded,
            'correctAnswer': correct_gap,
            'already_recorded': False,
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/scale-path/verify', methods=['POST'])
def verify_scale_lab_build():
    """Analyze a Scale Lab formula with music21. No XP is awarded here."""
    try:
        data = request.get_json() or {}
        root = data.get('root', 'C').upper()
        mode = data.get('mode', 'ionian')
        selected_notes = data.get('selectedNotes', [])
        from backend.project.music_analysis import analyze_scale_build
        return jsonify(analyze_scale_build(root, mode, selected_notes))
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500


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
