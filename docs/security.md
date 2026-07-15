# Security

## Current Baseline

The Flask application uses server sessions, bcrypt password hashes, CSRF double-submit tokens, secure production cookies, CORS restricted to the configured frontend origin, request-size limits, rate limiting, security headers, HTTPS enforcement, JSON error responses, and a protected Daily seed endpoint.

Security behavior is implemented primarily in `backend/project/api/app.py`, `backend/project/auth/`, `backend/project/extensions.py`, and `backend/project/api/daily_challenges.py`.

## Required Controls

- Production requires `SECRET_KEY`; never add a production fallback.
- State-changing browser requests require valid CSRF tokens and JSON content type.
- Cookies are `HttpOnly`, `SameSite=Lax`, and `Secure` in production.
- CORS allows only `FRONTEND_URL` with credentials.
- CSP, HSTS, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, and Permissions Policy remain enabled.
- Authentication and completion routes remain rate-limited.
- Rewards, rank entitlements, and content administration remain server-authoritative.
- Never commit secrets, databases, sample caches, or local environment files.

## Before Deploying

1. Set `SECRET_KEY`, `FRONTEND_URL`, and `DATABASE_URL` in Fly secrets.
2. Build the frontend and run backend and frontend tests.
3. Verify `/api/health`, login, CSRF rejection, protected seed endpoint, and production headers.
4. Review dependency updates and run a dependency audit when the tooling is available.
5. Confirm the persistent database has a backup/recovery process.

## Remaining Work

- Require current-password confirmation and invalidate active sessions for password/email changes.
- Add a password-strength meter and complete breached-password coverage for every password-change route.
- Add dependency scanning in CI and an automated database backup process.
- Review trusted-proxy/IP configuration before changing rate-limit storage or deployment topology.
- Consider MFA/passkeys only after the core authentication and recovery flow is complete.

## Reporting

Do not put vulnerability details in public issue text. Record reproducible security findings with affected routes, impact, evidence, and a remediation test; then update this guide when a control changes.
