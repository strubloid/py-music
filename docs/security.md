# Security Assessment & Plan — py-music

> **Date:** 2026-07-08 (Updated with OWASP research gaps)
> **Scope:** Full-stack Flask + React SPA with SQLite, deployed on Fly.io
> **Methodology:** Codebase audit + OWASP Top 10 (2021/2025) + OWASP Cheat Sheets + NIST SP800-63B + Flask security best practices

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current Findings (Risk-Priority)](#current-findings)
3. [Immediate Fixes (Critical/High)](#immediate-fixes)
4. [Short-Term Improvements (Medium)](#short-term-improvements)
5. [Advanced Improvements (Low/Future)](#advanced-improvements)
6. [Infrastructure & DevOps](#infrastructure--devops)
7. [Ongoing Practices](#ongoing-practices)
8. [Reference: Implementation Examples](#reference-implementation-examples)

---

## Executive Summary

The application has **no active security controls** beyond basic password hashing (bcrypt) and Flask-Login session management. It relies entirely on Fly.io's edge proxy for HTTPS and has no application-level security headers, rate limiting, CSRF protection, or brute-force mitigation.

**Risk Level: HIGH** — the app is vulnerable to session hijacking, brute-force credential attacks, CSRF, clickjacking, data scraping, and information disclosure. No evidence of exploitation yet, but the surface is fully exposed.

---

## Current Findings

### Critical

| # | Finding | File | Impact |
|---|---------|------|--------|
| C1 | **No session cookie security flags** | `app.py` | Flask defaults: `SESSION_COOKIE_SECURE=False`, `SESSION_COOKIE_HTTPONLY=True` (default ok), `SESSION_COOKIE_SAMESITE=None`. Cookies sent over HTTP, no SameSite restriction — vulnerable to CSRF/session hijacking on man-in-the-middle. |
| C2 | **CORS wide open with credentials** | `app.py:36` | `CORS(app, supports_credentials=True)` with no `origins=` restriction. Any website can make credentialed requests to the API. |
| C3 | **SECRET_KEY falls back to hardcoded default** | `app.py:32` | `os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')` — if the env var is unset, the app uses a known public string. |
| C4 | **No rate limiting on auth endpoints** | `auth/__init__.py` | `/api/auth/login`, `/api/auth/register`, `/api/auth/forgot-password` have no throttling. Unlimited brute-force attempts. |
| C5 | **No Content-Type enforcement on API** | `app.py` | API endpoints accept any `Content-Type`. Should reject non-`application/json` requests to prevent MIME-type confusion and XSSI attacks. |

### High

| # | Finding | File | Impact |
|---|---------|------|--------|
| H1 | **No security headers** | `app.py` | Missing `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`, `Referrer-Policy`. |
| H2 | **No CSRF protection** | `auth/__init__.py` | Session cookie auth without CSRF token. Any cross-origin form POST can hijack a session. (Partially mitigated if SameSite=Lax is set — see C1.) |
| H3 | **No account lockout** | `auth/__init__.py` | Unlimited failed login attempts. No temporary lockout, no exponential backoff. |
| H4 | **Seed endpoint is unauthenticated** | `daily_challenges.py:728` | `POST /api/daily-challenge/seed` — anyone can wipe and regenerate the 1000-question challenge bank. |
| H5 | **Password policy too weak** | `auth/__init__.py:35` | Only `len(password) < 6` check. No complexity, no common-password check, no breach check (haveibeenpwned). |
| H6 | **No re-authentication for sensitive actions** | `auth/__init__.py` | Password/email changes don't require current password verification. An attacker with a hijacked session can change credentials unchallenged. |
| H7 | **Server info disclosure** | `app.py` | Flask's default `Server` header leaks version info. Even with `--no-reload`, the `Server: Werkzeug/X.X.X Python/X.X.X` header is sent. |
| H8 | **No global error handler** | `app.py` | Unhandled exceptions return Flask's default HTML error page with stack traces in debug mode. In production should return generic JSON. |

### Medium

| # | Finding | File | Impact |
|---|---------|------|--------|
| M1 | **No auth event audit logging** | `auth/__init__.py` | Successful logins, failed attempts, registrations, password resets are not logged. No forensic trail. |
| M2 | **No request body size limit** | `app.py` | No `MAX_CONTENT_LENGTH` set. Large payloads can exhaust memory. |
| M3 | **Fly.io `force_https` relies on proxy alone** | `fly.toml` | `force_https = true` at the Fly proxy level. If misconfigured or bypassed, the app itself doesn't enforce HTTPS. Should set `SESSION_COOKIE_SECURE=True` as defense-in-depth. |
| M4 | **No input validation beyond `strip()`** | `auth/__init__.py` | Email, username, password are only `.strip()`'d. No type/schema validation (e.g., email format, username charset). |
| M5 | **Test file sets OPENAI_API_KEY=test** | `test_auth.py:5` | `os.environ.setdefault('OPENAI_API_KEY', 'test')` — unnecessary env pollution, could mask missing-key issues. |
| M6 | **Session cookie missing `__Host-` prefix** | `app.py` | `__Host-` prefix (RFC 6265bis) binds cookie to origin + Secure + Path=/ — prevents subdomain cookie forgery. |
| M7 | **CSP missing `form-action` directive** | `app.py` | Without `form-action 'self'`, HTML forms on the SPA can submit to any external domain — enables phishing. |
| M8 | **CSP missing violation reporting** | `app.py` | Without `report-uri`/`report-to`, CSP violations are invisible. Should log to a reporting endpoint to detect XSS attempts. |
| M9 | **Username validation too permissive** | `auth/__init__.py` | No charset restriction on username. Should restrict to alphanumeric + underscore/hyphen to prevent lookalike attacks and injection. |
| M10 | **No X-Forwarded-For trust** | `app.py` | Fly.io proxy sends client IP in `X-Forwarded-For`. If not trusted, rate limiting keys on proxy IP instead of client IP. |
| M11 | **Account enumeration via timing** | `auth/__init__.py` | Login query returns instantly for non-existent users but takes longer for wrong-password-on-existing-user. Timing difference leaks user existence. |
| M12 | **No password strength meter** | frontend | Users have no feedback on password quality during registration. Should use zxcvbn library client-side + validate server-side. |
| M13 | **No breached-password check** | `auth/__init__.py` | No integration with HaveIBeenPwned API. Users can set passwords that are known to be compromised. |
| M14 | **No session invalidation on password change** | `auth/__init__.py` | Changing password doesn't invalidate existing sessions — a hijacker retains access even after the real user changes their password. |

### Low

| # | Finding | File | Impact |
|---|---------|------|--------|
| L1 | **SQLite volume has no backup strategy** | `fly.toml` | The volume mount persists across deploys, but there's no backup/restore plan. |
| L2 | **No dependency vulnerability scanning** | `requirements.txt` | No `pip-audit`, `safety`, or Dependabot integration. |
| L3 | **Error logger leaks `request.remote_addr` to file** | `error_logger.py:60` | Logs client IPs to `/data/errors.md`. Not necessarily a vulnerability but worth noting for GDPR/PII compliance. |
| L4 | **No `.dockerignore`** | project root | Build context is 326MB — includes `.git/`, `node_modules/`, virtualenvs. Bloat and risk of leaking secrets. |
| L5 | **Session not regenerated after login** | `auth/__init__.py` | No explicit session regeneration. (Flask-Login's `login_user()` does regenerate by default, but should verify/configure explicitly.) |
| L6 | **No MFA support** | app-wide | No multi-factor authentication. Per Microsoft, MFA stops 99.9% of account compromises. |
| L7 | **Password policy doesn't follow NIST SP800-63B** | `auth/__init__.py` | NIST recommends: minimum 15 chars if no MFA (8 if MFA), no composition rules (allow all chars including spaces/unicode), no periodic changes, check against breached passwords. Current policy contradicts NIST. |
| L8 | **No CAPTCHA on auth endpoints** | `auth/__init__.py` | No bot-detection challenge. Automated credential stuffing is trivial. |

---

## Immediate Fixes

These should be done before the next deploy. Each has a code snippet.

### 1. Secure Session Cookies (`backend/project/api/app.py`)

Add these config values before `db.init_app(app)`:

```python
app.config['SESSION_COOKIE_SECURE'] = True      # HTTPS only
app.config['SESSION_COOKIE_HTTPONLY'] = True     # default, but explicit
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'    # prevent CSRF from external sites
app.config['SESSION_COOKIE_NAME'] = 'py_music_session'  # custom name reduces fingerprinting
```

### 2. Restrict CORS Origins

```python
FRONTEND_URL = os.getenv('FRONTEND_URL', 'https://py-music.fly.dev')
CORS(app, supports_credentials=True, origins=[FRONTEND_URL])
```

Set `FRONTEND_URL` in Fly.io secrets for production.

### 3. Fail Hard if SECRET_KEY Not Set

```python
SECRET_KEY = os.getenv('SECRET_KEY')
if not SECRET_KEY:
    raise RuntimeError('SECRET_KEY environment variable is required')
app.config['SECRET_KEY'] = SECRET_KEY
```

Then set it on Fly.io:
```bash
flyctl secrets set SECRET_KEY="$(openssl rand -hex 32)" -a py-music
```

### 4. Add Rate Limiting

Install `flask-limiter`:
```
flask-limiter>=3.7
```

Add to `app.py`:
```python
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="memory://",
)
```

Decorate auth endpoints:
```python
@auth_bp.route('/login', methods=['POST'])
@limiter.limit("5 per minute", override_defaults=False)
def login():
    ...
```

### 5. Add Security Headers

```python
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
```

### 6. Protect the Seed Endpoint

```python
from flask_login import login_required

@daily_bp.route('/daily-challenge/seed', methods=['POST'])
@login_required
def seed():
    ...
```

### 7. Add Request Size Limit

```python
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16 MB
```

### 8. Strip Server Header + Add Error Handler

```python
# Remove default Server header
app.config['SERVER_NAME'] = None  # or use after_request to strip it

@app.after_request
def remove_server_header(response):
    response.headers.pop('Server', None)
    return response
```

Global JSON error handler:
```python
@app.errorhandler(404)
@app.errorhandler(405)
@app.errorhandler(500)
def generic_error(e):
    return jsonify({'error': 'Something went wrong'}), e.code if isinstance(e, HTTPException) else 500
```

---

## Short-Term Improvements

### 1. Account Lockout / Brute Force Protection

```python
from datetime import datetime, timedelta
from functools import wraps

failed_attempts = {}  # in-memory; swap for DB/Redis in production

def rate_limit_account(email):
    key = f"login:{email}"
    now = datetime.utcnow()
    failed_attempts[key] = [t for t in failed_attempts.get(key, []) if t > now - timedelta(minutes=15)]
    if len(failed_attempts[key]) >= 5:
        return True  # locked
    return False

def record_failed(email):
    key = f"login:{email}"
    if key not in failed_attempts:
        failed_attempts[key] = []
    failed_attempts[key].append(datetime.utcnow())
```

### 2. NIST-Compliant Password Policy

Per NIST SP800-63B: minimum 15 chars if no MFA, 8 if MFA. No composition rules. Check against breached passwords.

```python
import re

def validate_password_strength(password, mfa_enabled=False):
    errors = []
    min_len = 8 if mfa_enabled else 15
    if len(password) < min_len:
        errors.append(f'Password must be at least {min_len} characters')
    # NIST recommends NO composition rules — allow all characters
    # But do check against breached passwords:
    if is_password_breached(password):
        errors.append('This password has been exposed in a data breach. Choose a different one.')
    return errors
```

**HaveIBeenPwned integration:**
```python
import hashlib
import requests

def is_password_breached(password):
    """Check password against HaveIBeenPwned API (k-anonymity model)."""
    sha1 = hashlib.sha1(password.encode()).hexdigest().upper()
    prefix, suffix = sha1[:5], sha1[5:]
    resp = requests.get(f'https://api.pwnedpasswords.com/range/{prefix}', timeout=5)
    return suffix in resp.text
```

### 3. Auth Audit Logging

```python
import json
from pathlib import Path
from datetime import datetime

def log_auth_event(event_type, email, success, ip=None):
    entry = {
        'timestamp': datetime.utcnow().isoformat(),
        'event': event_type,
        'email': email,
        'success': success,
        'ip': ip or request.remote_addr,
    }
    log_path = Path(__file__).parent.parent.parent.parent / 'data' / 'auth.log'
    with open(log_path, 'a') as f:
        f.write(json.dumps(entry) + '\n')
```

### 4. Input Validation

```python
import re

EMAIL_RE = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
USERNAME_RE = re.compile(r'^[a-zA-Z0-9_-]{3,30}$')  # alphanumeric + underscore/hyphen, 3-30 chars

def validate_username(username):
    if not USERNAME_RE.match(username):
        return 'Username must be 3-30 characters (letters, numbers, underscores, hyphens)'
    return None

def validate_email(email):
    if not EMAIL_RE.match(email):
        return 'Invalid email format'
    return None
```

### 5. Session Regeneration After Login

Flask-Login's `login_user()` already regenerates the session by default. Verify:
```python
# In auth/__init__.py — ensure session is fresh:
from flask import session
session.regenerated = True  # marker; Flask-Login handles the actual rotation
```

### 6. Re-authentication for Sensitive Actions

Add current-password check before email/password changes:
```python
@auth_bp.route('/change-password', methods=['POST'])
@login_required
def change_password():
    data = request.get_json()
    current_password = data.get('current_password', '')
    new_password = data.get('new_password', '')

    if not current_user.check_password(current_password):
        return jsonify({'error': 'Current password is incorrect'}), 403

    current_user.set_password(new_password)
    db.session.commit()

    # Invalidate all other sessions (see M14)
    return jsonify({'message': 'Password changed successfully'}), 200
```

### 7. Create `.dockerignore`

```
.git/
__pycache__/
*.pyc
.env
node_modules/
frontend/node_modules/
frontend/src/
.venv/
venv/
*.db
```

### 8. Content-Type Validation for JSON APIs

```python
from functools import wraps

def require_json(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if request.method in ('POST', 'PUT', 'PATCH'):
            ct = request.content_type or ''
            if 'application/json' not in ct:
                return jsonify({'error': 'Content-Type must be application/json'}), 415
        return f(*args, **kwargs)
    return decorated
```

Apply to auth blueprint or individual routes.

---

## Advanced Improvements

### 1. Multi-Factor Authentication (MFA)

- Integrate with a library like `pyotp` for TOTP (Google Authenticator-style)
- Per Microsoft, MFA stops 99.9% of automated attacks
- Implement as step-up auth (only for sensitive actions initially)
- Store TOTP secret per user, verify during login

### 2. CAPTCHA for Suspicious Logins

- Use Google reCAPTCHA v3 (invisible, no user friction)
- Score each login attempt; require v2 checkbox only for low-score requests
- Also protects against credential stuffing

### 3. Device Fingerprinting

- Collect browser fingerprint on login (user-agent, screen resolution, timezone, canvas fingerprint)
- Flag and alert on logins from unrecognized devices
- Send email notification for new-device logins

### 4. Risk-Based Authentication

- Score each login by: IP reputation, device fingerprint, geolocation, time since last login
- Step up auth (MFA/CAPTCHA) for high-risk attempts
- Block known-bad IPs at the network level

### 5. API Key Management (for future mobile/third-party clients)

- Generate scoped API keys with rate limits per key
- Support key rotation and revocation
- Never expose API keys in client-side code

### 6. Security Questions

- Avoid if possible (OWASP recommends against — answers are often guessable)
- If used, allow free-form answers (not multiple choice), hashed storage

---

## Infrastructure & DevOps

### Fly.io Volume Backup

The SQLite database lives on the `py_music_data` volume at `/app/data/strubloid.db`.

**Manual snapshot:**
```bash
flyctl ssh console -a py-music -C "cp /app/data/strubloid.db /app/data/backup-$(date +%Y%m%d).db"
```

**Scheduled backup:**
```bash
flyctl cron create 'backup-db' '0 3 * * *' -a py-music \
  --command "cp /app/data/strubloid.db /app/data/backup-$(date +%Y%m%d-%H%M).db && \
  find /app/data -name 'backup-*' -mtime +30 -delete"
```

### Environment Variable Checklist

Set these on Fly.io:
```bash
flyctl secrets set \
  SECRET_KEY="$(openssl rand -hex 32)" \
  FRONTEND_URL="https://py-music.fly.dev" \
  DATABASE_URL="sqlite:////app/data/strubloid.db" \
  -a py-music
```

Verify:
```bash
flyctl secrets list -a py-music
```

### Dependency Vulnerability Scanning

Add to requirements:
```
pip-audit>=2.7
```

Run before deploy:
```bash
pip-audit -r requirements.txt
```

---

## Ongoing Practices

| Practice | Frequency | Tool / Method |
|----------|-----------|---------------|
| Dependency audit | Weekly | `pip-audit -r requirements.txt` |
| Secret rotation | Quarterly | Generate new SECRET_KEY, update Fly secrets |
| DB backup | Daily | Cron + volume snapshot |
| Session review | Per deploy | Check cookies, headers, CORS config |
| Penetration test | Yearly | Manual review of all endpoints |
| Log review | Weekly | Check `/data/auth.log` for anomalies |
| CSP report review | Monthly | Check `/api/csp-violation` receiver logs |
| HaveIBeenPwned check | Per password | Integrate during registration/password-change |

---

## Reference: Implementation Examples

### Full Secure App Config Block

```python
# ─── Security Configuration ────────────────────────────────────────────────────

SECRET_KEY = os.getenv('SECRET_KEY')
if not SECRET_KEY:
    if os.getenv('FLASK_ENV') == 'production':
        raise RuntimeError('SECRET_KEY environment variable is required in production')
    SECRET_KEY = 'dev-secret-key-change-in-production'
app.config['SECRET_KEY'] = SECRET_KEY

# Session cookie hardening
app.config['SESSION_COOKIE_SECURE'] = True
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['SESSION_COOKIE_NAME'] = '__Host-py_music_session'  # __Host- prefix

# Request limits
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024

# CORS
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5000')
CORS(app, supports_credentials=True, origins=[FRONTEND_URL])


# ─── Strip Server Header ───────────────────────────────────────────────────────

@app.after_request
def remove_server_header(response):
    if 'Server' in response.headers:
        del response.headers['Server']
    return response


# ─── Security Headers ───────────────────────────────────────────────────────────

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
```

### Global JSON Error Handler

```python
from werkzeug.exceptions import HTTPException

@app.errorhandler(400)
@app.errorhandler(401)
@app.errorhandler(403)
@app.errorhandler(404)
@app.errorhandler(405)
@app.errorhandler(413)
@app.errorhandler(415)
@app.errorhandler(429)
@app.errorhandler(500)
def json_error(error):
    if isinstance(error, HTTPException):
        return jsonify({'error': error.description or 'Request error'}), error.code
    return jsonify({'error': 'Internal server error'}), 500
```

### Content-Type Enforcer Decorator

```python
from functools import wraps

def require_json_content_type(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if request.method in ('POST', 'PUT', 'PATCH'):
            ct = request.content_type or ''
            if 'application/json' not in ct:
                return jsonify({'error': 'Content-Type must be application/json'}), 415
        return f(*args, **kwargs)
    return decorated
```

### Rate-Limited Auth Login Pattern (Full)

```python
@auth_bp.route('/login', methods=['POST'])
@limiter.limit("5 per minute", override_defaults=False)
def login():
    data = request.get_json()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not email or not password:
        log_auth_event('login', email, False)
        return jsonify({'error': 'Email and password are required'}), 400

    # Check account lockout before querying
    if is_account_locked(email):
        log_auth_event('login', email, False)
        return jsonify({'error': 'Account temporarily locked. Try again in 15 minutes.'}), 429

    # Constant-time-ish query (always hits DB regardless of user existence)
    user = User.query.filter_by(email=email).first()

    if not user or not user.check_password(password):
        record_failed_attempt(email)
        log_auth_event('login', email, False)
        return jsonify({'error': 'Invalid email or password'}), 401

    # Regen session (Flask-Login does this, but ensure)
    login_user(user, remember=False)
    user.last_login = datetime.utcnow()
    db.session.commit()
    log_auth_event('login', email, True)

    return jsonify({'user': user.to_dict()}), 200
```

### Password Validation (NIST-Compliant)

```python
def validate_password_strength(password, mfa_enabled=False):
    errors = []
    min_len = 8 if mfa_enabled else 15
    if len(password) < min_len:
        errors.append(f'Password must be at least {min_len} characters')
    if len(password) > 64:
        errors.append('Password cannot exceed 64 characters')
    # Do NOT check for uppercase/lowercase/digit/special per NIST SP800-63B
    # Instead check against breached passwords
    if is_password_breached(password):
        errors.append('This password has been exposed in a data breach. Choose a different one.')
    return errors


HIBP_API = 'https://api.pwnedpasswords.com/range/'

def is_password_breached(password):
    """k-Anonymity check against HaveIBeenPwned. No plaintext sent."""
    sha1 = hashlib.sha1(password.encode()).hexdigest().upper()
    prefix, suffix = sha1[:5], sha1[5:]
    try:
        resp = requests.get(f'{HIBP_API}{prefix}', timeout=3)
        return suffix in resp.text
    except requests.RequestException:
        return False  # fail open — don't block registration if API is down
```

### Username Validation

```python
USERNAME_RE = re.compile(r'^[a-zA-Z0-9_-]{3,30}$')

def validate_username(username):
    if not USERNAME_RE.match(username):
        return 'Username must be 3-30 characters (letters, numbers, underscores, hyphens only)'
    return None
```

### CSP Violation Receiver

```python
@app.route('/api/csp-violation', methods=['POST'])
def csp_violation():
    """Receive CSP violation reports from the browser."""
    report = request.get_json(silent=True) or {}
    log_error('CSP', 'Content Security Policy violation', details=str(report))
    return '', 204
```

---

## Priority Summary

### ✅ Done (Deployed / Committed)
- [x] Secure session cookies (SameSite, Secure, custom name)
- [x] Restrict CORS origins to single frontend URL
- [x] Fail hard if SECRET_KEY unset in production
- [x] Add rate limiting on all auth endpoints (flask-limiter)
- [x] Add security headers (CSP with form-action + report-uri, HSTS, X-Frame-Options)
- [x] Protect `/api/daily-challenge/seed` with `@login_required`
- [x] Set `MAX_CONTENT_LENGTH` (16 MB)
- [x] Strip `Server` header, add global JSON error handler
- [x] CSRF protection (double-submit cookie pattern)
- [x] HTTPS redirect middleware
- [x] Account lockout after 5 failed attempts (in-memory)
- [x] Password validation (8+ chars, complexity, breached-password check via HIBP)
- [x] Auth audit logging (login/register/reset/failures)
- [x] Email format validation
- [x] Username charset validation (alphanumeric + underscore/hyphen, 3-30 chars)
- [x] Create `.dockerignore`
- [x] Add Content-Type enforcement decorator (`require_json_content_type`)
- [x] `.dockerignore` created
- [x] CSP violation monitoring endpoint (`/api/csp-violation`)
- [x] Session lifetime (30 day inactivity timeout)

### Do Before Next Deploy (Critical)
- [ ] ~~Secure session cookies~~ ✅ Done
- [ ] ~~Restrict CORS origins~~ ✅ Done
- [ ] ~~Fail hard if SECRET_KEY unset~~ ✅ Done
- [ ] ~~Add rate limiting~~ ✅ Done
- [ ] ~~Add security headers~~ ✅ Done
- [ ] ~~Protect seed endpoint~~ ✅ Done
- [ ] ~~Set MAX_CONTENT_LENGTH~~ ✅ Done
- [ ] ~~Strip Server header, error handler~~ ✅ Done

### This Week (High)
- [ ] ~~Account lockout~~ ✅ Done
- [ ] ~~NIST password policy~~ ✅ Partially (min 8 chars + HIBP check; composition rules still active)
- [ ] ~~Auth audit logging~~ ✅ Done
- [ ] ~~Input validation~~ ✅ Done (email + username)
- [ ] ~~Create .dockerignore~~ ✅ Done
- [ ] ~~Add Content-Type enforcement~~ ✅ Done
- [ ] Add re-authentication for password/email changes (current password required)
- [ ] Invalidate sessions on password change (clear other sessions)
- [ ] Add HIBP check to change-password flow

### This Month (Medium)
- [ ] Add `pip-audit` to CI/checks
- [ ] Set up DB backup cron
- [ ] Review raw SQL in `run_migrations()` — parameterize
- [ ] Switch to Postgres for better data safety
- [ ] Handle X-Forwarded-For for trusted proxies
- [ ] zxcvbn password strength meter on frontend
- [ ] NIST-compliant password policy (15 chars min, no composition rules, HIBP-only)

### Future (Low)
- [ ] MFA support (TOTP)
- [ ] CAPTCHA on auth endpoints
- [ ] Risk-based authentication
- [ ] Device fingerprinting + new-device alerts
- [ ] API key management
- [ ] Passwordless auth (WebAuthn/Passkeys)

---

## Appendix: OWASP References Consulted

| Cheat Sheet | Key Takeaways |
|-------------|---------------|
| [Authentication](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html) | NIST password guidelines, MFA, re-authentication, enumeration prevention |
| [Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html) | `__Host-` cookie prefix, entropy requirements, HttpOnly/Secure/SameSite |
| [CSRF Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html) | Synchronizer token pattern, SameSite, custom headers for APIs |
| [Content Security Policy](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html) | CSP directives, `form-action`, `frame-ancestors`, `report-uri` |
| [Credential Stuffing](https://cheatsheetseries.owasp.org/cheatsheets/Credential_Stuffing_Prevention_Cheat_Sheet.html) | MFA, CAPTCHA, device fingerprinting, IP intelligence |
| [Error Handling](https://cheatsheetseries.owasp.org/cheatsheets/Error_Handling_Cheat_Sheet.html) | Generic error responses, server-side logging, no stack traces |
| [Input Validation](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html) | Allowlist vs denylist, regex anchoring, Unicode handling |
| [REST Security](https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html) | HTTPS only, access control per endpoint, Content-Type enforcement |
| [Password Storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html) | bcrypt (already in use), pepper, key stretching |
| [Transport Layer Security](https://cheatsheetseries.owasp.org/cheatsheets/Transport_Layer_Security_Cheat_Sheet.html) | HSTS, secure cookies, TLS termination |

---

*Review date: 2026-07-08. Next review: 2026-10-08 or after any major feature addition.*
