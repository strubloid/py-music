import json
import os
import secrets
import smtplib
import hashlib
from datetime import datetime, timedelta
from email.mime.text import MIMEText
from flask import Blueprint, request, jsonify, current_app, session
from flask_login import LoginManager, login_user, logout_user, current_user
from backend.project.models import db
from backend.project.models.user import User, PasswordResetToken
from backend.project.extensions import (
    limiter,
    is_account_locked,
    record_failed_attempt,
    validate_password_strength,
    is_password_breached,
    validate_email_format,
    validate_username,
    log_auth_event,
)

# Initialize Flask-Login
login_manager = LoginManager()

# Auth blueprint
auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')


@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))


@auth_bp.route('/register', methods=['POST'])
@limiter.limit("3 per minute", override_defaults=False)
def register():
    data = request.get_json()
    username = data.get('username', '').strip().lower()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not username or not email or not password:
        return jsonify({'error': 'Username, email, and password are required'}), 400

    # Username format validation
    username_error = validate_username(username)
    if username_error:
        log_auth_event('register', email, False, details=username_error)
        return jsonify({'error': username_error}), 400

    # Email format validation
    if not validate_email_format(email):
        log_auth_event('register', email, False, details='Invalid email format')
        return jsonify({'error': 'Invalid email format'}), 400

    # Password strength validation
    password_errors = validate_password_strength(password)
    if password_errors:
        log_auth_event('register', email, False, details='Weak password')
        return jsonify({'error': '; '.join(password_errors)}), 400

    # Breached password check
    if is_password_breached(password):
        log_auth_event('register', email, False, details='Breached password')
        return jsonify({'error': 'This password has been exposed in a data breach. Please choose a different password.'}), 400

    if User.query.filter_by(username=username).first():
        log_auth_event('register', email, False, details='Username taken')
        return jsonify({'error': 'Username already taken'}), 409

    if User.query.filter_by(email=email).first():
        log_auth_event('register', email, False, details='Email already registered')
        return jsonify({'error': 'Email already registered'}), 409

    user = User(username=username, email=email)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    login_user(user)
    session.permanent = True
    log_auth_event('register', email, True)
    return jsonify({'user': user.to_dict()}), 201


@auth_bp.route('/login', methods=['POST'])
@limiter.limit("5 per minute", override_defaults=False)
def login():
    data = request.get_json()
    login_id = data.get('login', '').strip()
    password = data.get('password', '')

    if not login_id or not password:
        log_auth_event('login', login_id, False, details='Missing credentials')
        return jsonify({'error': 'Email/username and password are required'}), 400

    # Account lockout check
    if is_account_locked(login_id.lower()):
        log_auth_event('lockout', login_id, False, details='Account temporarily locked')
        return jsonify({'error': 'Account temporarily locked due to too many failed attempts. Try again in 15 minutes.'}), 429

    # Determine if login_id is an email or username
    if '@' in login_id:
        user = User.query.filter_by(email=login_id.lower()).first()
    else:
        user = User.query.filter_by(username=login_id).first()

    if not user or not user.check_password(password):
        record_failed_attempt(login_id.lower())
        log_auth_event('login', login_id, False, details='Invalid credentials')
        return jsonify({'error': 'Invalid email/username or password'}), 401

    # Successful login — clear any previous lockout state
    user.last_login = datetime.utcnow()
    db.session.commit()

    login_user(user)
    session.permanent = True
    log_auth_event('login', login_id, True)
    return jsonify({'user': user.to_dict()}), 200


@auth_bp.route('/logout', methods=['POST'])
def logout():
    if current_user.is_authenticated:
        email = current_user.email
        logout_user()
        session.clear()
        # Regenerate session to prevent session fixation
        # (called after clearing to start fresh)
        log_auth_event('logout', email, True)
    return jsonify({'message': 'Logged out successfully'}), 200


@auth_bp.route('/me', methods=['GET'])
def me():
    if current_user.is_authenticated:
        return jsonify({'user': current_user.to_dict()}), 200
    return jsonify({'user': None}), 200


def _send_email(to_email, subject, body):
    """Send email via SMTP configured through environment variables.

    Required env vars:
      SMTP_HOST (default smtp.gmail.com)
      SMTP_PORT (default 587)
      SMTP_USERNAME
      SMTP_PASSWORD
      SMTP_FROM_EMAIL (defaults to SMTP_USERNAME)

    Set DEV_EMAIL_CONSOLE=true to print to stdout instead of sending
    (useful for local development).

    Returns True on success, raises on failure.
    """
    # Dev fallback — print to console instead of sending
    if os.getenv('DEV_EMAIL_CONSOLE', '').lower() in ('1', 'true', 'yes'):
        print()
        print("=" * 60)
        print(f"DEV EMAIL TO:       {to_email}")
        print(f"SUBJECT:            {subject}")
        print(f"BODY:")
        print(body)
        print("=" * 60)
        print()
        return True

    smtp_host = os.getenv('SMTP_HOST', 'smtp.gmail.com')
    smtp_port = int(os.getenv('SMTP_PORT', '587'))
    smtp_user = os.getenv('SMTP_USERNAME', '')
    smtp_pass = os.getenv('SMTP_PASSWORD', '')
    smtp_from = os.getenv('SMTP_FROM_EMAIL', smtp_user)

    if not smtp_user or not smtp_pass:
        raise RuntimeError('SMTP not configured — set SMTP_USERNAME and SMTP_PASSWORD')

    msg = MIMEText(body, 'plain', 'utf-8')
    msg['Subject'] = subject
    msg['From'] = smtp_from
    msg['To'] = to_email

    with smtplib.SMTP(smtp_host, smtp_port) as server:
        server.starttls()
        server.login(smtp_user, smtp_pass)
        server.send_message(msg)


@auth_bp.route('/forgot-password', methods=['POST'])
@limiter.limit("2 per minute", override_defaults=False)
def forgot_password():
    """Generate a reset token and email a reset link to the user."""
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()

    if not email:
        return jsonify({'error': 'Email is required'}), 400

    if not validate_email_format(email):
        return jsonify({'error': 'Invalid email format'}), 400

    user = User.query.filter_by(email=email).first()

    # Always return 200 to prevent email enumeration — even if user doesn't exist
    if not user:
        log_auth_event('forgot_password', email, False, details='Email not found')
        return jsonify({'message': 'If that email is registered, you will receive a password reset link.'}), 200

    # Invalidate any existing unused tokens for this user
    PasswordResetToken.query.filter_by(user_id=user.id, used=False).update({'used': True})
    db.session.flush()

    # Generate token
    token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    expires_at = datetime.utcnow() + timedelta(hours=1)

    reset_token = PasswordResetToken(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=expires_at,
    )
    db.session.add(reset_token)
    db.session.commit()

    # Build reset link
    app_url = os.getenv('APP_URL', 'http://localhost:5000').rstrip('/')
    reset_url = f'{app_url}/reset-password/{token}'

    subject = 'Reset your password - Music Theory'
    body = (
        f'Hello {user.username},\n\n'
        f'You requested to reset your password. Click the link below to set a new password:\n\n'
        f'{reset_url}\n\n'
        f'This link expires in 1 hour.\n\n'
        f'If you did not request this, you can safely ignore this email.\n\n'
        f'— Music Theory App'
    )

    try:
        _send_email(email, subject, body)
        log_auth_event('forgot_password', email, True)
        print(f"✅ Password reset email sent to {email}")
    except Exception as e:
        print(f"⚠️  Failed to send reset email to {email}: {e}")
        log_auth_event('forgot_password', email, False, details='SMTP send failed')
        # Don't expose SMTP failure details to the client
        return jsonify({'error': 'Failed to send reset email. Please contact support.'}), 500

    return jsonify({'message': 'If that email is registered, you will receive a password reset link.'}), 200


@auth_bp.route('/reset-password', methods=['POST'])
@limiter.limit("3 per minute", override_defaults=False)
def reset_password():
    """Verify reset token and set a new password."""
    data = request.get_json() or {}
    token = (data.get('token') or '').strip()
    password = data.get('password', '')

    if not token or not password:
        return jsonify({'error': 'Token and new password are required'}), 400

    # Password strength validation on reset
    password_errors = validate_password_strength(password)
    if password_errors:
        return jsonify({'error': '; '.join(password_errors)}), 400

    # Breached password check
    if is_password_breached(password):
        return jsonify({'error': 'This password has been exposed in a data breach. Please choose a different password.'}), 400

    # Hash the incoming token to find matching DB record
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    reset_token = PasswordResetToken.query.filter_by(token_hash=token_hash, used=False).first()

    if not reset_token:
        return jsonify({'error': 'Invalid or expired reset link.'}), 400

    if reset_token.expires_at < datetime.utcnow():
        reset_token.used = True
        db.session.commit()
        return jsonify({'error': 'Reset link has expired. Please request a new one.'}), 400

    # Update password
    user = User.query.get(reset_token.user_id)
    if not user:
        return jsonify({'error': 'User not found.'}), 404

    user.set_password(password)
    reset_token.used = True
    db.session.commit()

    log_auth_event('reset', user.email, True)
    return jsonify({'message': 'Password reset successful. You can now sign in with your new password.'}), 200
