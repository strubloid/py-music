"""Shared extensions for the py-music application.

Centralizes Flask extension instances and utility functions to avoid circular imports.
"""

import hashlib
import json
import re
import secrets
from datetime import datetime
from pathlib import Path

import requests

from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

# ─── Rate Limiter ─────────────────────────────────────────────────────────────────

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="memory://",
)

# ─── Account Lockout (in-memory) ──────────────────────────────────────────────────

_LOCKOUT_WINDOW = 15  # minutes
_LOCKOUT_THRESHOLD = 5  # failed attempts
_FAILED_ATTEMPTS: dict[str, list[datetime]] = {}


def is_account_locked(email: str) -> bool:
    """Check if an account is temporarily locked due to too many failed attempts."""
    key = email.lower()
    now = datetime.utcnow()
    attempts = _FAILED_ATTEMPTS.get(key, [])
    # Clean old entries outside the window
    _FAILED_ATTEMPTS[key] = [t for t in attempts if t > _timestamp_minus_window()]
    return len(_FAILED_ATTEMPTS[key]) >= _LOCKOUT_THRESHOLD


def record_failed_attempt(email: str):
    """Record a failed login attempt for lockout tracking."""
    key = email.lower()
    if key not in _FAILED_ATTEMPTS:
        _FAILED_ATTEMPTS[key] = []
    _FAILED_ATTEMPTS[key].append(datetime.utcnow())


def _timestamp_minus_window():
    from datetime import timedelta
    return datetime.utcnow() - timedelta(minutes=_LOCKOUT_WINDOW)


# ─── Password Validation ─────────────────────────────────────────────────────────

_HIBP_API = 'https://api.pwnedpasswords.com/range/'


def is_password_breached(password: str) -> bool:
    """Check password against HaveIBeenPwned API using k-anonymity model.
    No plaintext password is ever sent to the API.
    Returns True if the password appears in known breaches.
    """
    try:
        sha1 = hashlib.sha1(password.encode()).hexdigest().upper()
        prefix, suffix = sha1[:5], sha1[5:]
        resp = requests.get(f'{_HIBP_API}{prefix}', timeout=3)
        return suffix in resp.text
    except requests.RequestException:
        return False  # fail open — don't block registration if API is down


def validate_password_strength(password: str) -> list[str]:
    """Check password meets complexity requirements. Returns list of error messages
    (empty means valid)."""
    errors = []
    if len(password) < 8:
        errors.append('Password must be at least 8 characters')
    if len(password) > 64:
        errors.append('Password must not exceed 64 characters')
    if not re.search(r'[A-Z]', password):
        errors.append('Password must contain an uppercase letter')
    if not re.search(r'[a-z]', password):
        errors.append('Password must contain a lowercase letter')
    if not re.search(r'[0-9]', password):
        errors.append('Password must contain a digit')
    if not re.search(r'[!@#$%^&*(),.?":{}|<>_\-]', password):
        errors.append('Password must contain a special character')
    return errors


# ─── Username Validation ────────────────────────────────────────────────────────

_USERNAME_RE = re.compile(r'^[a-zA-Z0-9_-]{3,30}$')


def validate_username(username: str) -> str | None:
    """Validate username format. Returns error message or None if valid."""
    if not _USERNAME_RE.match(username):
        return 'Username must be 3-30 characters (letters, numbers, underscores, hyphens only)'
    return None


# ─── Email Validation ────────────────────────────────────────────────────────────

_EMAIL_RE = re.compile(r'^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$')


def validate_email_format(email: str) -> bool:
    """Validate email format."""
    return bool(_EMAIL_RE.match(email.strip()))


# ─── CSRF Protection ─────────────────────────────────────────────────────────────

def generate_csrf_token() -> str:
    """Generate a cryptographically secure CSRF token."""
    return secrets.token_hex(32)


def validate_csrf_token(cookie_token: str | None, header_token: str | None) -> bool:
    """Validate CSRF token from cookie matches X-CSRFToken header.
    Uses constant-time comparison to prevent timing attacks."""
    if not cookie_token or not header_token:
        return False
    if len(cookie_token) != 64 or len(header_token) != 64:
        return False
    return secrets.compare_digest(cookie_token, header_token)


# ─── Auth Audit Logging ─────────────────────────────────────────────────────────

_AUDIT_LOG_PATH = Path(__file__).parent.parent.parent / "data" / "auth.log"


def log_auth_event(event_type: str, email: str, success: bool, ip: str | None = None, details: str | None = None):
    """Append a structured auth event to the audit log at /data/auth.log.

    Args:
        event_type: 'login', 'register', 'logout', 'reset', 'forgot_password', 'lockout'
        email: the user's email
        success: True if the operation succeeded
        ip: client IP address (taken from request context if omitted)
        details: optional extra info
    """
    from flask import request as _req

    entry = {
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "event": event_type,
        "email": email,
        "success": success,
        "ip": ip or getattr(_req, "remote_addr", "unknown"),
    }
    if details:
        entry["details"] = details

    try:
        _AUDIT_LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
        with open(_AUDIT_LOG_PATH, "a") as f:
            f.write(json.dumps(entry, default=str) + "\n")
    except OSError:
        pass  # fail silently — audit logging must not block requests
