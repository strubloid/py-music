# Security Assessment & Plan — py-music

> **Date:** 2026-07-08
> **Scope:** Full-stack Flask + React SPA with SQLite, deployed on Fly.io
> **Methodology:** Codebase audit + OWASP Top 10 (2021/2025) + Flask security best practices

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current Findings (Risk-Priority)](#current-findings)
3. [Immediate Fixes (Critical/High)](#immediate-fixes)
4. [Short-Term Improvements (Medium)](#short-term-improvements)
5. [Infrastructure & DevOps](#infrastructure--devops)
6. [Ongoing Practices](#ongoing-practices)
7. [Reference: Implementation Examples](#reference-implementation-examples)

---

## Executive Summary

The application has **no active security controls** beyond basic password hashing (bcrypt) and Flask-Login session management. It relies entirely on Fly.io's edge proxy for HTTPS and has no application-level security headers, rate limiting, CSRF protection, or brute-force mitigation. Because the app uses SQLite and runs on Fly.io with a volume mount (as of this writing), credential rotation and database backup should also be priority.

**Risk Level: HIGH** — the app is vulnerable to session hijacking, brute-force credential attacks, CSRF, clickjacking, and data scraping. No evidence of exploitation yet, but the surface is exposed.

---

## Current Findings

### Critical

| # | Finding | File | Impact |
|---|---------|------|--------|
| C1 | **No session cookie security flags** | `app.py` | Flask defaults: `SESSION_COOKIE_SECURE=False`, `SESSION_COOKIE_HTTPONLY=True` (default ok), `SESSION_COOKIE_SAMESITE=None`. Cookies sent over HTTP, no SameSite restriction — vulnerable to CSRF/session hijacking on man-in-the-middle. |
| C2 | **CORS wide open with credentials** | `app.py:36` | `CORS(app, supports_credentials=True)` with no `origins=` restriction. Any website can make credentialed requests to the API. |
| C3 | **SECRET_KEY falls back to hardcoded default** | `app.py:32` | `os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')` — if the env var is unset, the app uses a known public string. |
| C4 | **No rate limiting on auth endpoints** | `auth/__init__.py` | `/api/auth/login`, `/api/auth/register`, `/api/auth/forgot-password` have no throttling. Unlimited brute-force attempts. |

### High

| # | Finding | File | Impact |
|---|---------|------|--------|
| H1 | **No security headers** | `app.py` | Missing `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`, `Referrer-Policy`. |
| H2 | **No CSRF protection** | `auth/__init__.py` | Session cookie auth without CSRF token. Any cross-origin form POST can hijack a session. (Partially mitigated if SameSite=Lax is set — see C1.) |
| H3 | **No account lockout** | `auth/__init__.py` | Unlimited failed login attempts. No temporary lockout, no exponential backoff. |
| H4 | **Seed endpoint is unauthenticated** | `daily_challenges.py:728` | `POST /api/daily-challenge/seed` — anyone can wipe and regenerate the 1000-question challenge bank. |
| H5 | **Password policy too weak** | `auth/__init__.py:35` | Only `len(password) < 6` check. No complexity, no common-password check, no breach check. |

### Medium

| # | Finding | File | Impact |
|---|---------|------|--------|
| M1 | **No auth event audit logging** | `auth/__init__.py` | Successful logins, failed attempts, registrations, password resets are not logged. No forensic trail. |
| M2 | **No request body size limit** | `app.py` | No `MAX_CONTENT_LENGTH` set. Large payloads can exhaust memory. |
| M3 | **Fly.io `force_https` relies on proxy alone** | `fly.toml` | `force_https = true` at the Fly proxy level. If misconfigured or bypassed, the app itself doesn't enforce HTTPS. Should set `SESSION_COOKIE_SECURE=True` as defense-in-depth. |
| M4 | **No input validation beyond `strip()`** | `auth/__init__.py` | Email, username, password are only `.strip()`'d. No type/schema validation (e.g., email format, username charset). |
| M5 | **Test file sets OPENAI_API_KEY=test** | `test_auth.py:5` | `os.environ.setdefault('OPENAI_API_KEY', 'test')` — unnecessary env pollution, could mask missing-key issues. |

### Low

| # | Finding | File | Impact |
|---|---------|------|--------|
| L1 | **SQLite volume has no backup strategy** | `fly.toml` | The volume mount persists across deploys, but there's no backup/restore plan. |
| L2 | **No dependency vulnerability scanning** | `requirements.txt` | No `pip-audit`, `safety`, or Dependabot integration. |
| L3 | **Error logger leaks `request.remote_addr` to file** | `error_logger.py:60` | Logs client IPs to `/data/errors.md`. Not necessarily a vulnerability but worth noting for GDPR/PII compliance. |
| L4 | **No `.dockerignore`** | project root | Build context is 326MB — includes `.git/`, `node_modules/`, virtualenvs. Bloat and risk of leaking secrets. |

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

Set `FRONTEND_URL` in Fly.io secrets for production, default to the fly.dev domain.

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
    storage_uri="memory://",  # or "redis://" for multi-worker
)
```

Then decorate auth endpoints in `auth/__init__.py`:
```python
from flask_limiter import Limiter  # or use a shared instance

@auth_bp.route('/login', methods=['POST'])
@limiter.limit("5 per minute", override_defaults=False)
def login():
    ...
```

> **Note:** `memory://` is fine for single-worker Fly.io machines. If you scale horizontally, switch to `redis://`.

### 5. Add Security Headers

Add after the `app` creation in `app.py`:

```python
@app.after_request
def add_security_headers(response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    response.headers['Permissions-Policy'] = 'geolocation=(), microphone=(), camera=()'
    return response
```

For Content-Security-Policy, use this (adjust if you load external fonts/scripts):
```python
response.headers['Content-Security-Policy'] = (
    "default-src 'self'; "
    "script-src 'self'; "
    "style-src 'self' 'unsafe-inline'; "
    "img-src 'self' data:; "
    "font-src 'self'; "
    "connect-src 'self'; "
    "frame-ancestors 'none'"
)
```

### 6. Protect the Seed Endpoint

Add `@login_required` to `daily_challenges.py:728`:

```python
from flask_login import login_required

@daily_bp.route('/daily-challenge/seed', methods=['POST'])
@login_required
def seed():
    ...
```

Or gate it with an admin check if needed in the future.

### 7. Add Request Size Limit

```python
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16 MB
```

---

## Short-Term Improvements

### 1. Account Lockout / Brute Force Protection

Add a failed-attempts counter — either in-memory (for single-worker) or in the database:

```python
from datetime import datetime, timedelta
from functools import wraps

failed_attempts = {}  # in-memory; swap for DB/Redis in production

def rate_limit_account(email):
    key = f"login:{email}"
    now = datetime.utcnow()
    # Clean old entries
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

### 2. Password Policy

Add to `auth/__init__.py`:

```python
import re

def validate_password(password):
    errors = []
    if len(password) < 8:
        errors.append('Password must be at least 8 characters')
    if not re.search(r'[A-Z]', password):
        errors.append('Password needs an uppercase letter')
    if not re.search(r'[a-z]', password):
        errors.append('Password needs a lowercase letter')
    if not re.search(r'[0-9]', password):
        errors.append('Password needs a number')
    return errors
```

### 3. Auth Audit Logging

Log to a dedicated audit file (not errors.md) or database table:

```python
def log_auth_event(event_type, email, success, ip=None):
    """Log auth events: login, register, reset, logout."""
    entry = {
        'timestamp': datetime.utcnow().isoformat(),
        'event': event_type,
        'email': email,
        'success': success,
        'ip': ip or request.remote_addr,
    }
    # Append to /data/auth.log or insert into an audit_logs table
    # For simplicity, write to a structured log:
    log_path = Path(__file__).parent.parent.parent.parent / 'data' / 'auth.log'
    with open(log_path, 'a') as f:
        f.write(json.dumps(entry) + '\n')
```

Call it at each auth endpoint on success and failure.

### 4. Input Validation / Sanitization

Add email format validation:

```python
import re

EMAIL_RE = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')

def validate_email(email):
    return bool(EMAIL_RE.match(email))
```

### 5. Create `.dockerignore`

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
*.db  # don't bundle local SQLite; volume mount at runtime
```

---

## Infrastructure & DevOps

### Fly.io Volume Backup

The SQLite database lives on the `py_music_data` volume at `/app/data/strubloid.db`.

**Manual snapshot:**
```bash
flyctl ssh console -a py-music -C "cp /app/data/strubloid.db /app/data/backup-$(date +%Y%m%d).db"
```

**Better — scheduled backup via cron + Fly.io machines:**
- Add a separate Fly.io machine or a cron job that SSHes in nightly and uploads to S3-compatible storage.
- Or, set up a one-line cron:
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

Verify they're set:
```bash
flyctl secrets list -a py-music
```

### Dependency Vulnerability Scanning

Add to `requirements.txt` or as a dev dependency:
```
pip-audit>=2.7
```

Run before deploy:
```bash
pip-audit -r requirements.txt
```

Or add a GitHub Action (if project moves to GitHub):
```yaml
name: Security Audit
on:
  schedule:
    - cron: '0 6 * * 1'  # weekly
  push:
    branches: [main]
jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.10'
      - run: pip install pip-audit
      - run: pip-audit -r requirements.txt
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

---

## Reference: Implementation Examples

### Full Secure App Config Block

Paste this into `backend/project/api/app.py` after `app = Flask(...)`:

```python
# ─── Security Configuration ────────────────────────────────────────────────────

# SECRET_KEY — fail hard if not set in production
SECRET_KEY = os.getenv('SECRET_KEY')
if not SECRET_KEY:
    if os.getenv('FLASK_ENV') == 'production':
        raise RuntimeError('SECRET_KEY environment variable is required in production')
    SECRET_KEY = 'dev-secret-key-change-in-production'
app.config['SECRET_KEY'] = SECRET_KEY

# Session cookie hardening
app.config['SESSION_COOKIE_SECURE'] = True        # HTTPS only
app.config['SESSION_COOKIE_HTTPONLY'] = True       # not accessible to JS
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'      # CSRF mitigation
app.config['SESSION_COOKIE_NAME'] = 'py_music_session'  # non-default name

# Request limits
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16 MB

# CORS — restrict to known frontend origin
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5000')
CORS(app, supports_credentials=True, origins=[FRONTEND_URL])


# ─── Security Headers ───────────────────────────────────────────────────────────

@app.after_request
def add_security_headers(response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    response.headers['Permissions-Policy'] = 'geolocation=(), microphone=(), camera=()'
    # Content-Security-Policy — adjust for your external resources
    response.headers['Content-Security-Policy'] = (
        "default-src 'self'; "
        "script-src 'self'; "
        "style-src 'self' 'unsafe-inline'; "
        "img-src 'self' data:; "
        "font-src 'self'; "
        "connect-src 'self'; "
        "frame-ancestors 'none'"
    )
    return response
```

### Rate-Limited Auth Login Pattern

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

    user = User.query.filter_by(email=email).first()

    if not user or not user.check_password(password):
        record_failed_attempt(email)
        log_auth_event('login', email, False)
        return jsonify({'error': 'Invalid email or password'}), 401

    login_user(user)
    user.last_login = datetime.utcnow()
    db.session.commit()
    log_auth_event('login', email, True)
    return jsonify({'user': user.to_dict()}), 200
```

### Complete Password Validation

```python
def validate_password_strength(password):
    errors = []
    if len(password) < 8:
        errors.append('Password must be at least 8 characters')
    if not re.search(r'[A-Z]', password):
        errors.append('Password must contain an uppercase letter')
    if not re.search(r'[a-z]', password):
        errors.append('Password must contain a lowercase letter')
    if not re.search(r'[0-9]', password):
        errors.append('Password must contain a digit')
    if not re.search(r'[!@#$%^&*(),.?":{}|<>_]', password):
        errors.append('Password must contain a special character')
    return errors
```

---

## Priority Summary

### Do Before Next Deploy (Critical)
- [ ] Secure session cookies (SameSite, Secure)
- [ ] Restrict CORS origins
- [ ] Fail hard if SECRET_KEY unset, set it on Fly.io
- [ ] Add rate limiting on `/api/auth/login`
- [ ] Add security headers (CSP, HSTS, X-Frame-Options)
- [ ] Protect `/api/daily-challenge/seed` with `@login_required`
- [ ] Set `MAX_CONTENT_LENGTH`

### This Week (High)
- [ ] Account lockout after 5 failed attempts
- [ ] Password policy (8+ chars, upper/lower/digit)
- [ ] Auth audit logging (login/register/reset/failures)
- [ ] Input validation (email format)
- [ ] Create `.dockerignore`

### This Month (Medium)
- [ ] Add `pip-audit` to CI/checks
- [ ] Set up DB backup cron
- [ ] Add CSRF token flow for state-changing SPA requests
- [ ] Review raw SQL in `run_migrations()` — parameterize
- [ ] Switch to Postgres for better data safety

### Quarterly
- [ ] Rotate SECRET_KEY and any API keys
- [ ] Full dependency audit
- [ ] Review auth.log for anomalies

---

## Appendix: Security Architecture Diagram (Current)

```
Browser ──HTTPS──> Fly.io Proxy ──HTTP──> Flask App
                                              │
                                              │  Session (Flask-Login)
                                              │  SQLite (/app/data/)
                                              │  No headers ❌
                                              │  No rate limit ❌
                                              │  No CSRF ❌
                                              │  CORS: any origin ✅❌
```

## Appendix: Security Architecture Diagram (Target)

```
Browser ──HTTPS──> Fly.io Proxy ──HTTP──> Flask App
  │                                          │
  │  CSP headers                             │  Session (Secure+SameSite+Lax)
  │  HSTS                                    │  Rate-limited auth endpoints
  │  X-Frame-Options: DENY                   │  CSRF tokens for writes
  │                                          │  Audit logging
  │                                          │  SQLite via Fly.io volume + backups
  │                                          │  CORS: single origin
  │                                          │  MAX_CONTENT_LENGTH
```

---

*Review date: 2026-07-08. Next review: 2026-10-08 or after any major feature addition.*
