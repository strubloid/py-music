from flask import Flask, jsonify, request, send_from_directory, send_file, session, current_app, Response
from flask_cors import CORS
from dotenv import load_dotenv
from werkzeug.exceptions import HTTPException
from functools import wraps
import sys
import os
from pathlib import Path

# Add the project root to sys.path (need to go up 3 levels: api -> project -> backend -> root)
project_root = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(project_root))

from backend.project.extensions import limiter, generate_csrf_token, validate_csrf_token

import threading
import requests

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

# ─── Security Configuration ────────────────────────────────────────────────────

# SECRET_KEY — fail hard if not set in production
SECRET_KEY = os.getenv('SECRET_KEY')
if not SECRET_KEY:
    if os.getenv('FLASK_ENV') == 'production':
        raise RuntimeError('SECRET_KEY environment variable is required in production')
    SECRET_KEY = 'dev-secret-key-change-in-production'
app.config['SECRET_KEY'] = SECRET_KEY

app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', f'sqlite:///{project_root}/strubloid.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

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
def proxy_piano_asset(asset_path):
    """Serve whitelisted piano sample assets from a same-origin endpoint."""
    safe_path = asset_path.strip('/')
    if not safe_path or '..' in safe_path:
        return jsonify({'error': 'Invalid asset path'}), 400
    if not (safe_path.endswith('.ogg') or safe_path.endswith('.m4a')):
        return jsonify({'error': 'Unsupported asset type'}), 400

    remote_url = f'{PIANO_SAMPLE_REMOTE_BASE}/{safe_path}'
    return _proxy_remote_audio_asset(remote_url)


@app.route('/api/audio-proxy/soundfont/<kit>/<instrument>.js', methods=['GET'])
def proxy_soundfont_asset(kit, instrument):
    """Serve whitelisted soundfont JS payloads from a same-origin endpoint."""
    allowed_kits = {'FluidR3_GM'}
    allowed_instruments = {'acoustic_guitar_steel'}

    if kit not in allowed_kits or instrument not in allowed_instruments:
        return jsonify({'error': 'Unsupported soundfont asset'}), 400

    remote_url = f'{SOUNDFONT_REMOTE_BASE}/{kit}/{instrument}-ogg.js'
    return _proxy_remote_audio_asset(remote_url)


def _proxy_remote_audio_asset(remote_url):
    try:
        upstream = requests.get(remote_url, timeout=15)
        upstream.raise_for_status()
    except requests.RequestException:
        return jsonify({'error': 'Failed to load audio asset'}), 502

    response = Response(upstream.content, status=upstream.status_code)
    content_type = upstream.headers.get('Content-Type')
    if content_type:
        response.headers['Content-Type'] = content_type
    response.headers['Cache-Control'] = 'public, max-age=86400'
    return response


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

threading.Thread(target=_init_db_background, daemon=True).start()

from backend.project.auth import auth_bp, login_manager
login_manager.init_app(app)
app.register_blueprint(auth_bp, url_prefix='/api/auth')

from backend.project.api.protected import api_bp
app.register_blueprint(api_bp)

from backend.project.api.daily_challenges import daily_bp
app.register_blueprint(daily_bp)

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
